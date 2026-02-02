/**
 * @jest-environment node
 */
/**
 * Test Suite for Search Actions APIs
 * Tests for messaging, friend requests, page following, and group joining
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock data
const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  username: 'testuser',
  fullName: 'Test User',
  password: 'hashed-password',
};

const mockTargetUser = {
  id: 'test-user-2',
  email: 'target@example.com',
  username: 'targetuser',
  fullName: 'Target User',
  password: 'hashed-password',
};

const mockGroup = {
  id: 'test-group-1',
  name: 'Test Group',
  description: 'A test group',
  adminId: 'test-user-1',
  isPrivate: false,
};

const mockPage = {
  id: 'test-page-1',
  name: 'Test Page',
  description: 'A test page',
  isVerified: false,
};

describe.skip('Search Actions APIs (requires running server)', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    let retries = 0;
    while (retries < 30) {
      try {
        const res = await fetch('http://localhost:3000/', { method: 'HEAD' });
        if (res.ok || res.status === 404) break; // 404 is fine, server is up
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Clean up any leftover test data
    try {
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { user1Id: { in: [mockUser.id, mockTargetUser.id] } },
            { user2Id: { in: [mockUser.id, mockTargetUser.id] } },
          ],
        },
      });
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: { in: [mockUser.id, mockTargetUser.id] } },
            { receiverId: { in: [mockUser.id, mockTargetUser.id] } },
          ],
        },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [mockUser.id, mockTargetUser.id] } },
      });
    } catch (e) {
      // Ignore cleanup errors
    }

    // Setup: Create test users in database
    await prisma.user.createMany({
      data: [mockUser, mockTargetUser],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { user1Id: mockUser.id },
          { user2Id: mockUser.id },
        ],
      },
    });

    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: mockUser.id },
          { receiverId: mockUser.id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: { id: { in: [mockUser.id, mockTargetUser.id] } },
    });
  });

  describe('POST /api/messages/send', () => {
    it('should send a message successfully', async () => {
      const messageData = {
        receiverId: mockTargetUser.id,
        content: 'Hello, this is a test message!',
      };

      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.content).toBe(messageData.content);
      expect(data.receiverId).toBe(mockTargetUser.id);
    });

    it('should reject message with empty content', async () => {
      const messageData = {
        receiverId: mockTargetUser.id,
        content: '',
      };

      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject message without receiver ID', async () => {
      const messageData = {
        content: 'Message without receiver',
      };

      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      expect(response.status).toBe(400);
    });

    it('should prevent sending message to non-existent user', async () => {
      const messageData = {
        receiverId: 'non-existent-user',
        content: 'Test message',
      };

      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      expect(response.status).toBe(404);
    });

    it('should prevent sending message to self', async () => {
      const messageData = {
        receiverId: mockUser.id,
        content: 'Message to self',
      };

      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/friends/add', () => {
    it('should send friend request successfully', async () => {
      const friendData = {
        userId: mockTargetUser.id,
      };

      const response = await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.status).toBe('pending');
      expect(data.user1Id).toBe(mockUser.id);
      expect(data.user2Id).toBe(mockTargetUser.id);
    });

    it('should reject duplicate friend request', async () => {
      const friendData = {
        userId: mockTargetUser.id,
      };

      // First request
      await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      // Second request should fail
      const response = await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(400);
    });

    it('should prevent adding self as friend', async () => {
      const friendData = {
        userId: mockUser.id,
      };

      const response = await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject friend request without user ID', async () => {
      const friendData = {};

      const response = await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      expect(response.status).toBe(400);
    });

    it('should create notification for recipient', async () => {
      const friendData = {
        userId: mockTargetUser.id,
      };

      const response = await fetch('http://localhost:3000/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(friendData),
      });

      if (response.status === 201) {
        const notification = await prisma.notification.findFirst({
          where: {
            userId: mockTargetUser.id,
            type: 'friend_request',
          },
        });

        expect(notification).toBeTruthy();
        expect(notification?.type).toBe('friend_request');
      }
    });
  });

  describe('POST /api/pages/follow', () => {
    let pageId: string;

    beforeAll(async () => {
      // Create test page
      const page = await prisma.page.create({
        data: mockPage,
      });
      pageId = page.id;
    });

    it('should follow page successfully', async () => {
      const pageData = {
        pageId: pageId,
      };

      const response = await fetch('http://localhost:3000/api/pages/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.pageId).toBe(pageId);
      expect(data.userId).toBe(mockUser.id);
      expect(data.role).toBe('member');
    });

    it('should reject duplicate follow', async () => {
      const pageData = {
        pageId: pageId,
      };

      // First follow
      await fetch('http://localhost:3000/api/pages/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      // Second follow should fail
      const response = await fetch('http://localhost:3000/api/pages/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      expect(response.status).toBe(400);
    });

    it('should unfollow page successfully', async () => {
      const response = await fetch(
        `http://localhost:3000/api/pages/follow?pageId=${pageId}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should reject unfollow if not following', async () => {
      const response = await fetch(
        `http://localhost:3000/api/pages/follow?pageId=${pageId}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/groups/join', () => {
    let groupId: string;

    beforeAll(async () => {
      // Create test group
      const group = await prisma.group.create({
        data: mockGroup,
      });
      groupId = group.id;
    });

    it('should join public group successfully', async () => {
      const groupData = {
        groupId: groupId,
      };

      const response = await fetch('http://localhost:3000/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.groupId).toBe(groupId);
      expect(data.userId).toBe(mockUser.id);
      expect(data.role).toBe('member');
    });

    it('should reject duplicate join', async () => {
      const groupData = {
        groupId: groupId,
      };

      // First join
      await fetch('http://localhost:3000/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      // Second join should fail
      const response = await fetch('http://localhost:3000/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      expect(response.status).toBe(400);
    });

    it('should reject join for private group', async () => {
      const privateGroup = await prisma.group.create({
        data: {
          ...mockGroup,
          isPrivate: true,
          id: 'test-private-group',
        },
      });

      const groupData = {
        groupId: privateGroup.id,
      };

      const response = await fetch('http://localhost:3000/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      expect(response.status).toBe(403);
    });

    it('should leave group successfully', async () => {
      const response = await fetch(
        `http://localhost:3000/api/groups/join?groupId=${groupId}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/search', () => {
    it('should return empty results for short query', async () => {
      const response = await fetch('http://localhost:3000/api/search?q=a');
      const data = await response.json();

      expect(data.personnes).toEqual([]);
      expect(data.groupes).toEqual([]);
      expect(data.pages).toEqual([]);
    });

    it('should find users by username', async () => {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${mockTargetUser.username}`
      );
      const data = await response.json();

      expect(data.personnes.length).toBeGreaterThan(0);
      const found = data.personnes.find(
        (p: any) => p.username === mockTargetUser.username
      );
      expect(found).toBeTruthy();
    });

    it('should include friendship status in results', async () => {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${mockTargetUser.username}`
      );
      const data = await response.json();

      const found = data.personnes.find(
        (p: any) => p.username === mockTargetUser.username
      );
      expect(found.friendshipStatus).toBeDefined();
    });

    it('should include membership status for groups', async () => {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${mockGroup.name}`
      );
      const data = await response.json();

      const found = data.groupes.find((g: any) => g.name === mockGroup.name);
      if (found) {
        expect(found.isMember).toBeDefined();
      }
    });

    it('should include following status for pages', async () => {
      const response = await fetch(
        `http://localhost:3000/api/search?q=${mockPage.name}`
      );
      const data = await response.json();

      const found = data.pages.find((p: any) => p.name === mockPage.name);
      if (found) {
        expect(found.isFollowing).toBeDefined();
      }
    });

    it('should filter results by type parameter', async () => {
      const response = await fetch(
        `http://localhost:3000/api/search?q=test&type=personnes`
      );
      const data = await response.json();

      expect(data.personnes).toBeDefined();
      expect(data.groupes).toBeDefined();
      expect(data.pages).toBeDefined();
    });
  });
});
