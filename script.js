// 1. Data Definitions for Kitchen Layouts
// Built-in illustrated kitchens (photo kitchens live in kitchens-data.js)
const builtinKitchens = [
  {
    id: 'modern',
    title: 'Modern Minimalist',
    wallColor: '#cbd5e1',
    counterColor: '#ffffff',
    defaultCabinetColor: '#1e3a8a',
    doors: [
      { id: 'd1', x: 200, y: 280, width: 110, height: 160 },
      { id: 'd2', x: 320, y: 280, width: 110, height: 160 },
      { id: 'd3', x: 440, y: 280, width: 110, height: 160 },
      { id: 'd4', x: 260, y: 80,  width: 120, height: 110 },
      { id: 'd5', x: 400, y: 80,  width: 120, height: 110 }
    ]
  },
  {
    id: 'scandi',
    title: 'Scandinavian Warmth',
    wallColor: '#f1f5f9',
    counterColor: '#d97706',
    defaultCabinetColor: '#475569',
    doors: [
      { id: 'd1', x: 180, y: 290, width: 130, height: 150 },
      { id: 'd2', x: 320, y: 290, width: 130, height: 150 },
      { id: 'd3', x: 460, y: 290, width: 130, height: 150 },
      { id: 'd4', x: 220, y: 90,  width: 160, height: 100 },
      { id: 'd5', x: 400, y: 90,  width: 160, height: 100 }
    ]
  },
  {
    id: 'classic',
    title: 'Classic Shaker',
    wallColor: '#e2e8f0',
    counterColor: '#334155',
    defaultCabinetColor: '#164e63',
    doors: [
      { id: 'd1', x: 160, y: 270, width: 140, height: 170 },
      { id: 'd2', x: 310, y: 270, width: 140, height: 170 },
      { id: 'd3', x: 460, y: 270, width: 140, height: 170 },
      { id: 'd4', x: 240, y: 70,  width: 140, height: 120 },
      { id: 'd5', x: 400, y: 70,  width: 140, height: 120 }
    ]
  },
  {
    id: 'urban',
    title: 'Urban Industrial',
    wallColor: '#94a3b8',
    counterColor: '#0f172a',
    defaultCabinetColor: '#7f1d1d',
    doors: [
      { id: 'd1', x: 220, y: 300, width: 100, height: 140 },
      { id: 'd2', x: 330, y: 300, width: 100, height: 140 },
      { id: 'd3', x: 440, y: 300, width: 100, height: 140 },
      { id: 'd4', x: 250, y: 100, width: 130, height: 90 },
      { id: 'd5', x: 390, y: 100, width: 130, height: 90 }
    ]
  }
];

// Color Palette Swatches
const colorSwatches = [
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Charcoal', hex: '#334155' },
  { name: 'Sage Green', hex: '#3f6212' },
  { name: 'Terracotta', hex: '#9a3412' },
  { name: 'Cream White', hex: '#fef3c7' },
  { name: 'Forest Green', hex: '#14532d' },
  { name: 'Burgundy', hex: '#7f1d1d' },
  { name: 'Slate Gray', hex: '#475569' }
];

// State Variables
const EDIT_MODE = new URLSearchParams(location.search).has('edit');
const DRAFT_KEY = 'kitchenVisualizerDraft';

// Photo kitchens come from kitchens-data.js; in edit mode a browser-saved draft takes precedence
function loadPhotoKitchens() {
  const fromFile = typeof savedPhotoKitchens === 'undefined' ? [] : savedPhotoKitchens;
  if (EDIT_MODE) {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (Array.isArray(draft)) return draft;
    } catch (err) { /* no usable draft */ }
  }
  return JSON.parse(JSON.stringify(fromFile));
}

let photoKitchens = loadPhotoKitchens();
let kitchenData = [];
function syncKitchenData() {
  kitchenData = [...photoKitchens, ...builtinKitchens];
}
syncKitchenData();

let activeKitchenIndex = 0;
let selectedCabinetId = null;
let activeColorMap = {}; // Stores color per door, keyed by "kitchenId:doorId"
const colorKey = doorId => `${kitchenData[activeKitchenIndex].id}:${doorId}`;

// DOM Elements
const svgCanvas = document.getElementById('kitchenCanvas');
const palettePopover = document.getElementById('palettePopover');
const swatchContainer = document.getElementById('swatchContainer');
const thumbNav = document.getElementById('thumbNav');

