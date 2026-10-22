// Actividad 3: Bend, Twist y Taper sobre barrel.obj.
// Basado en la estructura y el motor de Canvas de Diego Balderas (Actividad 2).

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/JED-01/Practica2@main/modelos/barrel.obj';
const BACKUP_URL = 'https://raw.githubusercontent.com/JED-01/Practica2/main/modelos/barrel.obj';

const $ = id => document.getElementById(id);
const rad = degrees => degrees * Math.PI / 180;
const identity = () => [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];

// También funciona si se pega solo este JS en un Fork del Pen de Diego.
document.title = 'Actividad 3 · Deformaciones';
if ($('title')) $('title').textContent = document.title;
const sourceLink = $('drive') || $('download');
if (sourceLink) {
  sourceLink.href = 'https://github.com/JED-01/Practica2/blob/main/modelos/barrel.obj';
  sourceLink.textContent = 'Descargar OBJ de GitHub';
}

function multiply(A, B) {
  return A.map(row => B[0].map((_, j) =>
    row.reduce((sum, value, k) => sum + value * B[k][j], 0)));
}

function transform(M, p) {
  const q = [...p, 1];
  return M.slice(0, 3).map(row => row.reduce((sum, v, j) => sum + v * q[j], 0));
}

function rotation(axis, degrees) {
  const a = rad(degrees), c = Math.cos(a), s = Math.sin(a), M = identity();
  const [i, j] = [[1, 2], [2, 0], [0, 1]][axis];
  M[i][i] = c; M[i][j] = -s; M[j][i] = s; M[j][j] = c;
  return M;
}

// Lee los vértices y triangula las caras del archivo OBJ.
function parseOBJ(text) {
  const vertices = [], faces = [];
  for (const line of text.split(/\r?\n/)) {
    const [tag, ...items] = line.replace(/#.*/, '').trim().split(/\s+/);
    if (tag === 'v') {
      const p = items.slice(0, 3).map(Number);
      if (p.length !== 3 || !p.every(Number.isFinite)) throw Error('Vértice OBJ inválido');
      vertices.push(p);
    }
    if (tag === 'f') {
      const indices = items.map(item => {
        const n = Number(item.split('/')[0]);
        const index = n < 0 ? vertices.length + n : n - 1;
        if (!Number.isInteger(n) || n === 0 || index < 0 || index >= vertices.length)
          throw Error('Índice OBJ inválido');
        return index;
      });
      if (indices.length < 3) throw Error('Cara OBJ inválida');
      for (let j = 1; j < indices.length - 1; j++)
        faces.push([indices[0], indices[j], indices[j + 1]]);
    }
  }
  if (!vertices.length || !faces.length) throw Error('El OBJ no contiene una malla');
  if (vertices.length > 20000 || faces.length > 40000)
    throw Error('Modelo demasiado grande para este visor');

  // Centra el objeto y lo normaliza a 3 unidades, sin cambiar su proporción.
  const low = [0, 1, 2].map(i => Math.min(...vertices.map(v => v[i])));
  const high = [0, 1, 2].map(i => Math.max(...vertices.map(v => v[i])));
  const size = Math.max(...high.map((value, i) => value - low[i]));
  if (size < 1e-10) throw Error('Modelo de tamaño cero');
  return {
    vertices: vertices.map(p => p.map((v, i) => (v - (low[i] + high[i]) / 2) * 3 / size)),
    faces
  };
}

// Las tres deformaciones operan directamente sobre cada vértice.
function deform(p, type, amount) {
  const [x, y, z] = p;

  if (type === 'twist') {
    const angle = rad(amount) * y / 3;
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c * x + s * z, y, -s * x + c * z];
  }

  if (type === 'taper') {
    const factor = 1 + amount * y / 3;
    return [factor * x, y, factor * z];
  }

  // Bend: dobla gradualmente el eje Y alrededor del eje Z.
  const k = rad(amount) / 3;
  if (Math.abs(k) < 1e-8) return [...p];
  const angle = k * y, radius = 1 / k - x;
  return [x + radius * (1 - Math.cos(angle)), radius * Math.sin(angle), z];
}

