import { clear } from 'idb-keyval';
import { appendNewChild, formatBytes } from './utils';
import { volumeState } from './state';
import { loadVolume } from './load-volume';
import { Catalog } from './catalog';

async function deleteVolume(id) {
  const volume = window.catalog.volumes[id];
  const msg = `Delete "${volume.toString()}"?\n\nThis will delete all data and reading progress associated with this volume from the browser storage.`;
  if (confirm(msg)) {
    if (window.loadedVolume === volume) {
      await loadVolume(null);
    }
    await volume.delete();
    updateCatalogDisplay();
  }
}

async function deleteTitle(id) {
  const title = window.catalog.titles[id];
  const msg = `Delete "${title.name}" containing ${
    Object.keys(title.volumes).length
  } volumes?\n\nThis will delete all data and reading progress associated with this title from the browser storage.`;
  if (confirm(msg)) {
    if (
      window.loadedVolume !== null &&
      window.loadedVolume.parentTitle === title
    ) {
      await loadVolume(null);
    }
    await title.delete();
    updateCatalogDisplay();
  }
}

export function updateCatalogDisplay() {
  const catalogDisplay = document.getElementById('catalogDisplay');
  catalogDisplay.replaceChildren();
  const titleList = appendNewChild(catalogDisplay, 'ul');
  let a;

  for (const title of window.catalog.getTitles()) {
    if (title.id === 'demo-title') {
      continue;
    }
    const titleListEl = appendNewChild(titleList, 'li');
    const titleItem = appendNewChild(titleListEl, 'span', title.name);
    titleItem.classList.add('catalogItem');

    a = appendNewChild(titleItem, 'a');
    a.classList.add('deleteCatalogItemButton');
    a.href = '#';
    a.addEventListener(
      'click',
      async () => {
        await deleteTitle(title.id);
      },
      false,
    );
    a.appendChild(document.createTextNode('x'));

    const volumeList = appendNewChild(titleListEl, 'ul');

    for (const volume of title.getVolumes()) {
      const volumeListEl = appendNewChild(volumeList, 'li');
      const volumeItem = appendNewChild(volumeListEl, 'span');
      volumeItem.classList.add('catalogItem');

      if (volume.isFullyStored()) {
        a = appendNewChild(volumeItem, 'a');
        a.href = '#';

        a.addEventListener(
          'click',
          async () => {
            await loadVolume(volume.id);
          },
          false,
        );
      } else {
        a = appendNewChild(volumeItem, 'span');
      }

      a.appendChild(document.createTextNode(volume.name));

      const state = volumeState.get(volume.id);
      const page_idx = Math.max(state.page_idx, state.page2_idx) + 1;
      const num_pages = volume.mokuroData.pages.length;

      const volumeStats = appendNewChild(
        volumeItem,
        'span',
        `(${page_idx}/${num_pages})`,
      );
      volumeStats.id = `volumeStats${volume.id}`;
      volumeStats.classList.add('volumeStats');

      const volumeStatus = appendNewChild(
        volumeItem,
        'span',
        volume.getStatusString(),
      );
      volumeStatus.id = `volumeStatus${volume.id}`;
      volumeStatus.classList.add('volumeStatus');

      if (volume.url !== null) {
        const volumeUrl = appendNewChild(volumeItem, 'a', '↪');
        volumeUrl.classList.add('volumeUrl');
        volumeUrl.href = volume.url;
      }

      a = appendNewChild(volumeItem, 'a');
      a.classList.add('deleteCatalogItemButton');
      a.href = '#';
      a.addEventListener(
        'click',
        async () => {
          deleteVolume(volume.id);
        },
        false,
      );
      a.appendChild(document.createTextNode('x'));
    }
  }

  const catalogStatus = document.getElementById('catalogStatus');

  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(({ usage, quota }) => {
      catalogStatus.textContent = `${formatBytes(usage)} / ${formatBytes(
        quota,
      )}`;
      if (usage > quota * 0.9 || quota - usage < 1024 * 1024 * 100) {
        catalogStatus.classList.add('colorRed');
      } else {
        catalogStatus.classList.remove('colorRed');
      }
    });
  }
}

export function setVolumePageState(volume_id, page_idx, num_pages) {
  const volumeStats = document.getElementById(`volumeStats${volume_id}`);
  if (volumeStats !== null) {
    volumeStats.textContent = `(${page_idx}/${num_pages})`;
  }
}

export function setVolumeStatus(volume_id, text) {
  const volumeStatus = document.getElementById(`volumeStatus${volume_id}`);
  if (volumeStatus !== null) {
    volumeStatus.textContent = text;
  }
}

document.getElementById('resetCatalogButton').addEventListener(
  'click',
  async () => {
    const msg =
      'Reset catalog?\n\nThis will delete all data and reading progress from the browser storage.';
    if (confirm(msg)) {
      await loadVolume(null);
      await clear();
      window.catalog = await Catalog.load();
      updateCatalogDisplay();
    }
  },
  false,
);