// 2. Initialize App
function init() {
  renderThumbnails();
  renderPaletteSwatches();
  setupViewControls();
  setupPaletteDismiss();
  if (EDIT_MODE) setupEditToolbar();
  loadKitchen(0);
}

// Clicking anywhere that isn't a door, the palette or a viewer/editor control closes the palette
function setupPaletteDismiss() {
  document.addEventListener('click', e => {
    // composedPath: swatch buttons get re-rendered during their own click, so e.target may be detached
    const selector = '.cabinet-group, .palette-popover, .view-controls, .edit-handle, .edit-panel, .thumbnails-nav';
    if (e.composedPath().some(el => el.matches && el.matches(selector))) return;
    palettePopover.classList.remove('active');
    clearSelection();
  });
}

// Zoom / pan / fullscreen: handled by changing the SVG viewBox, so image coordinates stay valid
const view = { x: 0, y: 0, w: 800, h: 500 };
const viewBase = { w: 800, h: 500 };
const MAX_ZOOM = 8;

function applyView() {
  svgCanvas.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
  const scale = view.w / viewBase.w;
  document.querySelectorAll('.edit-handle').forEach(h => {
    h.setAttribute('r', h.dataset.radius * scale);
  });
}

function setViewBase(w, h, reset) {
  if (reset || viewBase.w !== w || viewBase.h !== h) {
    viewBase.w = w;
    viewBase.h = h;
    Object.assign(view, { x: 0, y: 0, w, h });
  }
  applyView();
}

function zoomAt(factor, clientX, clientY) {
  const newW = Math.min(viewBase.w, Math.max(viewBase.w / MAX_ZOOM, view.w / factor));
  const ratio = newW / view.w;
  const pt = svgCanvas.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const before = pt.matrixTransform(svgCanvas.getScreenCTM().inverse());
  view.w = newW;
  view.h *= ratio;
  applyView();
  // Keep the point under the cursor fixed
  const after = pt.matrixTransform(svgCanvas.getScreenCTM().inverse());
  view.x += before.x - after.x;
  view.y += before.y - after.y;
  if (view.w >= viewBase.w) Object.assign(view, { x: 0, y: 0 });
  applyView();
}

function zoomCenter(factor) {
  const r = svgCanvas.getBoundingClientRect();
  zoomAt(factor, r.left + r.width / 2, r.top + r.height / 2);
}

function setupViewControls() {
  const card = document.querySelector('.visualizer-card');
  const bar = document.createElement('div');
  bar.className = 'view-controls';
  bar.innerHTML = `
    <button data-act="in" title="Zoom in">+</button>
    <button data-act="out" title="Zoom out">&minus;</button>
    <button data-act="full" title="Full screen">&#9974;</button>`;
  card.appendChild(bar);
  bar.addEventListener('click', e => {
    const act = e.target.dataset.act;
    if (act === 'in') zoomCenter(1.4);
    if (act === 'out') zoomCenter(1 / 1.4);
    if (act === 'reset') { Object.assign(view, { x: 0, y: 0, w: viewBase.w, h: viewBase.h }); applyView(); }
    if (act === 'full') {
      if (document.fullscreenElement) document.exitFullscreen();
      else card.requestFullscreen();
    }
  });

  svgCanvas.addEventListener('wheel', e => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }, { passive: false });

  // Drag the background to pan (middle button works anywhere)
  let pan = null;
  svgCanvas.addEventListener('pointerdown', e => {
    const onShape = e.target.closest('.cabinet-door, .edit-handle');
    if (e.button === 1 || (e.button === 0 && !onShape)) {
      pan = { x: e.clientX, y: e.clientY, moved: false };
    }
  });
  svgCanvas.addEventListener('pointermove', e => {
    if (!pan || !(e.buttons & 5)) { pan = null; return; }
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) < 4) return;
    pan.moved = true;
    const scale = svgCanvas.getScreenCTM().a;
    view.x -= dx / scale;
    view.y -= dy / scale;
    pan.x = e.clientX;
    pan.y = e.clientY;
    applyView();
  });
  window.addEventListener('pointerup', () => { pan = null; });
}

