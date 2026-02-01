import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/videos - Upload a video
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Video file must be smaller than 10MB' },
        { status: 400 }
      );
    }

    // For now, we'll return a success response with a placeholder
    // In production, you'd upload to a service like Cloudinary, AWS S3, or similar
    const videoData = {
      id: Date.now().toString(),
      title: title || file.name,
      description,
      size: file.size,
      type: file.type,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
      // In production, replace this with actual uploaded URL
      url: `https://via.placeholder.com/video-${Date.now()}.mp4`,
    };

    return NextResponse.json(videoData, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}

// GET /api/videos - Get all videos (optional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty array for now
    // In production, fetch from database
    return NextResponse.json([], { status: 200 });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
