import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/avatar - Upload user avatar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'unify/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' }
          ],
          public_id: `user_${session.user.id}_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: (uploadResult as any).secure_url },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

// DELETE /api/avatar - Remove user avatar
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to find avatar URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    if (user?.avatar) {
      // Extract public_id from Cloudinary URL
      const publicId = user.avatar.split('/').pop()?.split('.')[0];
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`unify/avatars/${publicId}`);
        } catch (cloudinaryError) {
          console.warn('Failed to delete from Cloudinary:', cloudinaryError);
        }
      }
    }

    // Update user avatar to null
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}