/* Shared progressive enhancements; the four pages and active navigation work without JS. */
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const mobileQuery = window.matchMedia('(max-width: 800px)');

// Keep keyboard/fragment scrolling clear of the actual header height, including
// an expanded mobile menu. Sticky positioning itself requires no scroll handler.
const siteHeader = document.querySelector('.site-header');
function updateHeaderOffset() {
  document.documentElement.style.setProperty('--header-offset', `${Math.ceil(siteHeader.getBoundingClientRect().height) + 16}px`);
}
updateHeaderOffset();
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(updateHeaderOffset).observe(siteHeader);
} else {
  window.addEventListener('resize', updateHeaderOffset);
}

function setMenu(open, restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  nav.hidden = mobileQuery.matches && !open;
  if (restoreFocus) menuButton.focus();
}

function updateNavigationLayout() {
  menuButton.hidden = !mobileQuery.matches;
  setMenu(false);
}

menuButton.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileQuery.matches && !nav.hidden) setMenu(false, true);
});
document.addEventListener('click', event => {
  if (mobileQuery.matches && !nav.hidden && !event.target.closest('.header-inner')) setMenu(false);
});
mobileQuery.addEventListener('change', updateNavigationLayout);
// Restore a closed menu when a page returns from the back/forward cache.
window.addEventListener('pageshow', updateNavigationLayout);
updateNavigationLayout();

