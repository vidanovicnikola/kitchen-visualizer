// 1. Data Definitions for Kitchen Layouts
const kitchenData = [
  {
    id: 'photo',
    title: 'Corner Kitchen (Photo)',
    image: 'kitchen_1.jpeg',
    width: 1205,
    height: 1306,
    defaultCabinetColor: null,
    doors: [
      { id: 'p1', points: '55,122 234,141 235,469 55,466' },
      { id: 'p2', points: '234,141 396,160 395,472 235,469' },
      { id: 'p3', points: '396,160 538,176 537,475 395,472' },
      { id: 'p4', points: '538,176 664,190 664,478 537,475' },
      { id: 'p5', points: '664,190 736,155 737,473 664,478' },
      { id: 'p6', points: '736,155 845,98 846,338 736,362' },
      { id: 'p7', points: '845,98 995,18 995,304 846,338' },
      { id: 'p8', points: '55,833 231,817 232,1131 53,1164' },
      { id: 'p9', points: '231,817 387,804 387,1102 232,1131' },
      { id: 'p10', points: '387,804 521,792 521,1075 387,1102' },
      { id: 'p11', points: '521,792 623,783 623,1056 521,1075' },
      { id: 'p12', points: '661,798 914,921 914,1032 660,876' },
      { id: 'p13', points: '661,876 914,1032 914,1163 660,962' },
      { id: 'p14', points: '660,962 914,1163 915,1318 661,1075' },
      { id: 'p15', points: '915,911 944,922 1191,879 1191,1245 914,1346' },
      { id: 'p16', points: '623,783 634,786 661,798 661,1075 638,1053 623,1056' },
    ]
  },
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
let activeKitchenIndex = 0;
let selectedCabinetId = null;
let activeColorMap = {}; // Stores color per door

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
  loadKitchen(0);
}

// Clicking anywhere that isn't a door, the palette or a viewer/editor control closes the palette
function setupPaletteDismiss() {
  document.addEventListener('click', e => {
    // composedPath: swatch buttons get re-rendered during their own click, so e.target may be detached
    const selector = '.cabinet-group, .palette-popover, .view-controls, .edit-handle, .edit-panel, .thumbnails-nav';
    if (e.composedPath().some(el => el.matches && el.matches(selector))) return;
    palettePopover.classList.remove('active');
    selectedCabinetId = null;
    document.querySelectorAll('.cabinet-door').forEach(el => el.classList.remove('selected'));
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
  palettePopover.classList.remove('active');
  Object.assign(view, { x: 0, y: 0 });
  viewBase.w = 0;

  const kitchen = kitchenData[index];
  
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
    if (!activeColorMap[door.id]) {
      activeColorMap[door.id] = kitchen.defaultCabinetColor;
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
    const currentColor = activeColorMap[door.id] || kitchen.defaultCabinetColor;
    svgContent += `
      <g class="cabinet-group" onclick="selectDoor('${door.id}')">
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
  let svgContent = `<image id="photoImage" href="${kitchen.image}" width="${kitchen.width}" height="${kitchen.height}" />`;
  kitchen.doors.forEach(door => {
    const color = activeColorMap[door.id];
    svgContent += `
      <g class="cabinet-group" onclick="selectDoor('${door.id}')">
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
const EDIT_MODE = new URLSearchParams(location.search).has('edit');

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

  const refreshPanel = () => {
    const text = kitchen.doors.map(d => `{ id: '${d.id}', points: '${d.points}' },`).join('\n');
    panel.innerHTML = `<button id="editCopy">Copy points</button>
      <p class="edit-help">Drag corner = move &middot; Right-click empty area = new door &middot;
      Double-click door = add point on nearest edge &middot; Right-click point = delete point &middot;
      Shift + right-click door = delete door</p><pre></pre>`;
    panel.querySelector('pre').textContent = text;
    panel.querySelector('#editCopy').onclick = () => navigator.clipboard.writeText(text);
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
  const rebuild = () => renderPhotoKitchen(kitchen);
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
        refreshPanel();
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
      delete activeColorMap[id];
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

// 4. Handle Door Selection
function selectDoor(doorId) {
  selectedCabinetId = doorId;

  // Highlight selected door element
  document.querySelectorAll('.cabinet-door').forEach(el => el.classList.remove('selected'));
  const activeElement = document.getElementById(`door-${doorId}`);
  if (activeElement) {
    activeElement.classList.add('selected');
  }

  // Show Floating Palette
  palettePopover.classList.add('active');
}

// 5. Change Cabinet Color
function changeColor(hexColor) {
  if (!selectedCabinetId) return;

  activeColorMap[selectedCabinetId] = hexColor;
  
  // Update element fill directly for smooth response
  const activeElement = document.getElementById(`door-${selectedCabinetId}`);
  if (activeElement) {
    activeElement.setAttribute('fill', hexColor);
    if (activeElement.classList.contains('photo-door')) {
      activeElement.setAttribute('fill-opacity', 0.75);
    }
  }

  // Update Swatch UI active ring
  renderPaletteSwatches(hexColor);
}

// 5b. Revert the selected door to its original look
function resetColor() {
  if (!selectedCabinetId) return;
  const kitchen = kitchenData[activeKitchenIndex];
  const activeElement = document.getElementById(`door-${selectedCabinetId}`);

  if (kitchen.image) {
    // Photo doors are transparent overlays: no color means the original photo shows
    delete activeColorMap[selectedCabinetId];
    if (activeElement) activeElement.setAttribute('fill-opacity', 0);
  } else {
    activeColorMap[selectedCabinetId] = kitchen.defaultCabinetColor;
    if (activeElement) activeElement.setAttribute('fill', kitchen.defaultCabinetColor);
  }
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
    card.innerHTML = `<div class="thumb-title">${kitchen.title}</div>`;
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