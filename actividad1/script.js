// La URL explícita también permite que CodePen detecte el script como módulo.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Archivo real del repositorio público de GitHub.
const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/JED-01/Practica2@main/modelos/barrel.obj';
const BACKUP_URL =
  'https://raw.githubusercontent.com/JED-01/Practica2/main/modelos/barrel.obj';

// 1. Escena, cámara y renderizador.
const container = document.getElementById('viewport');
const status = document.getElementById('load-status');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(4.3, 3.0, 5.3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.target.set(0, 0, 0);
orbit.minDistance = 2.4;
orbit.maxDistance = 18;
orbit.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(4, 8, 6);
scene.add(keyLight);

const floorLevel = -1.35;
const grid = new THREE.GridHelper(12, 24, 0x999999, 0xd9d9d9);
grid.position.y = floorLevel + 0.004;
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);

const axes = new THREE.AxesHelper(2.6);
axes.position.set(-2.3, floorLevel + 0.02, -1.7);
scene.add(axes);

// El grupo padre recibirá las transformaciones afines.
const modelRoot = new THREE.Group();
scene.add(modelRoot);
const meshes = [];

// 2. Material gris sencillo para observar la forma del OBJ.
function makeMaterial(original) {
  const isMetal = original?.name?.toLowerCase().includes('metal');
  return new THREE.MeshStandardMaterial({
    name: original?.name || 'material',
    color: isMetal ? 0x888888 : 0xb9b9b9,
    metalness: 0.1,
    roughness: 0.8,
    side: THREE.DoubleSide
  });
}

async function loadModel() {
  const loader = new OBJLoader();
  let object;

  try {
    object = await loader.loadAsync(MODEL_URL);
  } catch (primaryError) {
    console.warn('Se intentará la URL alternativa:', primaryError);
    try {
      object = await loader.loadAsync(BACKUP_URL);
    } catch (backupError) {
      status.textContent = 'No se pudo cargar el modelo';
      status.classList.add('error');
      console.error('No se pudo cargar barrel.obj:', backupError);
      return;
    }
  }

  // Aplicamos el material sin necesitar el archivo opcional .mtl.
  object.traverse((part) => {
    if (!part.isMesh) return;
    part.material = Array.isArray(part.material)
      ? part.material.map(makeMaterial)
      : makeMaterial(part.material);
    meshes.push(part);
  });

  // El OBJ original mide cerca de 0.344 unidades: centramos y
  // normalizamos su tamaño para verlo claramente, sin deformarlo.
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  if (maxDimension === 0) throw new Error('El OBJ no contiene volumen visible');

  object.position.sub(center);
  const normalized = new THREE.Group();
  normalized.scale.setScalar(2.5 / maxDimension);
  normalized.add(object);
  modelRoot.add(normalized);

  const triangles = meshes.reduce(
    (total, mesh) => total + mesh.geometry.attributes.position.count / 3,
    0
  );
  status.textContent = `Modelo cargado · ${Math.round(triangles)} caras`;
}

loadModel();

// 3. Estado inicial de los 9 parámetros.
const values = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 }
};

const groups = [
  { key: 'translation', container: 'translation-controls', min: -3, max: 3, step: 0.1 },
  { key: 'rotation', container: 'rotation-controls', min: -180, max: 180, step: 1 },
  { key: 'scale', container: 'scale-controls', min: 0.25, max: 2.5, step: 0.05 }
];

function formatValue(key, value) {
  if (key === 'rotation') return `${value.toFixed(0)}°`;
  if (key === 'scale') return `${value.toFixed(2)}×`;
  return value.toFixed(1);
}

// Las rotaciones se introducen en grados y Three.js utiliza radianes.
function applyTransforms() {
  const t = values.translation;
  const r = values.rotation;
  const s = values.scale;

  modelRoot.position.set(t.x, t.y, t.z);
  modelRoot.rotation.set(
    THREE.MathUtils.degToRad(r.x),
    THREE.MathUtils.degToRad(r.y),
    THREE.MathUtils.degToRad(r.z),
    'XYZ'
  );
  modelRoot.scale.set(s.x, s.y, s.z);
}

// Genera tres sliders (X, Y, Z) para cada familia de transformación.
for (const group of groups) {
  const target = document.getElementById(group.container);
  for (const axis of ['x', 'y', 'z']) {
    const id = `${group.key}-${axis}`;
    const initial = values[group.key][axis];
    const row = document.createElement('div');
    row.className = 'slider-row';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.className = `axis-label ${axis}`;
    label.textContent = axis.toUpperCase();

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = group.min;
    slider.max = group.max;
    slider.step = group.step;
    slider.value = initial;
    slider.dataset.initial = initial;

    const output = document.createElement('output');
    output.htmlFor = id;
    output.textContent = formatValue(group.key, initial);

    slider.addEventListener('input', () => {
      const value = Number(slider.value);
      values[group.key][axis] = value;
      output.textContent = formatValue(group.key, value);
      applyTransforms();
    });

    row.append(label, slider, output);
    target.append(row);
  }
}

document.getElementById('reset-button').addEventListener('click', () => {
  document.querySelectorAll('.slider-row input').forEach((slider) => {
    slider.value = slider.dataset.initial;
    slider.dispatchEvent(new Event('input'));
  });
  orbit.reset();
});

document.getElementById('show-axes').addEventListener('change', (event) => {
  axes.visible = event.target.checked;
});

document.getElementById('show-wireframe').addEventListener('change', (event) => {
  for (const mesh of meshes) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) material.wireframe = event.target.checked;
  }
});

// 4. Redimensionamiento y ciclo de renderizado.
function resizeViewer() {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resizeViewer).observe(container);
resizeViewer();

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  renderer.render(scene, camera);
}
animate();