/* Native dialog with fit/native-pixel zoom. Buttons and slider also work on touch screens. */
const lightbox = document.querySelector('#figure-lightbox');
if (lightbox && typeof lightbox.showModal === 'function') {
  const image = lightbox.querySelector('#lightbox-image');
  const caption = lightbox.querySelector('#lightbox-caption');
  const viewport = lightbox.querySelector('.lightbox-scroll');
  const canvas = lightbox.querySelector('.lightbox-canvas');
  const zoomIn = lightbox.querySelector('#zoom-in');
  const zoomOut = lightbox.querySelector('#zoom-out');
  const reset = lightbox.querySelector('#zoom-reset');
  const slider = lightbox.querySelector('#zoom-range');
  const output = lightbox.querySelector('#zoom-value');
  let opener = null, savedPosition = { x: 0, y: 0 };
  let nativeWidth = 1, nativeHeight = 1, zoom = 1, fit = 1, layout = null;
  let drag = null;
  slider.min = '0';

  function syncControls() {
    const atFit = zoom <= fit + .0001;
    zoomOut.disabled = atFit;
    zoomIn.disabled = zoom >= 1 - .0001;
    slider.disabled = fit >= 1 - .0001;
    slider.value = fit < 1 ? String((zoom - fit) / (1 - fit) * 100) : '100';
    const percent = Math.round(zoom * 100);
    output.textContent = `${percent}%`;
    slider.setAttribute('aria-valuetext', `${percent}% of original image size`);
    viewport.classList.toggle('can-pan', layout.canvasWidth > viewport.clientWidth + 1 || layout.canvasHeight > viewport.clientHeight + 1);
  }

  function draw(nextZoom, anchorX = viewport.clientWidth / 2, anchorY = viewport.clientHeight / 2, resetPosition = false) {
    const previousLayout = layout, previousZoom = zoom;
    const oldLeft = viewport.scrollLeft, oldTop = viewport.scrollTop;
    zoom = ViewerMath.clamp(nextZoom, fit);
    layout = ViewerMath.layout(nativeWidth, nativeHeight, zoom, viewport.clientWidth, viewport.clientHeight);
    canvas.style.width = `${layout.canvasWidth}px`;
    canvas.style.height = `${layout.canvasHeight}px`;
    image.style.width = `${layout.imageWidth}px`;
    image.style.height = `${layout.imageHeight}px`;
    image.style.left = `${layout.offsetX}px`;
    image.style.top = `${layout.offsetY}px`;
    const position = previousLayout && !resetPosition
      ? ViewerMath.anchoredScroll(previousLayout, layout, previousZoom, zoom, oldLeft, oldTop, anchorX, anchorY)
      : { left: 0, top: 0 };
    viewport.scrollLeft = position.left;
    viewport.scrollTop = position.top;
    syncControls();
  }

  function resetView() {
    if (!lightbox.open || !viewport.clientWidth || !viewport.clientHeight) return;
    fit = ViewerMath.fit(nativeWidth, nativeHeight, viewport.clientWidth, viewport.clientHeight);
    draw(fit, 0, 0, true);
  }

  function resizeView() {
    if (!lightbox.open) return;
    const wasFit = zoom <= fit + .0001;
    fit = ViewerMath.fit(nativeWidth, nativeHeight, viewport.clientWidth, viewport.clientHeight);
    draw(wasFit ? fit : zoom, viewport.clientWidth / 2, viewport.clientHeight / 2, wasFit);
  }

  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      event.preventDefault();
      if (lightbox.open) return;
      opener = link;
      savedPosition = { x: window.scrollX, y: window.scrollY };
      nativeWidth = Number(link.dataset.width);
      nativeHeight = Number(link.dataset.height);
      image.src = link.getAttribute('href');
      image.alt = link.querySelector('img').alt;
      image.width = nativeWidth;
      image.height = nativeHeight;
      caption.textContent = link.dataset.caption;
      layout = null;
      document.body.style.top = `-${savedPosition.y}px`;
      document.body.classList.add('lightbox-open');
      lightbox.showModal();
      resetView();
    });
  });

  zoomIn.addEventListener('click', () => draw(zoom * 1.25));
  zoomOut.addEventListener('click', () => draw(zoom / 1.25));
  reset.addEventListener('click', resetView);
  slider.addEventListener('input', () => draw(fit + (1 - fit) * Number(slider.value) / 100));
  lightbox.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); draw(zoom * 1.25); }
    if (event.key === '-') { event.preventDefault(); draw(zoom / 1.25); }
    if (event.key === '0') { event.preventDefault(); resetView(); }
  });

  // Mouse dragging changes scroll position. Touch keeps native one-finger scrolling.
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !viewport.classList.contains('can-pan')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  function finishDrag() {
    if (drag && viewport.hasPointerCapture(drag.id)) viewport.releasePointerCapture(drag.id);
    drag = null;
    viewport.classList.remove('is-dragging');
  }
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('lostpointercapture', () => { drag = null; viewport.classList.remove('is-dragging'); });
  if ('ResizeObserver' in window) new ResizeObserver(resizeView).observe(viewport);
  else window.addEventListener('resize', resizeView);

  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    finishDrag();
    document.body.classList.remove('lightbox-open');
    document.body.style.top = '';
    window.scrollTo(savedPosition.x, savedPosition.y);
    if (opener) opener.focus({ preventScroll: true });
  });
}
// Without JS or dialog support, the real local image URL remains usable in this tab.

/* Contact clipboard action, including file:// and unavailable/denied clipboard fallback. */
const copyButton = document.querySelector('#copy-email');
if (copyButton) {
  const copyStatus = document.querySelector('#copy-status');
  copyButton.hidden = false;

  function fallbackCopy(text) {
    const selection = window.getSelection();
    const ranges = [];
    if (selection) {
      for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
    }
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-label', 'Email address to copy');
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.append(field);
    try {
      field.select();
      field.setSelectionRange(0, text.length);
      if (!document.execCommand('copy')) throw new Error('Clipboard copy failed');
    } finally {
      field.remove();
      if (selection) {
        selection.removeAllRanges();
        ranges.forEach(range => selection.addRange(range));
      }
      if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    }
  }

  let copyInProgress = false;
  copyButton.addEventListener('click', async () => {
    if (copyInProgress) return;
    copyInProgress = true;
    copyButton.setAttribute('aria-busy', 'true');
    copyStatus.textContent = '';
    try {
      const email = copyButton.dataset.email;
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(email);
      } catch {
        fallbackCopy(email);
      }
      copyStatus.textContent = 'Copied';
    } catch {
      copyStatus.textContent = 'Copy unavailable. Select the email address to copy it.';
    } finally {
      copyInProgress = false;
      copyButton.removeAttribute('aria-busy');
    }
  });
}
