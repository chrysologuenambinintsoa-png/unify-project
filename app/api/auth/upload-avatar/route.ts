import { NextRequest, NextResponse } from 'next/server';
import { saveProfilePhoto } from '@/lib/profilePhoto';

/**
 * POST /api/auth/upload-avatar
 * Temporary avatar upload for registration (no auth required)
 * Stores the original image as received (no resizing).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file using the local profile photo manager
    try {
      const saveResult = await saveProfilePhoto(`temp_${Date.now()}`, buffer, (file as any).name || `avatar_${Date.now()}`, (file as any).type || 'image/jpeg');
      return NextResponse.json({ success: true, url: saveResult.url });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Failed to save avatar' }, { status: 400 });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading avatar:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to upload avatar', details: errorMsg },
      { status: 500 }
    );
  }
}
