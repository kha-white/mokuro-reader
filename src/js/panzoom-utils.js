import panzoom from 'panzoom';
import { settings } from './settings';

const pc = document.getElementById('pagesContainer');

export function initPanzoom() {
  window.pz = panzoom(pc, {
    bounds: false,
    maxZoom: 10,
    minZoom: 0.1,
    zoomDoubleClickSpeed: 1,
    enableTextSelection: true,

    beforeMouseDown(e) {
      const shouldIgnore =
        disablePanzoomOnElement(e.target) ||
        e.target.closest('.textBox') !== null ||
        (settings.ctrlToPan && !e.ctrlKey);
      return shouldIgnore;
    },

    beforeWheel(e) {
      const shouldIgnore =
        (settings.altToZoom && !e.altKey) || disablePanzoomOnElement(e.target);
      return shouldIgnore;
    },

    onTouch(e) {
      if (disablePanzoomOnElement(e.target)) {
        e.stopPropagation();
        return false;
      }

      if (e.touches.length > 1) {
        return true;
      }
      return false;
    },

    filterKey(e) {
      if (settings.turnPagesWithArrows) {
        if (
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown'
        ) {
          return true;
        }
      }
    },
  });

  window.addEventListener(
    'resize',
    (event) => {
      setZoomMinMax();
    },
    true,
  );

  window.pz.on('pan', (e) => {
    keepInBounds();
  });

  window.pz.on('zoom', (e) => {
    keepInBounds();
  });

  function keepInBounds() {
    const transform = window.pz.getTransform();

    const { x } = transform;
    const { y } = transform;
    const { scale } = transform;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const w = pc.offsetWidth * scale;
    const h = pc.offsetHeight * scale;

    const x_margin = W * 0.1;
    const y_margin = H * 0.1;

    let min_x = W - w - x_margin;
    let max_x = x_margin;
    let min_y = H - h - y_margin;
    let max_y = y_margin;

    if (w + 2 * x_margin <= W) {
      min_x = x_margin;
      max_x = W - w - x_margin;
    }

    if (h + 2 * y_margin <= H) {
      min_y = y_margin;
      max_y = H - h - y_margin;
    }

    if (x < min_x) {
      transform.x = min_x;
    }
    if (x > max_x) {
      transform.x = max_x;
    }

    if (y < min_y) {
      transform.y = min_y;
    }
    if (y > max_y) {
      transform.y = max_y;
    }
  }

  window.addEventListener(
    'wheel',
    (e) => {
      if (settings.altToZoom) {
        const transforms = pz.getTransform();
        const dx = e.shiftKey ? e.deltaY : 0;
        const dy = e.shiftKey ? 0 : -e.deltaY;

        pz.moveTo(transforms.x + dx, transforms.y + dy);
      }
    },
    {
      passive: true,
    },
  );
}

function disablePanzoomOnElement(element) {
  return document.getElementById('topMenu').contains(element);
}

function getOffsetLeft() {
  return 0;
}

function getOffsetTop() {
  let offset = 0;
  const menu = document.getElementById('topMenu');
  if (!menu.classList.contains('hidden')) {
    offset += menu.getBoundingClientRect().bottom + 10;
  }
  return offset;
}

function getOffsetRight() {
  return 0;
}

function getOffsetBottom() {
  return 0;
}

function getScreenWidth() {
  return window.innerWidth - getOffsetLeft() - getOffsetRight();
}

function getScreenHeight() {
  return window.innerHeight - getOffsetTop() - getOffsetBottom();
}

function panAlign(align_x, align_y) {
  const { scale } = window.pz.getTransform();
  let x;
  let y;

  switch (align_x) {
    case 'left':
      x = getOffsetLeft();
      break;
    case 'center':
      x = getOffsetLeft() + (getScreenWidth() - pc.offsetWidth * scale) / 2;
      break;
    case 'right':
      x = getOffsetLeft() + (getScreenWidth() - pc.offsetWidth * scale);
      break;
  }

  switch (align_y) {
    case 'top':
      y = getOffsetTop();
      break;
    case 'center':
      y = getOffsetTop() + (getScreenHeight() - pc.offsetHeight * scale) / 2;
      break;
    case 'bottom':
      y = getOffsetTop() + (getScreenHeight() - pc.offsetHeight * scale);
      break;
  }

  window.pz.moveTo(x, y);
}

export function zoomOriginal() {
  window.pz.moveTo(0, 0);
  window.pz.zoomTo(0, 0, 1 / window.pz.getTransform().scale);
  panAlign('center', 'center');
}

export function zoomFitToWidth() {
  const scale =
    (1 / window.pz.getTransform().scale) * (getScreenWidth() / pc.offsetWidth);
  window.pz.moveTo(0, 0);
  window.pz.zoomTo(0, 0, scale);
  panAlign('center', 'top');
}

export function zoomFitToScreen() {
  const scale_x = getScreenWidth() / pc.offsetWidth;
  const scale_y = getScreenHeight() / pc.offsetHeight;
  const scale =
    (1 / window.pz.getTransform().scale) * Math.min(scale_x, scale_y);
  window.pz.moveTo(0, 0);
  window.pz.zoomTo(0, 0, scale);
  panAlign('center', 'center');
}

export function zoomDefault() {
  switch (settings.defaultZoomMode) {
    case 'fit to screen':
      zoomFitToScreen();
      break;
    case 'fit to width':
      zoomFitToWidth();
      break;
    case 'original size':
      zoomOriginal();
      break;
  }
}

export function setZoomMinMax() {
  let minZoom;
  let maxZoom;
  if (pc.offsetWidth === 0 || pc.offsetHeight === 0) {
    minZoom = 0.1;
    maxZoom = 10;
  } else {
    minZoom = Math.min(
      (window.innerWidth / pc.offsetWidth) * 0.75,
      (window.innerHeight / pc.offsetHeight) * 0.75,
    );
    maxZoom = Math.max(
      (window.innerWidth / pc.offsetWidth) * 10,
      (window.innerHeight / pc.offsetHeight) * 10,
    );
  }
  window.pz.setMinZoom(minZoom);
  window.pz.setMaxZoom(maxZoom);
}
