import { User } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      fullName?: string;
      avatar?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username?: string;
    fullName?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

export interface ExtendedUser extends Omit<User, 'password'> {
  followerCount?: number;
  followingCount?: number;
}

export interface PostWithDetails {
  id: string;
  content: string;
  background?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  user: ExtendedUser;
  media: PostMedia[];
  comments: CommentWithUser[];
  likes: LikeWithUser[];
  reactions: Reaction[];
  _count?: {
    comments: number;
    likes: number;
    reactions: number;
  };
}

export interface CommentWithUser {
  id: string;
  content: string;
  createdAt: Date;
  user: ExtendedUser;
  replies?: CommentWithUser[];
}

export interface LikeWithUser {
  id: string;
  userId: string;
  user: ExtendedUser;
}

export interface PostMedia {
  id: string;
  type: string;
  url: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: ExtendedUser;
}

export interface MessageWithDetails {
  id: string;
  content: string;
  image?: string | null;
  document?: string | null;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  sender: ExtendedUser;
  receiver: ExtendedUser;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: ExtendedUser;
}

export interface StoryWithDetails {
  id: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  text?: string | null;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user: ExtendedUser;
  views: StoryView[];
  reactions: StoryReaction[];
  _count?: {
    views: number;
    reactions: number;
  };
}

export interface StoryView {
  id: string;
  userId: string;
  user: ExtendedUser;
  viewedAt: Date;
}

export interface StoryReaction {
  id: string;
  emoji: string;
  userId: string;
  user: ExtendedUser;
}

export interface NotificationWithDetails {
  id: string;
  type: string;
  title: string;
  content?: string | null;
  isRead: boolean;
  createdAt: Date;
  user: ExtendedUser;
  actor?: ExtendedUser;
}

export interface GroupWithDetails {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isPrivate: boolean;
  createdAt: Date;
  _count?: {
    members: number;
    posts: number;
  };
}

export interface PageWithDetails {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  coverImage?: string | null;
  isVerified: boolean;
  createdAt: Date;
  _count?: {
    members: number;
    posts: number;
  };
}

export interface FriendshipWithUser {
  id: string;
  status: string;
  user1: ExtendedUser;
  user2: ExtendedUser;
  createdAt: Date;
}

export interface NotificationCounter {
  messages: number;
  friends: number;
  notifications: number;
}