import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if user is admin of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { adminId: true },
    });

    if (!group || group.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // For now, we'll just return a placeholder URL
    // In a real implementation, you would upload to a storage service like S3
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUrl = `data:${file.type};base64,${base64}`;

    // Update group with the image
    if (type === 'cover') {
      await prisma.group.update({
        where: { id: groupId },
        data: { image: imageUrl },
      });
      return NextResponse.json({ coverImage: imageUrl });
    } else if (type === 'avatar') {
      await prisma.group.update({
        where: { id: groupId },
        data: { profileImage: imageUrl },
      });
      return NextResponse.json({ avatar: imageUrl });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
