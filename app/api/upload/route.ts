import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';

// Set timeout for file uploads (up to 2 minutes)
export const config = {
  maxDuration: 120,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          errorCode: 'UNAUTHORIZED',
          message: 'You must be logged in to upload files'
        },
        { status: 401 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid form data';
      console.error('Error parsing form data:', errorMsg);
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          errorCode: 'INVALID_FORMAT',
          message: errorMsg
        },
        { status: 400 }
      );
    }

    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          error: 'No files provided',
          errorCode: 'NO_FILES',
          message: 'Please select at least one file to upload'
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { 
          error: 'Upload type not specified',
          errorCode: 'NO_TYPE',
          message: 'File type (image or video) must be specified'
        },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const errors: Array<{ file: string; message: string }> = [];

    for (const file of files) {
      try {
        // Validate file
        if (!file || !(file instanceof File)) {
          errors.push({ file: 'unknown', message: 'Invalid file object' });
          continue;
        }

        // Convert File to base64 for upload
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        let uploadResult;
        if (type === 'image') {
          uploadResult = await uploadImage(dataUrl, 'unify/posts');
        } else if (type === 'video') {
          uploadResult = await uploadVideo(dataUrl, 'unify/posts/videos');
        } else {
          errors.push({ file: file.name, message: `Unsupported type: ${type}` });
          continue;
        }
        
        if (!uploadResult?.url) {
          throw new Error('No URL returned from upload service');
        }
        
        uploadedUrls.push(uploadResult.url);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error uploading file ${file.name}:`, errorMsg);
        errors.push({ 
          file: file.name, 
          message: errorMsg 
        });
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to upload files',
          errorCode: 'UPLOAD_FAILED',
          message: 'All files failed to upload',
          details: errors
        },
        { status: 500 }
      );
    }

    // Return success even if some files failed
    return NextResponse.json({ 
      urls: uploadedUrls,
      success: true,
      ...(errors.length > 0 && { 
        warnings: errors,
        message: `Uploaded ${uploadedUrls.length} of ${files.length} files`
      })
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in upload handler:', errorMsg, error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        errorCode: 'SERVER_ERROR',
        message: errorMsg,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
