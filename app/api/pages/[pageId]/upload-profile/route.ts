import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// POST /api/pages/[pageId]/upload-profile - Upload profile image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    // Verify user is admin
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: { pageId, userId: session.user.id },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only page admins can upload images' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'pages');
    await mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const filename = `${pageId}-${uuidv4()}-${Date.now()}.${file.name.split('.').pop()}`;
    const filepath = join(uploadsDir, filename);
    const publicUrl = `/uploads/pages/${filename}`;

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update page
    const updatedPage = await (prisma as any).page.update({
      where: { id: pageId },
      data: { profileImage: publicUrl },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      page: updatedPage,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
