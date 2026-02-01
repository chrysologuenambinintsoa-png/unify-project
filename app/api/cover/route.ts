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
  timeout: 60000,
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

// POST /api/cover - Upload user cover image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for cover)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with timeout
    const uploadResult = await withTimeout(
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'unify/covers',
            transformation: [
              { width: 1200, height: 300, crop: 'fill' },
              { quality: 'auto' }
            ],
            public_id: `user_cover_${session.user.id}_${Date.now()}`,
            timeout: 60000,
            chunk_size: 5242880,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      }),
      70000
    );

    // Update user cover image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { coverImage: (uploadResult as any).secure_url },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        coverImage: true,
      },
    });

    // Create a post announcing the cover image change
    try {
      const actorName = updatedUser.fullName || updatedUser.username || 'Utilisateur';
      const content = getNotificationMessage('coverChange', actorName, 'fr');

      if (updatedUser.coverImage) {
        await prisma.post.create({
          data: {
            content,
            userId: updatedUser.id,
            media: {
              create: [
                {
                  type: 'image',
                  url: updatedUser.coverImage,
                },
              ],
            },
          },
        });
      }
    } catch (postErr) {
      console.error('Failed to create cover-change post:', postErr);
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
        const notificationTitle = getNotificationTitle('coverChange', 'fr');
        const notificationContent = getNotificationMessage('coverChange', actorName, 'fr');
        
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
      console.error('Failed to create cover-change notifications:', notifErr);
    }

    return NextResponse.json({
      success: true,
      coverImage: updatedUser.coverImage,
      user: updatedUser,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading cover:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to upload cover', details: errorMsg },
      { status: 500 }
    );
  }
}

// DELETE /api/cover - Remove user cover image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to find cover URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coverImage: true },
    });

    if (user?.coverImage) {
      // Extract public_id from Cloudinary URL
      const publicId = user.coverImage.split('/').pop()?.split('.')[0];
      if (publicId) {
        try {
          await withTimeout(
            Promise.resolve(cloudinary.uploader.destroy(`unify/covers/${publicId}`)),
            30000
          );
        } catch (cloudinaryError) {
          console.warn('Failed to delete from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Update user cover to null
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { coverImage: null },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        coverImage: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting cover:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to delete cover', details: errorMsg },
      { status: 500 }
    );
  }
}
