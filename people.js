
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const HUMAN_HEIGHT = 2.5;

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

const URLS = {
  male: 'https://models.codelove.in/models/male-adult-02.glb',
  female: 'https://models.codelove.in/models/female-adult-03.glb',
  maleIdle: 'https://models.codelove.in/animations/m_idle_neutral_01.glb',
  femaleIdle: 'https://models.codelove.in/animations/f_idle_neutral_01.glb',
  maleWalk: 'https://models.codelove.in/animations/m_walk_neutral_01.glb',
  femaleWalk: 'https://models.codelove.in/animations/f_walk_neutral_01.glb'
};

let assetsPromise = null;
let activeWorld = null;

const JOBS = [
  { role: 'Polícia', gender: 'male', x: 5, z: 9, patrol: true, outfit: 0x263b65 },
  { role: 'Agente de trânsito', gender: 'male', x: 8, z: -9, patrol: true, outfit: 0xd99b24 },
  { role: 'Funcionária de restaurante', gender: 'female', x: -55, z: -10, patrol: false, outfit: 0x9b2940 },
  { role: 'Funcionário de restaurante', gender: 'male', x: -49, z: -35, patrol: false, outfit: 0xeeeeee },
  { role: 'Rececionista de hotel', gender: 'female', x: 30, z: -17, patrol: false, outfit: 0x283e55 },
  { role: 'Funcionário de hotel', gender: 'male', x: 20, z: -17, patrol: false, outfit: 0x70452e },
  { role: 'Trabalhador de escritório', gender: 'male', x: -30, z: -17, patrol: false, outfit: 0x526b45 },
  { role: 'Trabalhadora de escritório', gender: 'female', x: 30, z: 17, patrol: false, outfit: 0x743f83 }
];

function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      loader.loadAsync(URLS.male),
      loader.loadAsync(URLS.female),
      loader.loadAsync(URLS.maleIdle),
      loader.loadAsync(URLS.femaleIdle),
      loader.loadAsync(URLS.maleWalk),
      loader.loadAsync(URLS.femaleWalk)
    ]).then(([male, female, maleIdle, femaleIdle, maleWalk, femaleWalk]) => ({
      male: male.scene,
      female: female.scene,
      maleIdle: maleIdle.animations[0],
      femaleIdle: femaleIdle.animations[0],
      maleWalk: maleWalk.animations[0],
      femaleWalk: femaleWalk.animations[0]
    }));
  }

  return assetsPromise;
}

function customizeClothes(model, color) {
  model.traverse(object => {
    if (!object.isMesh || !object.material) return;

    object.castShadow = true;
    object.receiveShadow = true;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    const changed = materials.map(original => {
      const material = original.clone();
      const name = (material.name || '').toLowerCase();

      const isSkinOrHair =
        /skin|face|head|hair|eye|teeth|mouth|body_skin/.test(name);

      const isClothing =
        /cloth|shirt|jacket|pants|trouser|uniform|dress|coat|suit|top/.test(name);

      if (isClothing && material.color) {
        material.color.setHex(color);
      } else if (!isSkinOrHair && material.color) {
        material.color.multiply(new THREE.Color(color));
      }

      return material;
    });

    object.material = Array.isArray(object.material)
      ? changed
      : changed[0];
  });
}

function makeNPC(scene, job, assets, index) {
  const root = new THREE.Group();
  const model = clone(assets[job.gender]);

  model.updateWorldMatrix(true, true);

  const bounds = new THREE.Box3().setFromObject(model);
  const originalHeight = bounds.max.y - bounds.min.y;

  if (!Number.isFinite(originalHeight) || originalHeight <= 0) {
    throw new Error('Não foi possível medir a altura do figurante: ' + job.role);
  }

  // Todos os figurantes ficam exatamente com 2,5 metros.
  const scale = HUMAN_HEIGHT / originalHeight;

  model.scale.setScalar(scale);
  model.position.y = -bounds.min.y * scale;

  customizeClothes(model, job.outfit);

  root.add(model);
  root.position.set(job.x, 0, job.z);
  root.rotation.y = Math.PI;

  scene.add(root);

  const mixer = new THREE.AnimationMixer(model);

  const idle = mixer.clipAction(assets[job.gender + 'Idle']);
  const walk = mixer.clipAction(assets[job.gender + 'Walk']);

  idle.play();

  console.log(job.role + ': altura ' + HUMAN_HEIGHT + ' metros');

  return {
    root,
    model,
    mixer,
    idle,
    walk,
    current: 'idle',
    role: job.role,
    patrol: Boolean(job.patrol),
    originX: job.x,
    originZ: job.z,
    phase: index * 1.7,
    timer: 2 + (index % 4),
    direction: index % 2 === 0 ? 1 : -1,
    speed: 0.65 + (index % 3) * 0.12
  };
}

function setAnimation(npc, name) {
  if (npc.current === name) return;

  const next = name === 'walk' ? npc.walk : npc.idle;
  const previous = name === 'walk' ? npc.idle : npc.walk;

  next.reset();
  next.fadeIn(0.25).play();
  previous.fadeOut(0.25);

  npc.current = name;
}

export function createPeople(scene, world) {
  world.npcs = [];
  activeWorld = world;

  loadAssets()
    .then(assets => {
      JOBS.forEach((job, index) => {
        world.npcs.push(makeNPC(scene, job, assets, index));
      });

      console.log(
        'ANGOLA LIFE 3D: figurantes carregados:',
        world.npcs.length
      );
    })
    .catch(error => {
      console.error('Erro ao carregar figurantes:', error);
    });
}

export function updatePeople(delta) {
  if (!activeWorld) return;

  for (const npc of activeWorld.npcs) {
    npc.mixer.update(delta);

    if (!npc.patrol) continue;

    npc.timer -= delta;

    if (npc.timer <= 0) {
      if (npc.current === 'idle') {
        setAnimation(npc, 'walk');
        npc.timer = 3.5;
      } else {
        setAnimation(npc, 'idle');
        npc.timer = 2.5 + (npc.phase % 2);
        npc.direction *= -1;
      }
    }

    if (npc.current === 'walk') {
      npc.root.position.x += npc.direction * npc.speed * delta;

      npc.root.rotation.y = npc.direction > 0
        ? Math.PI / 2
        : -Math.PI / 2;

      if (Math.abs(npc.root.position.x - npc.originX) > 2.5) {
        npc.direction *= -1;
      }
    }
  }
}
