import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all accepted friendships with users
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            user1Id: userId,
            status: 'accepted',
          },
          {
            user2Id: userId,
            status: 'accepted',
          },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      take: limit,
    });

    // Extract the friend users (not the current user)
    const friends = friendships.map((friendship) => {
      const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1;
      return {
        ...friend,
        friendshipId: friendship.id,
      };
    });

    // Filter by search query if provided
    const filteredFriends = search
      ? friends.filter(
          (friend) =>
            (friend.fullName || '').toLowerCase().includes(search) ||
            (friend.username || '').toLowerCase().includes(search)
        )
      : friends;

    // Get recent conversations with messages
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
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
      take: 100,
    });

    // Get unique conversation partners with last message info
    const conversationMap = new Map();
    conversations.forEach((message) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversationMap.has(partnerId)) {
        const partner = message.senderId === userId ? message.receiver : message.sender;
        conversationMap.set(partnerId, {
          ...partner,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.senderId !== userId && !message.isRead ? 1 : 0,
        });
      }
    });

    // Combine friends list with conversation data
    const friendsWithConversations = filteredFriends.map((friend) => ({
      ...friend,
      ...(conversationMap.get(friend.id) || {
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: 0,
      }),
    }));

    // Sort by last message time (conversations first, then other friends)
    friendsWithConversations.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return (a.fullName || '').localeCompare(b.fullName || '');
    });

    return NextResponse.json({
      friends: friendsWithConversations,
      count: friendsWithConversations.length,
    });
  } catch (error) {
    console.error('Error fetching friends for messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}
