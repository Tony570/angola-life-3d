
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// ============================================
// ANGOLA LIFE 3D — HABITANTES REALISTAS
// ============================================

const MODELS = {
  male: 'https://models.codelove.in/models/male-adult-02.glb',
  female: 'https://models.codelove.in/models/female-adult-03.glb'
};

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

let modelCache = null;

function loadPeopleModels() {
  if (!modelCache) {
    modelCache = Promise.all([
      loader.loadAsync(MODELS.male),
      loader.loadAsync(MODELS.female)
    ]).then(([male, female]) => ({
      male: male.scene,
      female: female.scene
    }));
  }

  return modelCache;
}

function createPersonGroup(scene, x, z, phase, index, models) {
  const group = new THREE.Group();

  const gender = index % 2 === 0 ? 'male' : 'female';
  const character = clone(models[gender]);

  character.scale.setScalar(gender === 'male' ? 0.98 : 1.02);
  character.position.set(0, 0, 0);

  group.add(character);
  group.position.set(x, 0, z);
  group.rotation.y = Math.random() * Math.PI * 2;

  group.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  scene.add(group);

  return {
    group,
    originX: x,
    originZ: z,
    phase,
    gender,
    model: character
  };
}

export function createPeople(scene, world) {
  const positions = [];

  for (let i = 0; i < 24; i++) {
    const x = -80 + (i * 31) % 160;
    const z = -80 + (i * 43) % 160;

    if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

    positions.push({
      x,
      z,
      phase: i * 0.7,
      index: i
    });
  }

  world.npcs = [];

  loadPeopleModels()
    .then(models => {
      positions.forEach(person => {
        const npc = createPersonGroup(
          scene,
          person.x,
          person.z,
          person.phase,
          person.index,
          models
        );

        world.npcs.push(npc);
      });

      console.log(
        'ANGOLA LIFE 3D: habitantes realistas carregados:',
        world.npcs.length
      );
    })
    .catch(error => {
      console.error(
        'Erro ao carregar os modelos dos habitantes:',
        error
      );
    });
}
