
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// ANGOLA LIFE 3D — PERSONAGENS COM ANIMAÇÃO

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

const JOBS = [
  { role: 'Polícia', gender: 'male', x: 4, z: 10, patrol: true },
  { role: 'Agente de trânsito', gender: 'male', x: 0, z: 12, patrol: true },
  { role: 'Funcionária de restaurante', gender: 'female', x: -55, z: -20 },
  { role: 'Funcionário de restaurante', gender: 'male', x: -55, z: -43 },
  { role: 'Rececionista de hotel', gender: 'female', x: 25, z: -25 },
  { role: 'Funcionário de hotel', gender: 'male', x: 25, z: -25 },
  { role: 'Trabalhador de escritório', gender: 'male', x: -25, z: -25 },
  { role: 'Trabalhadora de escritório', gender: 'female', x: 25, z: 25 }
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

function makeNPC(scene, job, assets, index) {
  const root = new THREE.Group();
  const model = clone(assets[job.gender]);

  // Ajustar escala e colocar os pés exatamente no chão.
  const bounds = new THREE.Box3().setFromObject(model);
  const height = Math.max(bounds.max.y - bounds.min.y, 0.01);
  const scale = 1.75 / height;

  model.scale.setScalar(scale);
  model.position.y = -bounds.min.y * scale;

  model.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  root.add(model);
  root.position.set(job.x, 0, job.z);
  root.rotation.y = Math.PI;

  scene.add(root);

  const mixer = new THREE.AnimationMixer(model);
  const idleClip = assets[job.gender + 'Idle'];
  const walkClip = assets[job.gender + 'Walk'];

  const idle = mixer.clipAction(idleClip);
  const walk = mixer.clipAction(walkClip);

  idle.play();

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
    direction: 1,
    speed: 0.75
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

  loadAssets()
    .then(assets => {
      JOBS.forEach((job, index) => {
        world.npcs.push(makeNPC(scene, job, assets, index));
      });

      console.log('ANGOLA LIFE 3D: equipas e agentes carregados:', world.npcs.length);
    })
    .catch(error => {
      console.error('Não foi possível carregar personagens e animações:', error);
    });
}

export function updatePeople(delta) {
  for (const npc of window.angolaWorld?.npcs || []) {
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
      npc.root.rotation.y = npc.direction > 0 ? Math.PI / 2 : -Math.PI / 2;

      if (Math.abs(npc.root.position.x - npc.originX) > 2.5) {
        npc.direction *= -1;
      }
    }
  }
}