// 3. Render Kitchen SVG Scene
function loadKitchen(index) {
  activeKitchenIndex = index;
  selectedCabinetId = null;
  selectedIds.clear();
  updateMultiUI();
  palettePopover.classList.remove('active');
  Object.assign(view, { x: 0, y: 0 });
  viewBase.w = 0;

  const kitchen = kitchenData[index];
  updateEditToolbar();
  // Initialize cabinet colors to kitchen default
  if (kitchen.image) {
    renderPhotoKitchen(kitchen);
    updateThumbnailSelection();
    return;
  }
  document.querySelectorAll('.edit-panel, .edit-coords').forEach(el => el.remove());
  // Needed only by the disabled color pipette:
  // document.querySelectorAll('.pick-controls').forEach(el => el.remove());
  // if (pickClickHandler) svgCanvas.removeEventListener('click', pickClickHandler, true);
  // pickClickHandler = null;
  // pickMode = false;
  // pickedLab = null;
  // svgCanvas.classList.remove('picking');
  svgCanvas.onmousemove = null;
  setViewBase(800, 500);

  kitchen.doors.forEach(door => {
    if (!activeColorMap[colorKey(door.id)]) {
      activeColorMap[colorKey(door.id)] = kitchen.defaultCabinetColor;
    }
  });

  // Build SVG Markup
  let svgContent = `
    <!-- Background Wall -->
    <rect width="800" height="500" fill="${kitchen.wallColor}" />

    <!-- Kitchen Countertop -->
    <rect x="100" y="250" width="600" height="25" fill="${kitchen.counterColor}" rx="2" />
    <rect x="120" y="275" width="560" height="185" fill="#475569" opacity="0.15" />
  `;

  // Render Upper and Lower Cabinet Doors
  kitchen.doors.forEach(door => {
    const currentColor = activeColorMap[colorKey(door.id)] || kitchen.defaultCabinetColor;
    svgContent += `
      <g class="cabinet-group" onclick="selectDoor('${door.id}', event)">
        <!-- Main Door Frame -->
        <rect 
          id="door-${door.id}" 
          class="cabinet-door" 
          x="${door.x}" 
          y="${door.y}" 
          width="${door.width}" 
          height="${door.height}" 
          fill="${currentColor}" 
          rx="4" 
          stroke="#0f172a" 
          stroke-width="2" 
        />
        <!-- Handle Detail -->
        <rect 
          x="${door.x + door.width - 16}" 
          y="${door.y + (door.height / 2) - 15}" 
          width="6" 
          height="30" 
          fill="#cbd5e1" 
          rx="2" 
        />
      </g>
    `;
  });

  svgCanvas.innerHTML = svgContent;
  updateThumbnailSelection();
}

// Photo kitchen: transparent polygons over the image; tinted only once a color is picked
function renderPhotoKitchen(kitchen) {
  setViewBase(kitchen.width, kitchen.height);
  let svgContent = `<image id="photoImage" href="${kitchen._src || kitchen.image}" width="${kitchen.width}" height="${kitchen.height}" />`;
  kitchen.doors.forEach(door => {
    const color = activeColorMap[colorKey(door.id)];
    svgContent += `
      <g class="cabinet-group" onclick="selectDoor('${door.id}', event)">
        <polygon id="door-${door.id}" class="cabinet-door photo-door"
          points="${door.points}"
          fill="${color || '#ffffff'}"
          fill-opacity="${color ? 0.75 : 0}" />
      </g>`;
  });
  svgCanvas.innerHTML = svgContent;
  // setupColorPicker(kitchen); // pipette disabled, see commented block below
  if (EDIT_MODE) setupPointEditor(kitchen);
}

