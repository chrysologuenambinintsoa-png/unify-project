import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/share - Share a post to message or group
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await context.params;
    const body = await request.json();
    const { shareType, recipientId, groupId, message } = body;

    // Validate request body
    if (!shareType || !['message', 'group'].includes(shareType)) {
      return NextResponse.json(
        { error: 'Invalid shareType. Must be "message" or "group"' },
        { status: 400 }
      );
    }

    if (shareType === 'message' && !recipientId) {
      return NextResponse.json(
        { error: 'recipientId is required for message share' },
        { status: 400 }
      );
    }

    if (shareType === 'group' && !groupId) {
      return NextResponse.json(
        { error: 'groupId is required for group share' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Share as private message
    if (shareType === 'message') {
      // Verify recipient exists and is a friend
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 404 }
        );
      }

      // Check if users are friends
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: session.user.id, user2Id: recipientId, status: 'accepted' },
            { user1Id: recipientId, user2Id: session.user.id, status: 'accepted' },
          ],
        },
      });

      if (!friendship) {
        return NextResponse.json(
          { error: 'User is not your friend' },
          { status: 403 }
        );
      }

      // Create message with shared post
      const sharedMessage = await prisma.message.create({
        data: {
          content: message || `Check out this post: ${post.content?.substring(0, 100) || 'A post'}`,
          senderId: session.user.id,
          receiverId: recipientId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          shareType: 'message',
          message: sharedMessage,
          note: 'Post link can be added in the message content or handled by the frontend',
        },
        { status: 201 }
      );
    }

    // Share to group
    if (shareType === 'group') {
      // Verify group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Verify user is a member of the group
      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'You are not a member of this group' },
          { status: 403 }
        );
      }

      // Create a group post with shared content
      const groupPost = await prisma.groupPost.create({
        data: {
          content: message || `Shared from ${post.user.fullName || post.user.username}:\n\n${post.content || ''}`,
          authorId: session.user.id,
          groupId: groupId,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          shareType: 'group',
          post: groupPost,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sharing post:', errorMsg, error);
    return NextResponse.json(
      { error: 'Failed to share post', details: errorMsg },
      { status: 500 }
    );
  }
}
