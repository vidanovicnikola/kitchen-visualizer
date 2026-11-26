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

function initColorConfigUI() {
  const header = document.querySelector('header');
  const controls = document.createElement('div');
  controls.className = 'color-config-controls';
  controls.innerHTML = `
    <button type="button" class="color-config-btn" id="saveColorsBtn">Save kitchen colors</button>
    <button type="button" class="color-config-btn" id="loadColorsBtn">Load kitchen colors</button>
    <input type="file" id="loadColorsInput" accept=".json,application/json" hidden>
    <span id="colorConfigStatus" class="color-config-status" role="status"></span>`;
  header.appendChild(controls);

  const input = controls.querySelector('#loadColorsInput');
  controls.querySelector('#saveColorsBtn').onclick = saveColorConfig;
  controls.querySelector('#loadColorsBtn').onclick = () => input.click();
  input.onchange = () => {
    if (input.files[0]) loadColorConfigFile(input.files[0]);
    input.value = ''; // allow loading the same file again
  };
}