/* DISABLED: color pipette (pick a color on the photo, replace it with a palette color).
   Not used because similar colors (e.g. wall vs. doors) get replaced together.
   To re-enable: remove this comment block, and restore the commented lines in
   loadKitchen, renderPhotoKitchen (setupColorPicker, photoDataUrl), selectDoor and changeColor.
   Needs the page served over http (reading pixels is blocked on file://). Styles: .pick-* in style.css.

// Color pipette: pick a color on the photo, then replace it (shading preserved) with a palette color
let photoDataUrl = null;   // current recolored photo (null = original file)
let workCanvas = null;     // working pixels of the recolored photo
let pickMode = false;
let pickedLab = null;
let pickTolerance = 12;
let pickClickHandler = null;

function rgbToLab([r, g, b]) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = lin(r), G = lin(g), B = lin(b);
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function labToRgb([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = t => t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787;
  const x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
  const lin = [3.2406 * x - 1.5372 * y - 0.4986 * z, -0.9689 * x + 1.8758 * y + 0.0415 * z, 0.0557 * x - 0.2040 * y + 1.0570 * z];
  return lin.map(c => {
    c = Math.min(1, Math.max(0, c));
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
  });
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function loadWorkCanvas(kitchen) {
  return new Promise(resolve => {
    if (workCanvas) return resolve(workCanvas);
    const img = new Image();
    img.onload = () => {
      workCanvas = document.createElement('canvas');
      workCanvas.width = kitchen.width;
      workCanvas.height = kitchen.height;
      workCanvas.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, kitchen.width, kitchen.height);
      resolve(workCanvas);
    };
    img.src = kitchen.image;
  });
}

async function pickPhotoColor(kitchen, evt) {
  const pt = svgCanvas.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const p = pt.matrixTransform(svgCanvas.getScreenCTM().inverse());
  const canvas = await loadWorkCanvas(kitchen);
  try {
    // Average a small area to ignore texture noise
    const d = canvas.getContext('2d').getImageData(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 5).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    const rgb = [r / n, g / n, b / n].map(Math.round);
    pickedLab = rgbToLab(rgb);
    selectedCabinetId = null;
    document.querySelectorAll('.cabinet-door').forEach(el => el.classList.remove('selected'));
    document.getElementById('pickSample').style.backgroundColor = `rgb(${rgb.join(',')})`;
    document.getElementById('pickHint').textContent = 'Now choose a replacement color from the palette';
    renderPaletteSwatches();
    palettePopover.classList.add('active');
  } catch (err) {
    document.getElementById('pickHint').textContent =
      'Browser blocked reading pixels from a local file. Serve the folder over http (e.g. "python -m http.server") and open it via localhost.';
  }
}

function replacePickedColor(hexColor) {
  const ctx = workCanvas.getContext('2d');
  const frame = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
  const px = frame.data;
  const target = pickedLab;
  const newLab = rgbToLab(hexToRgb(hexColor));
  const ratio = newLab[0] / Math.max(target[0], 1);
  for (let i = 0; i < px.length; i += 4) {
    const lab = rgbToLab([px[i], px[i + 1], px[i + 2]]);
    const dist = Math.hypot(lab[1] - target[1], lab[2] - target[2], 0.5 * (lab[0] - target[0]));
    let w = 1 - dist / pickTolerance;
    if (w <= 0) continue;
    w = w * w * (3 - 2 * w);
    const out = labToRgb([
      Math.min(100, lab[0] * ratio),
      lab[1] + (newLab[1] - target[1]),
      lab[2] + (newLab[2] - target[2])
    ]);
    for (let c = 0; c < 3; c++) px[i + c] = Math.round(px[i + c] * (1 - w) + out[c] * w);
  }
  ctx.putImageData(frame, 0, 0);
  photoDataUrl = workCanvas.toDataURL('image/png');
  document.getElementById('photoImage').setAttribute('href', photoDataUrl);
  // The recolored area is now the new color, so continue from it if the user picks again
  pickedLab = null;
  document.getElementById('pickHint').textContent = 'Done. Pick another color or click a door';
  renderPaletteSwatches(hexColor);
}

function setupColorPicker(kitchen) {
  document.querySelectorAll('.pick-controls').forEach(el => el.remove());
  const bar = document.createElement('div');
  bar.className = 'pick-controls';
  bar.innerHTML = `
    <button id="pickToggle" class="pick-btn">Pick color from photo</button>
    <span id="pickSample" class="pick-sample"></span>
    <label>Tolerance <input id="pickTol" type="range" min="3" max="40" value="${pickTolerance}"></label>
    <button id="pickReset" class="pick-btn">Reset photo</button>
    <span id="pickHint" class="pick-hint"></span>`;
  document.querySelector('.container').insertBefore(bar, thumbNav);

  const toggle = bar.querySelector('#pickToggle');
  const syncMode = () => {
    toggle.classList.toggle('active', pickMode);
    svgCanvas.classList.toggle('picking', pickMode);
  };
  syncMode();
  toggle.onclick = () => {
    pickMode = !pickMode;
    pickedLab = null;
    syncMode();
    bar.querySelector('#pickHint').textContent = pickMode ? 'Click a color on the photo' : '';
  };
  bar.querySelector('#pickTol').oninput = e => { pickTolerance = Number(e.target.value); };
  bar.querySelector('#pickReset').onclick = () => {
    photoDataUrl = null;
    workCanvas = null;
    pickedLab = null;
    document.getElementById('photoImage').setAttribute('href', kitchen.image);
  };

  // Capture phase so pipette clicks never reach the door handlers
  if (pickClickHandler) svgCanvas.removeEventListener('click', pickClickHandler, true);
  pickClickHandler = evt => {
    if (!pickMode) return;
    evt.stopPropagation();
    pickPhotoColor(kitchen, evt);
  };
  svgCanvas.addEventListener('click', pickClickHandler, true);
}
*/

