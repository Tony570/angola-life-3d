import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAR_MODEL_URL = 'https://threejs.org/examples/models/gltf/ferrari.glb';
let modelPromise = null;

export async function attachRealCar(group, { width = 2.25, length = 4.4, height = 1.55 } = {}) {
  try {
    if (!modelPromise) {
      modelPromise = new GLTFLoader().loadAsync(CAR_MODEL_URL).then(gltf => gltf.scene);
    }
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
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    group.add(model);
    group.userData.realVehicleLoaded = true;
    return model;
  } catch (error) {
    console.error('Não foi possível carregar o modelo 3D real da viatura:', error);
    group.userData.realVehicleLoadError = true;
    return null;
  }
}
