import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

if (!apiBaseUrl) {
  console.error('Usage: node scripts/sync-photos-from-remote.mjs <api-base-url>');
  process.exit(1);
}

const baseUrl = apiBaseUrl.replace(/\/$/, '');

function toAbsoluteUrl(assetUrl) {
  if (/^https?:\/\//.test(assetUrl)) {
    return assetUrl;
  }

  return `${baseUrl}${assetUrl}`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function downloadFile(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed ${url}: ${response.status} ${text}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
}

async function main() {
  await mkdir(uploadsDir, { recursive: true });

  const gallery = await fetchJson(`${baseUrl}/api/public/photos`);
  const settings = await fetchJson(`${baseUrl}/api/public/settings`);
  const photos = gallery?.photos ?? [];

  await writeFile(
    settingsPath,
    `${JSON.stringify({ siteTitle: settings?.siteTitle || gallery?.siteTitle || "Photo's room" }, null, 2)}\n`,
    'utf8',
  );

  for (const [index, photo] of photos.entries()) {
    const imageUrl = toAbsoluteUrl(photo.imageUrl);
    const filePath = path.join(uploadsDir, path.basename(photo.imageUrl));
    await downloadFile(imageUrl, filePath);
    process.stdout.write(`Downloaded ${index + 1}/${photos.length}: ${photo.fileName}\n`);
  }

  const normalizedPhotos = photos.map(({ thumbUrl, ...photo }) => photo);
  await writeFile(photosPath, `${JSON.stringify(normalizedPhotos, null, 2)}\n`, 'utf8');
  process.stdout.write(`Saved ${photos.length} photos to ${photosPath}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
