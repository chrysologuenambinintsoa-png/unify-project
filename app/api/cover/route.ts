import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import imageSize from 'image-size';
import { getNotificationMessage, getNotificationTitle } from '@/lib/translations';
import { publishNotificationToUsers } from '@/app/api/realtime/broadcast';
import { formatActivityMessage } from '@/lib/serverTranslations';

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

// POST /api/cover - Upload user cover image, or set existing gallery photo as cover
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let coverUrl: string | null = null;

    // Check if this is JSON request with photoId (using existing gallery photo)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.json();
        const photoId = body.photoId;

        if (photoId) {
          // Get the photo from photoGallery
          const photo = await (prisma as any).photoGallery.findUnique({
            where: { id: photoId },
          });

          if (!photo || photo.userId !== session.user.id) {
            return NextResponse.json(
              { error: 'Photo not found or unauthorized' },
              { status: 404 }
            );
          }

          coverUrl = photo.url;
        }
      } catch (jsonErr) {
        // Continue - might be FormData instead
      }
    }

    // If not from photoId, process as file upload
    if (!coverUrl) {
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

      // Validate image dimensions (max 1024x1024)
      try {
        // @ts-ignore
        const dims = imageSize(buffer);
        if (dims && typeof dims.width === 'number' && typeof dims.height === 'number') {
          if (dims.width > 1024 || dims.height > 1024) {
            return NextResponse.json({ error: 'Image dimensions too large. Maximum allowed is 1024x1024 px.' }, { status: 400 });
          }
        }
      } catch (err) {
        return NextResponse.json({ error: 'Unable to read image dimensions.' }, { status: 400 });
      }

      // Upload to Cloudinary with timeout
      const uploadResult = await withTimeout(
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'unify/covers',
              // Store original image - transformations applied on display
              quality: 'auto',
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

      coverUrl = (uploadResult as any).secure_url;
    }

    // Update user cover image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { coverImage: coverUrl },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        coverImage: true,
      },
    });

    // Also create an entry in photoGallery for consistency with other photos
    try {
      await (prisma as any).photoGallery.create({
        data: {
          userId: session.user.id,
          url: coverUrl,
          type: 'cover',
          caption: null,
        },
      });
    } catch (photoErr) {
      console.warn('Failed to create photoGallery entry for cover photo:', photoErr);
      // Continue - the main cover update succeeded
    }

    // Create a post for cover change visibility
    try {
      const post = await (prisma as any).post.create({
        data: {
          userId: session.user.id,
          content: `${updatedUser.fullName || updatedUser.username} updated their cover photo`,
          contentType: 'coverPhotoChange',
          isPublic: true,
          background: null,
          media: {
            create: {
              type: 'image',
              url: coverUrl,
            },
          },
        },
        include: { media: true },
      });
    } catch (postErr) {
      console.warn('Failed to create post for cover change:', postErr);
      // Continue - the main cover update succeeded
    }

    // Notify friends ONLY (accepted friendships)
    // Do NOT create a public post - just send notifications to friends
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

      const friendIds = friendships
        .map(f => f.user1Id === session.user.id ? f.user2Id : f.user1Id)
        .filter(id => id !== session.user.id); // Exclude the user from their own notifications

      if (friendIds.length > 0) {
        const actorName = updatedUser.fullName || updatedUser.username || 'Utilisateur';
        const notificationTitle = getNotificationTitle('coverChange', 'fr');
        const notificationContent = getNotificationMessage('coverChange', actorName, 'fr');
        const notificationUrl = `/users/${updatedUser.id}`;
        
        const notifData = friendIds.map((fid) => ({
          type: 'profile',
          title: notificationTitle,
          content: notificationContent,
          url: notificationUrl,
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
            url: notificationUrl,
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

    // Also delete photoGallery entries with type 'cover' for this user
    try {
      await (prisma as any).photoGallery.deleteMany({
        where: {
          userId: session.user.id,
          type: 'cover',
        },
      });
    } catch (photoErr) {
      console.warn('Failed to delete photoGallery cover photos:', photoErr);
      // Continue - the main cover deletion succeeded
    }

    // Also delete posts created for cover changes
    try {
      await (prisma as any).post.deleteMany({
        where: {
          userId: session.user.id,
          content: {
            contains: 'updated their cover photo',
          },
        },
      });
    } catch (postErr) {
      console.warn('Failed to delete posts for cover changes:', postErr);
      // Continue - the main cover deletion succeeded
    }

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
