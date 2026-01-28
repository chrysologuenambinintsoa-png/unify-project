import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  file: File | string,
  folder: string = 'unify'
): Promise<{ url: string; publicId: string }> {
  try {
    let result;

    if (typeof file === 'string') {
      // Upload from base64 or URL
      result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'image',
      });
    } else {
      // Upload from File object
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      result = await cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      );
      
      return new Promise((resolve, reject) => {
        bufferToCloudinary(buffer, folder)
          .then(resolve)
          .catch(reject);
      });
    }

    return {
      url: result!.secure_url,
      publicId: result!.public_id,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

export async function uploadVideo(
  file: File | string,
  folder: string = 'unify/videos'
): Promise<{ url: string; publicId: string }> {
  try {
    let result;

    if (typeof file === 'string') {
      result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: 'video',
      });
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      result = await cloudinary.uploader.upload(
        `data:video/mp4;base64,${buffer.toString('base64')}`,
        {
          folder,
          resource_type: 'video',
        }
      );
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}

export async function uploadDocument(
  file: File,
  folder: string = 'unify/documents'
): Promise<{ url: string; publicId: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${buffer.toString('base64')}`,
      {
        folder,
        resource_type: 'raw',
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}

export async function deleteVideo(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    throw new Error('Failed to delete video');
  }
}

export async function deleteDocument(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
}

// Helper function for buffer upload
async function bufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    ).end(buffer);
  });
}