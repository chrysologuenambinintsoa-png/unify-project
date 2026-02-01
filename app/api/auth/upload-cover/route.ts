import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 60000,
});

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 60000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout exceeded')), timeoutMs)
    ),
  ]);
}

/**
 * POST /api/auth/upload-cover
 * Temporary cover upload for registration (no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cover') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for cover)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with timeout
    const uploadResult = await withTimeout(
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'unify/covers',
            transformation: [
              { width: 1200, height: 300, crop: 'fill' },
              { quality: 'auto' }
            ],
            public_id: `temp_cover_${Date.now()}`,
            timeout: 60000,
            chunk_size: 5242880,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      }),
      70000
    );

    return NextResponse.json({
      success: true,
      url: (uploadResult as any).secure_url,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error uploading cover:', errorMsg);
    return NextResponse.json(
      { error: 'Failed to upload cover', details: errorMsg },
      { status: 500 }
    );
  }
}