// Debug editor (enable with ?edit): drag corner handles, copy resulting points

function setupPointEditor(kitchen) {
  const NS = 'http://www.w3.org/2000/svg';
  const radius = kitchen.width / 180;
  const parse = door => door.points.trim().split(/\s+/).map(p => p.split(',').map(Number));

  let panel = document.getElementById('editPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'editPanel';
    panel.className = 'edit-panel';
    document.querySelector('.container').appendChild(panel);
  }
  const coordLabel = document.createElement('div');
  coordLabel.className = 'edit-coords';

  const refreshPanel = (changed = false) => {
    const text = kitchen.doors.map(d => `{ id: '${d.id}', points: '${d.points}' },`).join('\n');
    panel.innerHTML = `<button id="editCopy">Copy points</button>
      <p class="edit-help">Drag corner = move &middot; Right-click empty area = new door &middot;
      Double-click door = add point on nearest edge &middot; Right-click point = delete point &middot;
      Shift + right-click door = delete door</p><pre></pre>`;
    panel.querySelector('pre').textContent = text;
    panel.querySelector('#editCopy').onclick = () => navigator.clipboard.writeText(text);
    if (changed) saveDraft();
  };

  const toImageCoords = evt => {
    const pt = svgCanvas.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const p = pt.matrixTransform(svgCanvas.getScreenCTM().inverse());
    return [Math.round(p.x), Math.round(p.y)];
  };

  svgCanvas.onmousemove = evt => {
    const [x, y] = toImageCoords(evt);
    coordLabel.textContent = `x: ${x}, y: ${y}`;
  };
  document.querySelectorAll('.edit-coords').forEach(el => el.remove());
  svgCanvas.parentElement.appendChild(coordLabel);

  // Structural edits change the data, then re-render the scene (which rebuilds the handles)
  const rebuild = () => { saveDraft(); renderPhotoKitchen(kitchen); };
  const serialize = pts => pts.map(p => p.join(',')).join(' ');

  kitchen.doors.forEach(door => {
    const poly = document.getElementById(`door-${door.id}`);
    poly.setAttribute('stroke', '#f43f5e');
    poly.setAttribute('stroke-width', radius / 3);
    parse(door).forEach(([x, y], i) => {
      const handle = document.createElementNS(NS, 'circle');
      handle.setAttribute('class', 'edit-handle');
      handle.setAttribute('cx', x);
      handle.setAttribute('cy', y);
      handle.setAttribute('r', radius * view.w / viewBase.w);
      handle.dataset.radius = radius;
      handle.dataset.door = door.id;
      handle.dataset.index = i;
      handle.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener('pointermove', e => {
        if (!handle.hasPointerCapture(e.pointerId)) return;
        const [px, py] = toImageCoords(e);
        const pts = parse(door);
        pts[i] = [px, py];
        door.points = serialize(pts);
        handle.setAttribute('cx', px);
        handle.setAttribute('cy', py);
        poly.setAttribute('points', door.points);
        refreshPanel(true);
      });
      svgCanvas.appendChild(handle);
    });
  });

  // Right-click: empty area = new door, handle = delete point, Shift + door = delete door
  svgCanvas.oncontextmenu = evt => {
    evt.preventDefault();
    const target = evt.target;
    if (target.classList.contains('edit-handle')) {
      const door = kitchen.doors.find(d => d.id === target.dataset.door);
      const pts = parse(door);
      if (pts.length <= 3) return;
      pts.splice(Number(target.dataset.index), 1);
      door.points = serialize(pts);
    } else if (target.classList.contains('photo-door')) {
      if (!evt.shiftKey) return;
      const id = target.id.replace('door-', '');
      kitchen.doors = kitchen.doors.filter(d => d.id !== id);
      delete activeColorMap[colorKey(id)];
    } else {
      const [x, y] = toImageCoords(evt);
      const size = 40;
      const next = Math.max(0, ...kitchen.doors.map(d => Number(d.id.replace(/\D/g, '')) || 0)) + 1;
      kitchen.doors.push({
        id: `p${next}`,
        points: serialize([[x - size, y - size], [x + size, y - size], [x + size, y + size], [x - size, y + size]])
      });
    }
    rebuild();
  };

  // Double-click on a door: insert a point on the nearest edge
  svgCanvas.ondblclick = evt => {
    if (!evt.target.classList.contains('photo-door')) return;
    const door = kitchen.doors.find(d => `door-${d.id}` === evt.target.id);
    const pts = parse(door);
    const [cx, cy] = toImageCoords(evt);
    let best = { dist: Infinity, index: 0, point: null };
    pts.forEach(([x1, y1], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length];
      const len2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / len2));
      const px = x1 + t * (x2 - x1), py = y1 + t * (y2 - y1);
      const dist = Math.hypot(cx - px, cy - py);
      if (dist < best.dist) best = { dist, index: i, point: [Math.round(px), Math.round(py)] };
    });
    pts.splice(best.index + 1, 0, best.point);
    door.points = serialize(pts);
    rebuild();
  };
  refreshPanel();
}

