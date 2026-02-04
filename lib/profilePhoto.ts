import fs from 'fs/promises';
import path from 'path';
import imageSize from 'image-size';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DIM = 1024; // 1024 px

type SaveResult = { url: string; path: string; filename: string };

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    // ignore, will surface on write
  }
}

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

  await ensureUploadDir();

  // Preserve original extension
  const ext = path.extname(originalName) || (mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg');
  const filename = `user_${userId}_${Date.now()}${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  // Write file as-is, no resizing or compression
  await fs.writeFile(destPath, buffer, { encoding: 'binary' });

  const url = `/uploads/avatars/${filename}`;
  return { url, path: destPath, filename };
}

export async function deleteProfilePhotoByPath(filePath: string) {
  try {
    // Only allow deletion inside our upload dir
    if (!filePath.startsWith(UPLOAD_DIR)) return;
    await fs.unlink(filePath).catch(() => {});
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
    return null;
  }
}

export { UPLOAD_DIR };
