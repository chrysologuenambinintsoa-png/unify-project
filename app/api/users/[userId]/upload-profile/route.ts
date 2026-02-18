import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// POST /api/users/[userId]/upload-profile - Upload avatar or cover for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    if (!userId || session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const field = (formData.get('field') as string) || 'avatar';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unify_uploads');
    cloudinaryFormData.append('folder', 'unify/users');
    cloudinaryFormData.append('public_id', `user_${userId}_${field}_${uuidv4()}`);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json().catch(() => ({}));
      console.error('Cloudinary upload error:', error);
      return NextResponse.json({ error: 'Failed to upload image to cloud storage' }, { status: 500 });
    }

    const cloudinaryData = await cloudinaryResponse.json();
    const publicUrl = cloudinaryData.secure_url;

    // Update user record
    const updateData: any = {};
    if (field === 'cover' || field === 'coverImage') updateData.coverImage = publicUrl;
    else updateData.avatar = publicUrl;

    // Ensure user exists before updating
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      try {
        console.log('[Upload Profile] Creating missing user:', userId);
        
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
            id: userId,
            email: session.user.email || `user_${userId}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || 'User',
            avatar: session.user.avatar || session.user.image || null,
          },
        });
      } catch (createErr) {
        console.error('[Upload Profile] Failed to create missing user:', createErr);
        // Continue - the update below will also fail if user doesn't exist
      }
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });

    // Also create an entry in photoGallery for consistency with other photos
    try {
      const photoType = field === 'cover' || field === 'coverImage' ? 'cover' : 'profile';
      await (prisma as any).photoGallery.create({
        data: {
          userId: userId,
          url: publicUrl,
          type: photoType,
          caption: null,
        },
      });
    } catch (photoErr) {
      console.warn(`Failed to create photoGallery entry for ${field} photo:`, photoErr);
      // Continue - the main profile update succeeded
    }

    // Create a post for profile/cover change visibility
    try {
      const isProfilePhoto = field === 'avatar' || field === 'avatarImage';
      const contentType = isProfilePhoto ? 'profilePhotoChange' : 'coverPhotoChange';
      const postContent = `${updated.fullName || updated.username} ${isProfilePhoto ? 'updated their profile photo' : 'updated their cover photo'}`;
      
      const post = await (prisma as any).post.create({
        data: {
          userId: userId,
          content: postContent,
          contentType: contentType,
          isPublic: true,
          background: null,
          media: {
            create: {
              type: 'image',
              url: publicUrl,
            },
          },
        },
        include: { media: true },
      });
    } catch (postErr) {
      console.warn(`Failed to create post for ${field} change:`, postErr);
      // Continue - the main profile update succeeded
    }

    return NextResponse.json({ success: true, url: publicUrl, user: updated });
  } catch (error) {
    console.error('Error uploading user profile image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
