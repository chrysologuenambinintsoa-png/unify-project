import fs from 'fs/promises';
import path from 'path';
import { saveProfilePhoto, getProfilePhoto, deleteProfilePhotoByPath } from '@/lib/profilePhoto';

async function run() {
  // 1x1 PNG base64
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
  const buffer = Buffer.from(base64, 'base64');

  console.log('Saving test avatar...');
  const res = await saveProfilePhoto('testuser', buffer, 'dot.png', 'image/png');
  console.log('Saved:', res);

  console.log('Reading back...');
  const got = await getProfilePhoto(res.url);
  if (!got) {
    console.error('Failed to read saved file');
    process.exit(1);
  }
  console.log('Read OK. Mime:', got.mime, 'Size:', got.buffer.length);

  console.log('Deleting file...');
  await deleteProfilePhotoByPath(res.path);
  console.log('Deleted. Verifying disappearance...');
  try {
    await fs.access(res.path);
    console.error('File still exists after deletion');
    process.exit(1);
  } catch (_) {
    console.log('File deleted successfully. Test passed.');
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
