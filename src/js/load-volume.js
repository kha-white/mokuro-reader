import { globalState, volumeState } from './state';
import { settings } from './settings';
import { appendNewChild, clip, sortByProperty } from './utils';
import { setStatusBarText, showStatusBarForTime } from './status-bar';
import { updateProperties, updateSettingsDisplay } from './settings-ui';
import { closeAllPopups } from './popup';
import { updatePage } from './page-utils';
import { selectBox } from './select-box';

const pc = document.getElementById('pagesContainer');

export async function loadVolume(id) {
  let volume;
  if (id !== null) {
    volume = window.catalog.volumes[id];
    if (!volume.isFullyStored()) {
      return;
    }
  }

  if (window.loadedVolume !== null) {
    window.loadedVolume.clearURLs();
  }
  pc.replaceChildren();

  if (id === null) {
    window.loadedVolume = null;
    globalState.loadedVolumeId = null;
    volumeState.reset();
    settings.unloadVolume();
    setStatusBarText('No volume loaded');
  } else {
    const { pages } = volume.mokuroData;
    window.numPages = pages.length;
    window.numPagesLoaded = 0;

    window.loadedVolume = volume;
    globalState.loadedVolumeId = volume.id;
    volumeState.load(volume.id);
    volumeState.lastOpened = Date.now();
    settings.loadVolume(volume.id);

    const promises = [];
    for (
      let pageIdx = volumeState.page_idx;
      pageIdx < window.numPages;
      pageIdx++
    ) {
      promises.push(loadPage(volume, pageIdx));
    }
    for (let pageIdx = 0; pageIdx < volumeState.page_idx; pageIdx++) {
      promises.push(loadPage(volume, pageIdx));
    }

    await Promise.all(promises);

    setStatusBarText(volume.toString());
    showStatusBarForTime(3000);
  }

  updateSettingsDisplay();
  updateProperties();
}

async function loadPage(volume, pageIdx) {
  const pageJSON = volume.mokuroData.pages[pageIdx];
  const W = pageJSON.img_width;
  const H = pageJSON.img_height;

  const page = appendNewChild(pc, 'div');
  page.id = `page${pageIdx}`;
  page.classList.add('page');

  const pageContainer = appendNewChild(page, 'div');
  pageContainer.classList.add('pageContainer');
  pageContainer.style.width = W;
  pageContainer.style.height = H;
  const imgURL = await volume.getImgURL(pageJSON.img_path);
  pageContainer.style.backgroundImage = `url("${imgURL}")`;

  let textBoxes = [];

  for (const blockJSON of pageJSON.blocks) {
    let xmin;
    let ymin;
    let xmax;
    let ymax;
    let w;
    let h;
    [xmin, ymin, xmax, ymax] = blockJSON.box;
    xmin = clip(xmin, 0, W);
    ymin = clip(ymin, 0, H);
    xmax = clip(xmax, 0, W);
    ymax = clip(ymax, 0, H);
    w = xmax - xmin;
    h = ymax - ymin;
    const area = w * h;

    const textBox = appendNewChild(pageContainer, 'div');
    textBox.classList.add('textBox');
    textBox.style.left = xmin;
    textBox.style.top = ymin;
    textBox.style.width = w;
    textBox.style.height = h;
    textBox.style.fontSize = `${blockJSON.font_size}px`;

    if (blockJSON.vertical) {
      textBox.style.writingMode = 'vertical-rl';
    }

    for (const line of blockJSON.lines) {
      const p = appendNewChild(textBox, 'p');
      p.appendChild(document.createTextNode(line));
    }

    textBox.addEventListener(
      'click',
      function (e) {
        if (settings.toggleOCRTextBoxes || settings.editableText) {
          selectBox(this);
        }
      },
      false,
    );

    textBoxes.push({ textBox, area });
  }

  // assign z-index ordering from largest to smallest boxes,
  // so that smaller boxes don't get hidden underneath larger ones
  textBoxes = sortByProperty(textBoxes, 'area', false);
  for (let i = 0; i < textBoxes.length; i++) {
    textBoxes[i].textBox.style.zIndex = 10 + i;
  }

  window.numPagesLoaded += 1;
  setStatusBarText(
    `Loading ${volume.toString()} (${window.numPagesLoaded}/${
      window.numPages
    })`,
  );
  showStatusBarForTime(3000);

  if (pageIdx === volumeState.page_idx) {
    updatePage();
    closeAllPopups();
  }
}