// Edit-mode persistence: plain data only (no session-only fields such as _src)
const plainKitchen = k => ({
  id: k.id, title: k.title, image: k.image, width: k.width, height: k.height,
  doors: k.doors.map(d => ({ id: d.id, points: d.points }))
});

function setEditStatus(text) {
  const el = document.getElementById('editStatus');
  if (el) el.textContent = text;
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(photoKitchens.map(plainKitchen)));
    setEditStatus('Changes autosaved in this browser. Click "Save to file" to keep them permanently.');
  } catch (err) {
    setEditStatus('Could not autosave in this browser. Use "Save to file" before leaving.');
  }
}

function buildDataFile() {
  const kitchens = photoKitchens.map(plainKitchen).map(k => [
    '  {',
    `    id: ${JSON.stringify(k.id)},`,
    `    title: ${JSON.stringify(k.title)},`,
    `    image: ${JSON.stringify(k.image)},`,
    `    width: ${k.width},`,
    `    height: ${k.height},`,
    '    doors: [',
    k.doors.map(d => `      { id: ${JSON.stringify(d.id)}, points: ${JSON.stringify(d.points)} }`).join(',\n'),
    '    ]',
    '  }'
  ].join('\n'));
  return '// Photo kitchens. Generated by the editor (index.html?edit -> "Save to file"); replace this file with the downloaded one.\n' +
    `const savedPhotoKitchens = [\n${kitchens.join(',\n')}\n];\n`;
}

// Set when server.py answers; edit mode then writes straight into the project folder
let editServer = false;

