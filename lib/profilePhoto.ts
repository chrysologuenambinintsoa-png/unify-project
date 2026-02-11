import fs from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIM = 1024; // 1024 px

type SaveResult = { url: string; path?: string | null; filename?: string | null };

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // ignore, will surface on write
  }
}

// Upload avatar to Cloudinary (server-side) and return public URL.
export async function saveProfilePhoto(userId: string, buffer: Buffer, originalName: string, mimeType: string): Promise<SaveResult> {
  // Validate MIME
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(mimeType)) {
    throw new Error('Unsupported file type. Only JPEG, PNG or WebP allowed.');
  }

  // Validate size
  if (buffer.length > MAX_BYTES) {
    throw new Error('File too large. Maximum allowed size is 5 MB.');
  }

  // Validate dimensions
  let dims: { width: number; height: number } | null = null;
  try {
    // imageSize might throw if invalid image
    // @ts-ignore - image-size's types export as function
    const size = imageSize(buffer);
    if (size && typeof size.width === 'number' && typeof size.height === 'number') {
      dims = { width: size.width, height: size.height };
    }
  } catch (err) {
    throw new Error('Unable to read image dimensions. Is the file a valid image?');
  }

  if (dims) {
    if (dims.width > MAX_DIM || dims.height > MAX_DIM) {
      throw new Error(`Image dimensions too large. Maximum allowed is ${MAX_DIM}x${MAX_DIM} px.`);
    }
  }
  // Prefer uploading to Cloudinary if configured
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || 'unify_uploads';

  if (cloudName) {
    // Build form data with base64 data URI for the file
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const form = new (global as any).FormData();
    form.append('file', dataUri);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'unify/avatars');
    form.append('public_id', `user_${userId}_${uuidv4()}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form as any,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Cloud upload failed: ${err}`);
    }

    const json = await res.json();
    return { url: json.secure_url, path: null, filename: json.public_id };
  }

  // Fallback: write to local uploads directory (only for writable filesystems)
  await ensureUploadDir();
  const ext = path.extname(originalName) || (mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg');
  const filename = `user_${userId}_${Date.now()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(destPath, buffer, { encoding: 'binary' });
  const url = `/uploads/avatars/${filename}`;
  return { url, path: destPath, filename };
}

export async function deleteProfilePhotoByPath(filePath: string) {
  try {
    // If it's a local path, only allow deletion inside our upload dir
    if (filePath && filePath.startsWith && filePath.startsWith(UPLOAD_DIR)) {
      await fs.unlink(filePath).catch(() => {});
      return;
    }

    // If it's a Cloudinary URL or public id, we don't delete here (requires API key/secret). No-op.
  } catch (err) {
    // ignore
  }
}

export async function getProfilePhoto(urlOrPath: string) {
  // Accept either stored DB url (relative) or absolute path
  let absolutePath = urlOrPath;
  if (urlOrPath.startsWith('/')) {
    absolutePath = path.join(process.cwd(), 'public', urlOrPath);
  }
  try {
    const buffer = await fs.readFile(absolutePath);
    // Guess mime from extension
    const ext = path.extname(absolutePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    return { buffer, mime, path: absolutePath };
  } catch (err) {
    // If not found locally, return null. Cloudinary-hosted images should be served via URL.
    return null;
  }
}

export { UPLOAD_DIR };
