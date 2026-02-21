import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

function getDeviceFingerprint(userAgent?: string | null, ipAddress?: string | null): string {
  if (!userAgent) return 'unknown';
  
  // Extract OS
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'windows';
  else if (userAgent.includes('Mac OS X')) os = 'macos';
  else if (userAgent.includes('Linux')) os = 'linux';
  else if (userAgent.includes('Android')) os = 'android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'ios';
  
  // Extract browser
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'chrome';
  else if (userAgent.includes('Firefox')) browser = 'firefox';
  else if (userAgent.includes('Safari')) browser = 'safari';
  else if (userAgent.includes('Edge')) browser = 'edge';
  else if (userAgent.includes('Opera')) browser = 'opera';
  
  // Extract device type
  let deviceType = 'pc';
  if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
    deviceType = 'mobile';
  } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    deviceType = 'tablet';
  }
  
  return `${os}-${browser}-${deviceType}`;
}

// GET /api/users/[userId]/login-history - Get login history grouped by device
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getServerSession(authOptions);
    const userAgentHeader = request.headers.get('user-agent');
    const xForwardedFor = request.headers.get('x-forwarded-for');

    // Only allow users to view their own login history
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId },
      select: {
        id: true,
        loginAt: true,
        userAgent: true,
        ipAddress: true,
      },
      orderBy: { loginAt: 'desc' },
      take: 100, // Last 100 logins for grouping
    });

    // Get current device fingerprint
    const currentFingerprint = getDeviceFingerprint(userAgentHeader, xForwardedFor?.split(',')[0]);
    
    // Group by device (unique combination of OS + browser + device type)
    const groupedByDevice = new Map<string, typeof loginHistory>();
    const seenDevices = new Set<string>();
    
    loginHistory.forEach((login) => {
      const fingerprint = getDeviceFingerprint(login.userAgent, login.ipAddress);
      if (!groupedByDevice.has(fingerprint)) {
        groupedByDevice.set(fingerprint, []);
      }
      if (!seenDevices.has(fingerprint) || groupedByDevice.get(fingerprint)!.length < 5) {
        groupedByDevice.get(fingerprint)!.push(login);
        if (groupedByDevice.get(fingerprint)!.length === 1) {
          seenDevices.add(fingerprint);
        }
      }
    });

    // Transform to grouped format with latest login per device
    const groupedSessions = Array.from(groupedByDevice).map(([fingerprint, logs]) => ({
      deviceFingerprint: fingerprint,
      isCurrent: fingerprint === currentFingerprint,
      latestLogin: logs[0],
      totalLogins: logs.length,
      allLogins: logs.slice(0, 5), // Keep last 5 for each device
    }));

    // Sort: current device first, then by most recent login
    groupedSessions.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.latestLogin.loginAt).getTime() - new Date(a.latestLogin.loginAt).getTime();
    });

    return NextResponse.json(groupedSessions);
  } catch (error) {
    console.error('Error fetching login history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[userId]/login-history - Revoke a session from a device
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { deviceFingerprint } = body;

    // Only allow users to revoke their own sessions
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'Device fingerprint is required' },
        { status: 400 }
      );
    }

    // Get all logins for this user and find those matching the device fingerprint
    const allLogins = await prisma.loginHistory.findMany({
      where: { userId },
    });

    // Find login IDs that match this device fingerprint
    const loginIdsToDelete = allLogins
      .filter(login => getDeviceFingerprint(login.userAgent, login.ipAddress) === deviceFingerprint)
      .map(login => login.id);

    if (loginIdsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No matching logins found' },
        { status: 404 }
      );
    }

    // Delete all login records for this device
    await prisma.loginHistory.deleteMany({
      where: { id: { in: loginIdsToDelete } }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${loginIdsToDelete.length} login records` 
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