async function postToServer(url, body) {
  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

async function saveDataFile() {
  if (editServer) {
    try {
      await postToServer('api/save-data', buildDataFile());
      setEditStatus('Saved to kitchens-data.js in the project folder.');
      return;
    } catch (err) {
      setEditStatus(`Could not save to the folder (${err.message}); downloading the file instead.`);
    }
  }
  downloadDataFile();
}

function downloadDataFile() {
  const blob = new Blob([buildDataFile()], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kitchens-data.js';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  const newImages = photoKitchens.filter(k => k._src).map(k => k.image);
  setEditStatus('Downloaded kitchens-data.js: replace the file in the project folder.' +
    (newImages.length ? ` Also make sure these images are in that folder: ${newImages.join(', ')}.` : ''));
}

function addKitchenFromFile(file) {
  const src = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    const title = document.getElementById('editTitle').value.trim();
    const kitchen = {
      id: `photo-${Date.now().toString(36)}`,
      title: title || file.name.replace(/\.[^.]+$/, ''),
      image: file.name,
      _src: src,
      width: img.naturalWidth,
      height: img.naturalHeight,
      doors: []
    };
    let note = `Copy "${file.name}" into the project folder (next to index.html) so it loads after saving.`;
    if (editServer) {
      try {
        const saved = await postToServer(`api/upload-image?name=${encodeURIComponent(file.name)}`, file);
        kitchen.image = saved.name;
        delete kitchen._src;
        note = `Image saved in the project folder as "${saved.name}".`;
      } catch (err) {
        note = `Could not copy the image to the folder (${err.message}). ${note}`;
      }
    }
    photoKitchens.push(kitchen);
    syncKitchenData();
    renderThumbnails();
    loadKitchen(photoKitchens.length - 1);
    saveDraft();
    setEditStatus(`Added a new kitchen. ${note} Right-click the picture to add doors.`);
  };
  img.src = src;
}

// Destructive buttons ask for a second click (prompt/confirm are unavailable in some embedded browsers)
function confirmClick(btn, action) {
  if (btn.dataset.armed) {
    clearTimeout(Number(btn.dataset.armed));
    delete btn.dataset.armed;
    btn.textContent = btn.dataset.label;
    action();
    return;
  }
  btn.dataset.label = btn.textContent;
  btn.textContent = 'Click again to confirm';
  btn.dataset.armed = setTimeout(() => {
    delete btn.dataset.armed;
    btn.textContent = btn.dataset.label;
  }, 3000);
}

function setupEditToolbar() {
  const bar = document.createElement('div');
  bar.id = 'editToolbar';
  bar.className = 'edit-toolbar';
  bar.innerHTML = `
    <input id="editTitle" type="text" placeholder="Kitchen name" maxlength="60">
    <button id="editRename">Rename</button>
    <button id="editAddKitchen">+ New kitchen from image</button>
    <button id="editDelete">Delete kitchen</button>
    <button id="editSave" class="primary">Save to file</button>
    <button id="editDiscard">Discard draft</button>
    <input id="editFile" type="file" accept="image/*" hidden>
    <span id="editStatus" class="edit-status"></span>`;
  thumbNav.after(bar);

  const fileInput = bar.querySelector('#editFile');
  bar.querySelector('#editAddKitchen').onclick = () => fileInput.click();
  fileInput.onchange = () => {
    if (fileInput.files[0]) addKitchenFromFile(fileInput.files[0]);
    fileInput.value = '';
  };

  bar.querySelector('#editRename').onclick = () => {
    const kitchen = kitchenData[activeKitchenIndex];
    const title = bar.querySelector('#editTitle').value.trim();
    if (!kitchen.image || !title) return;
    kitchen.title = title;
    renderThumbnails();
    saveDraft();
  };

  bar.querySelector('#editDelete').onclick = e => confirmClick(e.currentTarget, () => {
    const kitchen = kitchenData[activeKitchenIndex];
    photoKitchens = photoKitchens.filter(k => k !== kitchen);
    Object.keys(activeColorMap).filter(k => k.startsWith(`${kitchen.id}:`)).forEach(k => delete activeColorMap[k]);
    syncKitchenData();
    renderThumbnails();
    loadKitchen(0);
    saveDraft();
  });

  bar.querySelector('#editSave').onclick = saveDataFile;

  // Detect the local save server (absent on GitHub Pages or file://)
  fetch('api/ping').then(r => r.ok ? r.json() : null).then(j => {
    editServer = !!(j && j.ok);
    setEditStatus(editServer
      ? 'Connected to the local save server: images and "Save to file" write directly into the project folder.'
      : 'No local save server found: "Save to file" will download kitchens-data.js (run "python server.py" for direct saving).');
  }).catch(() => {});

  bar.querySelector('#editDiscard').onclick = e => confirmClick(e.currentTarget, () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* ignore */ }
    photoKitchens = loadPhotoKitchens();
    syncKitchenData();
    renderThumbnails();
    loadKitchen(0);
    setEditStatus('Draft discarded; kitchens reloaded from kitchens-data.js.');
  });
}

// Rename/Delete only apply to photo kitchens
function updateEditToolbar() {
  const kitchen = kitchenData[activeKitchenIndex];
  const isPhoto = !!(kitchen && kitchen.image);
  ['editRename', 'editDelete'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !isPhoto;
  });
  const title = document.getElementById('editTitle');
  if (title) title.value = isPhoto ? kitchen.title : '';
}

// 4. Handle Door Selection
// Multi-select: toggle button in the palette (works on touch) or Ctrl/Cmd/Shift + click on desktop
let multiSelect = true; // on by default; the palette button turns it off
const selectedIds = new Set();

function clearSelection() {
  selectedIds.clear();
  selectedCabinetId = null;
  document.querySelectorAll('.cabinet-door').forEach(el => el.classList.remove('selected'));
  updateMultiUI();
}

