import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // Upload to Cloudinary instead of local filesystem (for Vercel compatibility)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unify_uploads');
    cloudinaryFormData.append('folder', 'unify/pages');
    cloudinaryFormData.append('public_id', `page_${pageId}_${uuidv4()}`);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to cloud storage' },
        { status: 500 }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    const publicUrl = cloudinaryData.secure_url;

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
