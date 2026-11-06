// 1. Data Definitions for Kitchen Layouts
const kitchenData = [
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
  loadKitchen(0);
}

// 3. Render Kitchen SVG Scene
function loadKitchen(index) {
  activeKitchenIndex = index;
  selectedCabinetId = null;
  palettePopover.classList.remove('active');

  const kitchen = kitchenData[index];
  
  // Initialize cabinet colors to kitchen default
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
  }

  // Update Swatch UI active ring
  renderPaletteSwatches(hexColor);
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