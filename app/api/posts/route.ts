import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts - Get all posts (personal, friends, group, and page posts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only return posts from the last 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Determine requester and their friends to enforce visibility
    const requesterId = session?.user?.id || null;
    let friendIds: string[] = [];
    let memberGroupIds: string[] = [];
    let memberPageIds: string[] = [];

    if (requesterId) {
      try {
        // Get friends, groups, and pages in parallel with timeout
        const [friendships, groupMemberships, pageMemberships] = await Promise.all([
          prisma.friendship.findMany({
            where: {
              OR: [
                { user1Id: requesterId },
                { user2Id: requesterId },
              ],
              status: 'accepted',
            },
            select: { user1Id: true, user2Id: true },
          }).catch(err => {
            console.warn('Error fetching friendships:', err);
            return [];
          }),
          prisma.groupMember.findMany({
            where: { userId: requesterId },
            select: { groupId: true },
          }).catch(err => {
            console.warn('Error fetching group memberships:', err);
            return [];
          }),
          prisma.pageMember.findMany({
            where: { userId: requesterId },
            select: { pageId: true },
          }).catch(err => {
            console.warn('Error fetching page memberships:', err);
            return [];
          }),
        ]);
        
        friendIds = friendships.map((f) => (f.user1Id === requesterId ? f.user2Id : f.user1Id));
        memberGroupIds = groupMemberships.map((m) => m.groupId);
        memberPageIds = pageMemberships.map((m) => m.pageId);
      } catch (err) {
        console.warn('Error fetching user relationships:', err);
        // Continue with empty lists
      }
    }

    // Fetch personal/friend posts with optimized query (no nested includes for large relations)
    const personalPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: cutoff,
        },
        OR: requesterId
          ? [
              { isPublic: true },
              { userId: requesterId },
              { userId: { in: friendIds } },
            ]
          : [{ isPublic: true }],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(err => {
      console.error('Error fetching personal posts:', err);
      return [];
    });

    // Fetch group and page posts in parallel, but separately to avoid connection pool exhaustion
    const [groupPosts, pagePosts] = await Promise.all([
      memberGroupIds.length > 0
        ? prisma.groupPost.findMany({
            where: {
              createdAt: { gte: cutoff },
              groupId: { in: memberGroupIds },
            },
            include: {
              media: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 25,
          }).catch(err => {
            console.warn('Error fetching group posts:', err);
            return [];
          })
        : Promise.resolve([]),
      memberPageIds.length > 0
        ? prisma.pagePost.findMany({
            where: {
              createdAt: { gte: cutoff },
              pageId: { in: memberPageIds },
            },
            include: {
              media: true,
              page: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 25,
          }).catch(err => {
            console.warn('Error fetching page posts:', err);
            return [];
          })
        : Promise.resolve([]),
    ]);

    // Fetch authors for group and page posts (with batching to reduce queries)
    const authorIds = new Set([
      ...groupPosts.map(gp => gp.authorId),
      ...pagePosts.map(pp => pp.authorId),
    ]);

    let authorsMap: Map<string, any> = new Map();
    if (authorIds.size > 0) {
      try {
        const authors = await prisma.user.findMany({
          where: { id: { in: Array.from(authorIds) } },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        });
        authorsMap = new Map(authors.map(a => [a.id, a]));
      } catch (err) {
        console.warn('Error fetching authors:', err);
      }
    }

    // Transform posts into unified format
    const transformedGroupPosts = groupPosts.map((gp) => ({
      id: gp.id,
      content: gp.content,
      createdAt: gp.createdAt,
      user: authorsMap.get(gp.authorId) || { id: gp.authorId, username: 'Unknown', fullName: 'Unknown User', avatar: null, isVerified: false },
      media: gp.media,
      group: gp.group,
      groupId: gp.groupId,
      type: 'group-post',
      _count: {
        comments: 0,
        likes: 0,
        reactions: 0,
      },
    }));

    const transformedPagePosts = pagePosts.map((pp) => ({
      id: pp.id,
      content: pp.content,
      createdAt: pp.createdAt,
      user: authorsMap.get(pp.authorId) || { id: pp.authorId, username: 'Unknown', fullName: 'Unknown User', avatar: null, isVerified: false },
      media: pp.media,
      page: pp.page,
      pageId: pp.pageId,
      type: 'page-post',
      _count: {
        comments: 0,
        likes: 0,
        reactions: 0,
      },
    }));

    // Merge all posts and sort by creation date (descending)
    const allPosts = [
      ...personalPosts.map((p) => ({ ...p, type: 'personal-post' })),
      ...transformedGroupPosts,
      ...transformedPagePosts,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return top 50 most recent posts
    return NextResponse.json(allPosts.slice(0, 50));
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        console.warn('Database connection error - returning empty posts array');
        return NextResponse.json([], { status: 200 });
      }
    }
    // For other errors, also return empty array to maintain functionality
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/posts - Create a new post (personal, group, or page)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify that the user exists in the database
    let userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    // If user doesn't exist, try to create them from session data
    if (!userExists) {
      try {
        console.log('[Posts] Creating missing user from session:', session.user.id);
        
        // Generate a readable username
        let username = session.user.username;
        if (!username) {
          // Try to extract from email
          if (session.user.email) {
            username = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
          } else if (session.user.fullName) {
            username = session.user.fullName.toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_').substring(0, 20);
          } else {
            username = `user_${Math.random().toString(36).substring(7)}`;
          }
        }
        
        await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || `user_${session.user.id}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || 'User',
            avatar: session.user.avatar || session.user.image || null,
          },
        });
        // Refetch user to verify creation
        userExists = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        });
        console.log('[Posts] Successfully created missing user:', session.user.id, 'with username:', username);
      } catch (createErr) {
        console.error('[Posts] Failed to create missing user:', createErr);
        return NextResponse.json(
          { error: 'Failed to initialize user account. Please log in again.' },
          { status: 500 }
        );
      }
    }

    // Parse request body (supports both JSON and FormData)
    let body: any = {};
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        content: formData.get('content') as string,
        type: formData.get('type') as string,
        pageId: formData.get('pageId') as string,
        groupId: formData.get('groupId') as string,
        background: formData.get('background') as string,
        isTextPost: formData.get('isTextPost') === 'true',
        styling: formData.get('styling') ? JSON.parse(formData.get('styling') as string) : undefined,
        isPublic: formData.get('isPublic') === 'true',
        media: [] as any[],
      };

      // Collect images from FormData
      const files = formData.getAll('images') as File[];
      if (files.length > 0) {
        for (const file of files) {
          const buffer = await file.arrayBuffer();
          // For now, we'll store the file info - in production, you'd upload to cloud storage
          body.media.push({
            type: 'image',
            url: '', // Will be populated by actual upload logic
            file: file,
          });
        }
      }
    } else {
      body = await request.json();
    }

    const { content, background, media, isTextPost, styling, isPublic, type, pageId, groupId } = body;

    // Filter out media without URL (only include media that has been uploaded)
    const validMedia = media?.filter((m: any) => m.url && m.type) || [];

    if (!content?.trim() && validMedia.length === 0) {
      return NextResponse.json(
        { error: 'Content or media is required' },
        { status: 400 }
      );
    }

    // Handle page post creation
    if (type === 'page' && pageId) {
      // Verify user is a page admin
      const isPageAdmin = await prisma.pageAdmin.findFirst({
        where: {
          pageId: pageId,
          userId: session.user.id,
        },
      });

      if (!isPageAdmin) {
        return NextResponse.json(
          { error: 'Only page admins can publish posts on this page' },
          { status: 403 }
        );
      }

      // Create page post
      const pagePost = await prisma.pagePost.create({
        data: {
          content,
          pageId,
          authorId: session.user.id,
          media: validMedia.length > 0 ? {
            create: validMedia.map((m: any) => ({
              type: m.type,
              url: m.url,
            })),
          } : undefined,
        },
        include: {
          media: true,
        },
      });

      return NextResponse.json(pagePost, { status: 201 });
    }

    // Handle group post creation
    if (type === 'group' && groupId) {
      // Verify user is either group admin or a group member
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { adminId: true },
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      const isGroupAdmin = group.adminId === session.user.id;
      const isGroupMember = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: session.user.id,
        },
      });

      if (!isGroupAdmin && !isGroupMember) {
        console.warn(`User ${session.user.id} is neither admin nor member of group ${groupId}`);
        return NextResponse.json(
          { error: 'Only group admins and members can post in this group' },
          { status: 403 }
        );
      }

      // Create group post
      const groupPost = await prisma.groupPost.create({
        data: {
          content,
          groupId,
          authorId: session.user.id,
          media: validMedia.length > 0 ? {
            create: validMedia.map((m: any) => ({
              type: m.type,
              url: m.url,
            })),
          } : undefined,
        },
        include: {
          media: true,
        },
      });

      return NextResponse.json(groupPost, { status: 201 });
    }

    // Default: Create personal post
    const post = await prisma.post.create({
      data: {
        content,
        background: isTextPost ? (styling?.background || 'gradient-1') : background,
        userId: session.user.id,
        styling: isTextPost ? styling : undefined,
        isPublic: typeof isPublic === 'boolean' ? isPublic : false,
        media: validMedia.length > 0 ? {
          create: validMedia.map((m: any) => ({
            type: m.type,
            url: m.url,
          })),
        } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        },
        media: true,
      },
    });

    try {
      const { publishPostEvent } = await import('@/lib/postEvents');
      publishPostEvent({ type: 'created', payload: post });
    } catch (e) {
      // best-effort
      console.warn('Failed to publish post created event', e);
    }

    // Ensure uploaded images are saved to the user's photo gallery
    try {
      const imageMedia = (post.media || []).filter((m: any) => m.type === 'image');
      if (imageMedia.length > 0) {
        const data = imageMedia.map((m: any) => ({ userId: session.user.id, url: m.url, type: 'gallery', caption: null }));
        // Use createMany as best-effort; skipDuplicates if available
        await (prisma as any).photoGallery.createMany({ data, skipDuplicates: true });
      }
    } catch (e) {
      console.warn('Failed to save images to photo gallery (non-fatal)', e);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error creating post:', { 
      message: errorMessage,
      stack: errorStack,
      error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Failed to create post', details: errorMessage },
      { status: 500 }
    );
  }
}