// Proyección de las caras 3D en un Canvas 2D; igual que en el ejemplo de Diego.
function render(canvas, mesh, points, yaw, pitch, zoom) {
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

  const camera = multiply(rotation(0, pitch), rotation(1, yaw));
  const rotated = points.map(p => transform(camera, p));
  const project = p => [W / 2 + p[0] * zoom, H / 2 - p[1] * zoom];

  for (let i = 0; i < 3; i++) {
    const axis = [0, 0, 0]; axis[i] = 2.1;
    const end = project(transform(camera, axis));
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(W / 2, H / 2); ctx.lineTo(...end); ctx.stroke();
    ctx.fillStyle = '#000'; ctx.font = '14px Arial';
    ctx.fillText('XYZ'[i], end[0] + 4, end[1]);
  }

  // Pinta de atrás hacia delante para ocultar las caras posteriores.
  const triangles = mesh.faces.map(face => ({
    face,
    depth: face.reduce((sum, i) => sum + rotated[i][2], 0) / 3
  }));
  triangles.sort((a, b) => a.depth - b.depth);

  for (const {face} of triangles) {
    const [a, b, c] = face.map(i => rotated[i]);
    const u = b.map((v, i) => v - a[i]);
    const v = c.map((value, i) => value - a[i]);
    const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    const norm = Math.hypot(...n);
    if (norm < 1e-12) continue;
    const light = .28 + .72 * Math.abs((n[0]*.3+n[1]*.5+n[2]*.8124)/norm);
    ctx.fillStyle = `rgb(${165*light},${165*light},${165*light})`;
    ctx.beginPath();
    [a, b, c].forEach((p, i) => {
      const xy = project(p);
      if (i === 0) ctx.moveTo(...xy); else ctx.lineTo(...xy);
    });
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = .45; ctx.stroke();
  }
}

let mesh = null;
let loadNumber = 0;
const settings = {amount: 0, progress: 100, yaw: 32, pitch: 18, zoom: 95};

function makeSelect(id, title, options) {
  const select = document.createElement('select'); select.id = id;
  for (const [value, label] of options) select.add(new Option(label, value));
  const row = document.createElement('label'); row.textContent = title;
  row.append(select); $('controls').append(row);
  select.onchange = draw;
}

function makeSlider(id, title, min, max, step, initial) {
  const row = document.createElement('label'); row.textContent = title;
  const value = document.createElement('output'); value.id = `${id}Out`; value.textContent = initial;
  const slider = document.createElement('input');
  slider.type = 'range'; slider.id = id;
  Object.assign(slider, {min, max, step, value: initial});
  row.append(value, slider); $('controls').append(row);
  slider.oninput = () => {
    settings[id] = Number(slider.value);
    value.textContent = slider.value;
    draw();
  };
}

makeSelect('type', 'Deformación', [
  ['bend', 'Bend (doblado)'],
  ['twist', 'Twist (torsión)'],
  ['taper', 'Taper (afilado)']
]);
makeSlider('amount', 'Cantidad de deformación', -1, 1, .01, 0);
makeSlider('progress', 'Progreso (%)', 0, 100, 1, 100);
makeSlider('yaw', 'Cámara: azimut (grados)', -180, 180, 1, 32);
makeSlider('pitch', 'Cámara: elevación (grados)', -80, 80, 1, 18);
makeSlider('zoom', 'Cámara: zoom', 40, 150, 1, 95);

function draw() {
  if (!mesh) return;
  try {
    const type = $('type').value;
    const strength = settings.amount * settings.progress / 100;
    const actual = strength * (type === 'bend' ? 90 : type === 'twist' ? 180 : 1.6);
    const points = mesh.vertices.map(p => deform(p, type, actual));
    render($('original'), mesh, mesh.vertices, settings.yaw, settings.pitch, settings.zoom);
    render($('result'), mesh, points, settings.yaw, settings.pitch, settings.zoom);
    $('error').textContent = '';
  } catch (error) {
    $('error').textContent = error.message;
  }
}

function loadOBJ(text, name) {
  mesh = parseOBJ(text);
  $('model').textContent = `Modelo: ${name}`;
  draw();
}

async function loadBarrel() {
  const ticket = ++loadNumber;
  $('model').textContent = 'Cargando barrel.obj desde GitHub...';
  $('error').textContent = '';
  try {
    let response;
    try { response = await fetch(MODEL_URL); } catch (e) { response = null; }
    if (!response || !response.ok) response = await fetch(BACKUP_URL);
    if (!response.ok) throw Error(`No se pudo descargar el modelo (${response.status})`);
    const text = await response.text();
    if (ticket === loadNumber) loadOBJ(text, 'barrel.obj (GitHub)');
  } catch (error) {
    if (ticket === loadNumber) {
      $('model').textContent = 'No se pudo cargar el barril';
      $('error').textContent = error.message;
    }
  }
}

$('file').onchange = async event => {
  const ticket = ++loadNumber;
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 30*1024*1024) throw Error('El archivo supera 30 MB');
    const text = await file.text();
    if (ticket === loadNumber) loadOBJ(text, file.name);
  } catch (error) { $('error').textContent = error.message; }
};

function resetDeformation() {
  $('type').value = 'bend';
  for (const [id, value] of [['amount', 0], ['progress', 100]]) {
    settings[id] = value;
    $(id).value = value;
    $(`${id}Out`).textContent = value;
  }
  draw();
}

$('reset').onclick = resetDeformation;
$('demo').onclick = () => {resetDeformation(); loadBarrel();};

loadBarrel();

// Exportación opcional para comprobar las fórmulas sin abrir el navegador.
if (typeof module !== 'undefined') module.exports = {parseOBJ, deform, rotation, multiply, transform};
