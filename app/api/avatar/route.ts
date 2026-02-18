import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveProfilePhoto, deleteProfilePhotoByPath } from '@/lib/profilePhoto';
import { getNotificationMessage, getNotificationTitle } from '@/lib/translations';
import { publishNotificationToUsers } from '@/app/api/realtime/broadcast';

// local filesystem-based avatar storage is used (preserve original binary)

// POST /api/avatar - Upload user avatar, or set existing gallery photo as avatar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let avatarUrl: string | null = null;

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

          avatarUrl = photo.url;
        }
      } catch (jsonErr) {
        // Continue - might be FormData instead
      }
    }

    // If not from photoId, process as file upload
    if (!avatarUrl) {
      const formData = await request.formData();
      const file = formData.get('avatar') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save to local uploads directory (preserve original binary, no resizing)
      let saveResult;
      try {
        saveResult = await saveProfilePhoto(session.user.id, buffer, (file as any).name || `avatar_${Date.now()}`, (file as any).type || 'image/jpeg');
      } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to save avatar' }, { status: 400 });
      }

      avatarUrl = saveResult.url;
    }

    // Update user avatar in database with relative URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    // Also create an entry in photoGallery for consistency with other photos
    try {
      await (prisma as any).photoGallery.create({
        data: {
          userId: session.user.id,
          url: avatarUrl,
          type: 'profile',
          caption: null,
        },
      });
    } catch (photoErr) {
      console.warn('Failed to create photoGallery entry for profile photo:', photoErr);
      // Continue - the main avatar update succeeded
    }

    // Create a post for avatar change visibility
    try {
      const post = await (prisma as any).post.create({
        data: {
          userId: session.user.id,
          content: `${updatedUser.fullName || updatedUser.username} updated their profile photo`,
          isPublic: true,
          background: null,
          media: {
            create: {
              type: 'image',
              url: avatarUrl,
            },
          },
        },
        include: { media: true },
      });
    } catch (postErr) {
      console.warn('Failed to create post for avatar change:', postErr);
      // Continue - the main avatar update succeeded
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
        const notificationTitle = getNotificationTitle('avatarChange', 'fr');
        const notificationContent = getNotificationMessage('avatarChange', actorName, 'fr');
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
      try {
        // If avatar is a local uploads path, delete the file from disk
        if (user.avatar.startsWith('/uploads/avatars/')) {
          const absolutePath = `${process.cwd()}/public${user.avatar}`;
          await deleteProfilePhotoByPath(absolutePath);
        }
      } catch (err) {
        console.warn('Failed to delete local avatar file:', err);
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

    // Also delete photoGallery entries with type 'profile' for this user
    try {
      await (prisma as any).photoGallery.deleteMany({
        where: {
          userId: session.user.id,
          type: 'profile',
        },
      });
    } catch (photoErr) {
      console.warn('Failed to delete photoGallery profile photos:', photoErr);
      // Continue - the main avatar deletion succeeded
    }

    // Also delete posts created for avatar changes
    try {
      await (prisma as any).post.deleteMany({
        where: {
          userId: session.user.id,
          content: {
            contains: 'updated their profile photo',
          },
        },
      });
    } catch (postErr) {
      console.warn('Failed to delete posts for avatar changes:', postErr);
      // Continue - the main avatar deletion succeeded
    }

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