function updateMultiUI() {
  const btn = document.getElementById('multiSelectBtn');
  if (!btn) return;
  btn.classList.toggle('active', multiSelect);
  btn.setAttribute('aria-pressed', multiSelect);
  btn.textContent = multiSelect ? `Multi-select on (${selectedIds.size})` : 'Select multiple areas';
}

function toggleMultiSelect() {
  multiSelect = !multiSelect;
  // Turning on keeps the current selection; turning off keeps just the last picked area
  if (!multiSelect) {
    const keep = selectedCabinetId && selectedIds.has(selectedCabinetId) ? selectedCabinetId : null;
    selectedIds.clear();
    if (keep) selectedIds.add(keep);
    document.querySelectorAll('.cabinet-door').forEach(el => {
      el.classList.toggle('selected', selectedIds.has(el.id.replace('door-', '')));
    });
    if (!keep) palettePopover.classList.remove('active');
  } else {
    palettePopover.classList.add('active');
  }
  updateMultiUI();
}

function selectDoor(doorId, evt) {
  const additive = multiSelect || (evt && (evt.ctrlKey || evt.metaKey || evt.shiftKey));
  if (additive) {
    if (selectedIds.has(doorId)) selectedIds.delete(doorId);
    else selectedIds.add(doorId);
  } else {
    selectedIds.clear();
    selectedIds.add(doorId);
  }
  selectedCabinetId = selectedIds.size ? doorId : null;

  document.querySelectorAll('.cabinet-door').forEach(el => {
    el.classList.toggle('selected', selectedIds.has(el.id.replace('door-', '')));
  });
  updateMultiUI();

  // Show Floating Palette (stays open in multi-select so more areas can be added)
  if (selectedIds.size || multiSelect) palettePopover.classList.add('active');
  else palettePopover.classList.remove('active');
}

// 5. Change Cabinet Color (applies to every selected area)
function changeColor(hexColor) {
  if (!selectedIds.size) return;

  selectedIds.forEach(id => {
    activeColorMap[colorKey(id)] = hexColor;
    // Update element fill directly for smooth response
    const el = document.getElementById(`door-${id}`);
    if (el) {
      el.setAttribute('fill', hexColor);
      if (el.classList.contains('photo-door')) el.setAttribute('fill-opacity', 0.75);
    }
  });

  // Update Swatch UI active ring
  renderPaletteSwatches(hexColor);
}

// 5b. Revert the selected areas to their original look
function resetColor() {
  if (!selectedIds.size) return;
  const kitchen = kitchenData[activeKitchenIndex];

  selectedIds.forEach(id => {
    const el = document.getElementById(`door-${id}`);
    if (kitchen.image) {
      // Photo doors are transparent overlays: no color means the original photo shows
      delete activeColorMap[colorKey(id)];
      if (el) el.setAttribute('fill-opacity', 0);
    } else {
      activeColorMap[colorKey(id)] = kitchen.defaultCabinetColor;
      if (el) el.setAttribute('fill', kitchen.defaultCabinetColor);
    }
  });
  renderPaletteSwatches();
}

// 6. Build Swatch Palette UI
function renderPaletteSwatches(activeHex = null) {
  swatchContainer.innerHTML = '';
  colorSwatches.forEach(swatch => {
    const btn = document.createElement('button');
    btn.className = `swatch-btn ${swatch.hex === activeHex ? 'active' : ''}`;
    btn.style.backgroundColor = swatch.hex;
    btn.title = swatch.name;
    btn.onclick = () => changeColor(swatch.hex);
    swatchContainer.appendChild(btn);
  });
}

// 7. Build Kitchen Selection Thumbnails
function renderThumbnails() {
  thumbNav.innerHTML = '';
  kitchenData.forEach((kitchen, idx) => {
    const card = document.createElement('div');
    card.className = `thumb-card ${idx === activeKitchenIndex ? 'active' : ''}`;
    card.innerHTML = '<div class="thumb-title"></div>';
    card.firstChild.textContent = kitchen.title;
    card.onclick = () => loadKitchen(idx);
    thumbNav.appendChild(card);
  });
}

function updateThumbnailSelection() {
  document.querySelectorAll('.thumb-card').forEach((card, idx) => {
    if (idx === activeKitchenIndex) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Start App on Load
init();