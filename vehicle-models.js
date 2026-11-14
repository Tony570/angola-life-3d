import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAR_MODEL_URL = 'https://threejs.org/examples/models/gltf/ferrari.glb';
let modelPromise = null;

function createFallbackCar(group, { width, length, height, paintColor }) {
  const paint = new THREE.MeshStandardMaterial({ color: paintColor ?? 0x245c9c, roughness: 0.38, metalness: 0.22 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.7 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x9ccbd8, roughness: 0.16, metalness: 0.12, transparent: true, opacity: 0.78 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb8c1c5, roughness: 0.28, metalness: 0.82 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff0c2, emissive: 0xffd77a, emissiveIntensity: 0.55 });
  const rearLamp = new THREE.MeshStandardMaterial({ color: 0xb82020, emissive: 0x7b0808, emissiveIntensity: 0.35 });
  const add = (geometry, material, x, y, z, rotation = null) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const w = Math.min(width, 2.35), l = Math.min(length, 4.65), h = Math.min(height, 1.7);
  add(new THREE.BoxGeometry(w, h * 0.36, l), paint, 0, h * 0.28, 0);
  add(new THREE.BoxGeometry(w * 0.78, h * 0.42, l * 0.43), paint, 0, h * 0.63, -l * 0.06);
  add(new THREE.BoxGeometry(w * 0.72, h * 0.29, 0.055), glass, 0, h * 0.68, l * 0.16, new THREE.Euler(-0.42, 0, 0));
  add(new THREE.BoxGeometry(w * 0.72, h * 0.27, 0.055), glass, 0, h * 0.66, -l * 0.27, new THREE.Euler(0.42, 0, 0));
  for (const side of [-1, 1]) {
    add(new THREE.BoxGeometry(0.045, h * 0.25, l * 0.31), glass, side * w * 0.395, h * 0.66, -l * 0.055);
    add(new THREE.BoxGeometry(0.08, 0.12, l * 0.78), trim, side * w * 0.48, h * 0.24, 0);
    for (const z of [-l * 0.31, l * 0.31]) {
      add(new THREE.CylinderGeometry(0.37, 0.37, 0.22, 20), trim, side * w * 0.43, 0.38, z, new THREE.Euler(0, 0, Math.PI / 2));
      add(new THREE.CylinderGeometry(0.19, 0.19, 0.235, 16), chrome, side * w * 0.43, 0.38, z, new THREE.Euler(0, 0, Math.PI / 2));
    }
  }
  add(new THREE.BoxGeometry(w * 0.86, 0.16, 0.18), trim, 0, h * 0.22, l * 0.49);
  add(new THREE.BoxGeometry(w * 0.86, 0.16, 0.18), trim, 0, h * 0.22, -l * 0.49);
  for (const x of [-w * 0.31, w * 0.31]) {
    add(new THREE.BoxGeometry(w * 0.2, 0.12, 0.07), lamp, x, h * 0.34, l * 0.49);
    add(new THREE.BoxGeometry(w * 0.2, 0.12, 0.07), rearLamp, x, h * 0.34, -l * 0.49);
    add(new THREE.BoxGeometry(0.16, 0.08, 0.18), chrome, x, h * 0.45, l * 0.3);
  }
  add(new THREE.BoxGeometry(w * 0.36, 0.1, 0.08), chrome, 0, h * 0.3, l * 0.5);
  group.userData.realVehicleLoaded = false;
  group.userData.fallbackVehicleLoaded = true;
}

export async function attachRealCar(group, { width = 2.25, length = 4.4, height = 1.55, paintColor = null } = {}) {
  try {
    if (!modelPromise) modelPromise = new GLTFLoader().loadAsync(CAR_MODEL_URL).then(gltf => gltf.scene);
    const source = await modelPromise;
    const model = source.clone(true);
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    if (!size.x || !size.y || !size.z) throw new Error('Modelo 3D de viatura inválido.');
    const scale = Math.min(width / size.x, height / size.y, length / size.z);
    model.scale.setScalar(scale);
    model.updateMatrixWorld(true);
    const fitted = new THREE.Box3().setFromObject(model);
    model.position.x -= (fitted.min.x + fitted.max.x) / 2;
    model.position.z -= (fitted.min.z + fitted.max.z) / 2;
    model.position.y -= fitted.min.y;
    model.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (paintColor !== null) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const painted = materials.map(material => {
          const clone = material.clone();
          if (/paint|body|car.?color/i.test(clone.name || '') && clone.color) clone.color.setHex(paintColor);
          return clone;
        });
        object.material = Array.isArray(object.material) ? painted : painted[0];
      }
    });
    group.add(model);
    group.userData.realVehicleLoaded = true;
    return model;
  } catch (error) {
    console.warn('Modelo externo indisponível; a viatura detalhada local será usada.', error);
    createFallbackCar(group, { width, length, height, paintColor });
    group.userData.realVehicleLoadError = true;
    return null;
  }
}
