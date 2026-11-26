// Save / load the colors of the active kitchen as a JSON file (download + file picker, no server needed)
const COLOR_CONFIG_VERSION = 1;

function setColorConfigStatus(text) {
  const el = document.getElementById('colorConfigStatus');
  if (el) el.textContent = text;
}

function saveColorConfig() {
  const kitchen = kitchenData[activeKitchenIndex];
  const colors = {};
  kitchen.doors.forEach(door => {
    const fill = activeColorMap[colorKey(door.id)];
    if (fill) colors[door.id] = fill;
  });

  const config = { version: COLOR_CONFIG_VERSION, kitchenId: kitchen.id, kitchenTitle: kitchen.title, colors };
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kitchen-colors-${kitchen.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke late: some mobile browsers start the download asynchronously
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setColorConfigStatus(`Saved ${Object.keys(colors).length} color(s) for "${kitchen.title}".`);
}

// Only flat hex colors and known texture swatches are accepted from a file
function isValidFill(fill) {
  if (typeof fill !== 'string') return false;
  return /^#[0-9a-fA-F]{3,8}$/.test(fill) || colorSwatches.some(s => s.image && swatchFill(s) === fill);
}

function applyColorConfig(config) {
  if (!config || config.version !== COLOR_CONFIG_VERSION || typeof config.colors !== 'object' || !config.colors) {
    throw new Error('not a kitchen color file');
  }
  const index = kitchenData.findIndex(k => k.id === config.kitchenId);
  if (index < 0) throw new Error(`kitchen "${config.kitchenTitle || config.kitchenId}" does not exist in this app`);

  const kitchen = kitchenData[index];
  activeKitchenIndex = index; // colorKey() works on the active kitchen
  let applied = 0;
  kitchen.doors.forEach(door => {
    delete activeColorMap[colorKey(door.id)];
    const fill = config.colors[door.id];
    if (isValidFill(fill)) {
      activeColorMap[colorKey(door.id)] = fill;
      applied++;
    }
  });
  loadKitchen(index);
  setColorConfigStatus(`Loaded ${applied} color(s) for "${kitchen.title}".`);
}

function loadColorConfigFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyColorConfig(JSON.parse(reader.result));
    } catch (err) {
      setColorConfigStatus(`Could not load colors: ${err.message}.`);
    }
  };
  reader.onerror = () => setColorConfigStatus('Could not read the file.');
  reader.readAsText(file);
}

const blobToDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

let embeddedImagesPromise;
// file:// pages cannot fetch their own pictures, so they come from the generated images-data.js
function loadEmbeddedImages() {
  if (!embeddedImagesPromise) {
    embeddedImagesPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'images-data.js';
      script.onload = () => resolve(typeof embeddedImages === 'undefined' ? {} : embeddedImages);
      script.onerror = () => reject(new Error('images-data.js is missing, run "python update_colors.py"'));
      document.head.appendChild(script);
    });
  }
  return embeddedImagesPromise;
}

async function imageToDataUrl(href) {
  if (href.startsWith('data:')) return href;
  if (location.protocol !== 'file:' || href.startsWith('blob:')) {
    const res = await fetch(href);
    if (!res.ok) throw new Error(`could not read ${href}`);
    return blobToDataUrl(await res.blob());
  }
  const embedded = await loadEmbeddedImages();
  const data = embedded[decodeURI(href)];
  if (!data) throw new Error(`${decodeURI(href)} is not in images-data.js, run "python update_colors.py"`);
  return data;
}

// Standalone SVG of the whole kitchen (ignores zoom/pan, selection and editor handles).
// Pictures are inlined because an SVG drawn as an image cannot load external files.
async function buildExportSvg(width, height) {
  const clone = svgCanvas.cloneNode(true);
  clone.querySelectorAll('.edit-handle').forEach(el => el.remove());
  clone.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('viewBox', `0 0 ${viewBase.w} ${viewBase.h}`);
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);

  const cache = new Map();
  await Promise.all([...clone.querySelectorAll('image')].map(async img => {
    const href = img.getAttribute('href');
    if (!cache.has(href)) cache.set(href, imageToDataUrl(href));
    img.setAttribute('href', await cache.get(href));
  }));
  return new XMLSerializer().serializeToString(clone);
}

async function downloadKitchenJpg() {
  const kitchen = kitchenData[activeKitchenIndex];
  try {
    setColorConfigStatus('Preparing picture...');
    // Photos keep their native size; the 800x500 illustrations are drawn larger to stay sharp
    const scale = kitchen.image ? 1 : 2;
    const width = Math.round(viewBase.w * scale);
    const height = Math.round(viewBase.h * scale);
    const svg = await buildExportSvg(width, height);

    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('could not render the picture'));
      img.src = url;
    });
    URL.revokeObjectURL(url);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // JPG has no transparency
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('could not create the JPG'))), 'image/jpeg', 0.92));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kitchen-${kitchen.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setColorConfigStatus(`Picture of "${kitchen.title}" saved as JPG.`);
  } catch (err) {
    setColorConfigStatus(`Could not save the picture: ${err.message}.`);
  }
}

// Feather-style line icons; they inherit the button's text color
const COLOR_CONFIG_ICONS = {
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  load: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'
};

const colorConfigIcon = name =>
  `<svg class="color-config-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${COLOR_CONFIG_ICONS[name]}</svg>`;

function initColorConfigUI() {
  const header = document.querySelector('header');
  const controls = document.createElement('div');
  controls.className = 'color-config-controls';
  controls.innerHTML = `
    <button type="button" class="color-config-btn" id="saveColorsBtn">${colorConfigIcon('save')}<span>Save kitchen colors</span></button>
    <button type="button" class="color-config-btn" id="loadColorsBtn">${colorConfigIcon('load')}<span>Load kitchen colors</span></button>
    <button type="button" class="color-config-btn" id="downloadJpgBtn">${colorConfigIcon('image')}<span>Download picture (JPG)</span></button>
    <input type="file" id="loadColorsInput" accept=".json,application/json" hidden>
    <span id="colorConfigStatus" class="color-config-status" role="status"></span>`;
  header.appendChild(controls);

  const input = controls.querySelector('#loadColorsInput');
  controls.querySelector('#saveColorsBtn').onclick = saveColorConfig;
  controls.querySelector('#loadColorsBtn').onclick = () => input.click();
  controls.querySelector('#downloadJpgBtn').onclick = downloadKitchenJpg;
  input.onchange = () => {
    if (input.files[0]) loadColorConfigFile(input.files[0]);
    input.value = ''; // allow loading the same file again
  };
}
