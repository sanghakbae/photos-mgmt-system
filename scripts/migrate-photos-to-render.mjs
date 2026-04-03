import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'backend', 'data');
const uploadsDir = path.join(dataDir, 'uploads');
const photosPath = path.join(dataDir, 'photos.json');
const settingsPath = path.join(dataDir, 'settings.json');

const apiBaseUrl = process.argv[2];
const token = process.argv[3];

if (!apiBaseUrl || !token) {
  console.error('Usage: node scripts/migrate-photos-to-render.mjs <api-base-url> <migration-token>');
  process.exit(1);
}

const baseUrl = apiBaseUrl.replace(/\/$/, '');

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function postPhoto(photo, index, total) {
  const imagePath = path.join(uploadsDir, path.basename(photo.imageUrl));
  const buffer = await readFile(imagePath);
  const meta = Buffer.from(JSON.stringify(photo), 'utf8').toString('base64');

  const response = await fetch(`${baseUrl}/api/internal/migrate/photos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': photo.mimeType || 'application/octet-stream',
      'X-Photo-Meta': meta,
    },
    body: buffer,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed photo ${photo.id} (${index}/${total}): ${response.status} ${text}`);
  }

  process.stdout.write(`Uploaded ${index}/${total}: ${photo.fileName}\n`);
}

async function main() {
  const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
  await postJson(`${baseUrl}/api/internal/migrate/settings`, settings);
  process.stdout.write('Uploaded settings\n');

  const photos = JSON.parse(await readFile(photosPath, 'utf8'));
  for (const [index, photo] of photos.entries()) {
    await postPhoto(photo, index + 1, photos.length);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
