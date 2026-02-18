import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages/test - Debug endpoint for messages
export async function GET(request: NextRequest) {
  try {
    console.log('[Messages Test] Starting test...');
    
    // Test 1: Check session
    const session = await getServerSession(authOptions);
    console.log('[Messages Test] Session exists:', !!session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'No session',
        tests: {
          session: 'FAILED',
        },
      }, { status: 401 });
    }

    // Test 2: Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Messages Test] Database connection: OK');
    } catch (dbErr) {
      console.error('[Messages Test] Database connection failed:', dbErr);
      return NextResponse.json({
        error: 'Database connection failed',
        details: dbErr instanceof Error ? dbErr.message : String(dbErr),
        tests: {
          session: 'OK',
          database: 'FAILED',
        },
      }, { status: 500 });
    }

    // Test 3: Check if Message table exists and has data
    let messageCount = 0;
    let messageError = null;
    try {
      messageCount = await (prisma as any).message.count();
      console.log('[Messages Test] Total messages:', messageCount);
    } catch (msgErr) {
      messageError = msgErr instanceof Error ? msgErr.message : String(msgErr);
      console.error('[Messages Test] Message count failed:', msgErr);
    }

    // Test 4: Try to fetch user's messages
    let userMessagesCount = 0;
    let userMessagesError = null;
    try {
      userMessagesCount = await (prisma as any).message.count({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
      });
      console.log('[Messages Test] User messages count:', userMessagesCount);
    } catch (userMsgErr) {
      userMessagesError = userMsgErr instanceof Error ? userMsgErr.message : String(userMsgErr);
      console.error('[Messages Test] User messages fetch failed:', userMsgErr);
    }

    // Test 5: Try full find with relationships
    let conversationsError = null;
    let conversationsCount = 0;
    try {
      const messages = await (prisma as any).message.findMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
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
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });
      
      conversationsCount = messages.length;
      console.log('[Messages Test] Full query count:', conversationsCount);
    } catch (fullErr) {
      conversationsError = fullErr instanceof Error ? fullErr.message : String(fullErr);
      console.error('[Messages Test] Full query failed:', fullErr);
    }

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      tests: {
        session: 'OK',
        database: 'OK',
        messageTable: messageError ? `FAILED: ${messageError}` : `OK (${messageCount} total messages)`,
        userMessages: userMessagesError ? `FAILED: ${userMessagesError}` : `OK (${userMessagesCount} messages)`,
        fullQuery: conversationsError ? `FAILED: ${conversationsError}` : `OK (${conversationsCount} conversations)`,
      },
    });
  } catch (error) {
    console.error('[Messages Test] Unexpected error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
