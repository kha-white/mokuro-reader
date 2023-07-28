import { updateCatalogDisplay } from './catalog-ui';

export async function importVolume(mokuro_url) {
  if (!mokuro_url.endsWith('.mokuro')) {
    return;
  }
  const volume_url = mokuro_url.slice(0, -7);
  const volumeName = decodeURI(
    volume_url.slice(volume_url.lastIndexOf('/') + 1) || volume_url,
  );
  const response = await fetch(mokuro_url);
  const mokuroData = await response.json();
  const title = await window.catalog.addTitleIfNotExists(
    mokuroData.title,
    mokuroData.title_uuid,
  );
  const volume = await title.addVolumeIfNotExists(
    mokuroData,
    volumeName,
    mokuroData.volume_uuid,
    encodeURI(volume_url),
  );

  await window.catalog.save();
  updateCatalogDisplay();
}

export async function importFromUrl(url) {
  if (!url) {
    return;
  }

  if (url.endsWith('.mokuro')) {
    await importVolume(decodeURI(url));
    return;
  }

  const fileUrls = await scanUrlDir(url, 'mokuro');
  await Promise.all(fileUrls.map(importVolume));
}

async function scanUrlDir(url, extension) {
  const fileUrls = [];
  const response = await fetch(url);
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  for (const link of links) {
    const href = link.getAttribute('href');
    const absoluteUrl = new URL(href, url).href;
    if (href.endsWith(`.${extension}`)) {
      fileUrls.push(absoluteUrl);
    }
  }

  return fileUrls;
}
