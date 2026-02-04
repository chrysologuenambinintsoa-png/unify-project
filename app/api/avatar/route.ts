import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveProfilePhoto, deleteProfilePhotoByPath } from '@/lib/profilePhoto';
import { getNotificationMessage, getNotificationTitle } from '@/lib/translations';
import { publishNotificationToUsers } from '@/app/api/realtime/broadcast';

// local filesystem-based avatar storage is used (preserve original binary)

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

    // Update user avatar in database with relative URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: saveResult.url },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    // Create a post announcing the profile photo change (so it appears on home feed)
    let profileChangePostId: string | null = null;
    try {
      const actorName = updatedUser.fullName || updatedUser.username || 'Utilisateur';
      const content = getNotificationMessage('avatarChange', actorName, 'fr');

      if (updatedUser.avatar) {
        const profileChangePost = await prisma.post.create({
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
        profileChangePostId = profileChangePost.id;
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
        const notificationUrl = profileChangePostId ? `/posts/${profileChangePostId}` : `/users/${updatedUser.id}`;
        
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