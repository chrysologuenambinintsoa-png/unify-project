import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/explore/trends - Get trending topics based on hashtags in posts
export async function GET(request: NextRequest) {
  try {
    // Get posts from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        content: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Extract hashtags from post content
    const hashtagMap = new Map<string, number>();
    posts.forEach((post) => {
      const hashtags = post.content.match(/#\w+/g) || [];
      hashtags.forEach((tag) => {
        const count = hashtagMap.get(tag) || 0;
        hashtagMap.set(tag, count + post._count.likes + 1);
      });
    });

    // Sort by frequency and get top 10
    const trendingTopics = Array.from(hashtagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, score]) => ({
        name,
        posts: Math.floor(score / 10) || 1,
      }));

    // If no real trends found, return empty or some default minimal data
    return NextResponse.json(trendingTopics);
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
