import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { getNotificationMessage, getNotificationTitle } from '@/lib/translations';
import { publishNotificationToUsers } from '@/app/api/realtime/broadcast';

// Configure Cloudinary with timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 60000, // 60 seconds timeout
});

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout exceeded')), timeoutMs)
    ),
  ]);
}

// POST /api/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with timeout
    const uploadResult = await withTimeout(
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'unify/avatars',
            transformation: [
              { width: 400, height: 400, crop: 'fill' },
              { quality: 'auto' }
            ],
            public_id: `user_${session.user.id}_${Date.now()}`,
            timeout: 60000,
            chunk_size: 5242880, // 5MB chunks
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      }),
      70000 // 70s overall timeout
    );

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: (uploadResult as any).secure_url },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    // Create a post announcing the profile photo change (so it appears on home feed)
    try {
      const actorName = updatedUser.fullName || updatedUser.username || 'Utilisateur';
      const content = getNotificationMessage('avatarChange', actorName, 'fr');

      if (updatedUser.avatar) {
        await prisma.post.create({
          data: {
            content,
            userId: updatedUser.id,
            media: {
              create: [
                {
                  type: 'image',
                  url: updatedUser.avatar,
                },
              ],
            },
          },
        });
      }
    } catch (postErr) {
      console.error('Failed to create profile-change post:', postErr);
    }

    // Notify friends (accepted friendships)
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: session.user.id, status: 'accepted' },
            { user2Id: session.user.id, status: 'accepted' },
          ],
        },
        select: { user1Id: true, user2Id: true },
      });

      const friendIds = friendships.map(f => f.user1Id === session.user.id ? f.user2Id : f.user1Id);

      if (friendIds.length > 0) {
        const actorName = updatedUser.fullName || updatedUser.username || 'Utilisateur';
        const notificationTitle = getNotificationTitle('avatarChange', 'fr');
        const notificationContent = getNotificationMessage('avatarChange', actorName, 'fr');
        
        const notifData = friendIds.map((fid) => ({
          type: 'profile',
          title: notificationTitle,
          content: notificationContent,
          url: `/users/${updatedUser.id}`,
          userId: fid,
          actorId: updatedUser.id,
        }));

        await prisma.notification.createMany({ data: notifData, skipDuplicates: true });
        
        // Publish via SSE to connected clients
        friendIds.forEach(friendId => {
          publishNotificationToUsers([friendId], {
            id: `notif_${updatedUser.id}_${Date.now()}`,
            type: 'profile',
            title: notificationTitle,
            content: notificationContent,
            url: `/users/${updatedUser.id}`,
            actorId: updatedUser.id,
            createdAt: new Date(),
          });
        });
      }
    } catch (notifErr) {
      console.error('Failed to create profile-change notifications:', notifErr);
    }

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar,
      user: updatedUser,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading avatar:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to upload avatar', details: errorMsg },
      { status: 500 }
    );
  }
}

// DELETE /api/avatar - Remove user avatar
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to find avatar URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    if (user?.avatar) {
      // Extract public_id from Cloudinary URL
      const publicId = user.avatar.split('/').pop()?.split('.')[0];
      if (publicId) {
        try {
          await withTimeout(
            Promise.resolve(cloudinary.uploader.destroy(`unify/avatars/${publicId}`)),
            30000 // 30s timeout for deletion
          );
        } catch (cloudinaryError) {
          console.warn('Failed to delete from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Update user avatar to null
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting avatar:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to delete avatar', details: errorMsg },
      { status: 500 }
    );
  }
}