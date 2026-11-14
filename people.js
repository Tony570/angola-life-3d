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
  {
    role: 'Polícia',
    gender: 'male',
    x: 41.1,
    z: -45,
    patrol: true,
    axis: 'z',
    outfit: 0x263b65,
    service: 'police',
    serviceName: 'Esquadra de Polícia'
  },
  {
    role: 'Agente de trânsito',
    gender: 'male',
    x: -41.1,
    z: 45,
    patrol: true,
    axis: 'z',
    outfit: 0xd99b24
  },
  {
    role: 'Funcionária de restaurante',
    gender: 'female',
    x: -76.1,
    z: -20,
    patrol: false,
    outfit: 0x9b2940
  },
  {
    role: 'Funcionário de restaurante',
    gender: 'male',
    x: -76.1,
    z: -55,
    patrol: false,
    outfit: 0xeeeeee
  },
  {
    role: 'Rececionista de hotel',
    gender: 'female',
    x: 76.1,
    z: 15,
    patrol: false,
    outfit: 0x283e55,
    service: 'hotel',
    serviceName: 'Hotel'
  },
  {
    role: 'Funcionário de hotel',
    gender: 'male',
    x: 76.1,
    z: 55,
    patrol: false,
    outfit: 0x70452e
  },
  {
    role: 'Trabalhador de escritório',
    gender: 'male',
    x: 41.1,
    z: 75,
    patrol: false,
    outfit: 0x526b45
  },
  {
    role: 'Trabalhadora de escritório',
    gender: 'female',
    x: -41.1,
    z: -75,
    patrol: false,
    outfit: 0x743f83
  },
  {
    role: 'Atendente do mercado',
    gender: 'female',
    x: -72,
    z: -25,
    patrol: false,
    outfit: 0x3d704b,
    service: 'market',
    serviceName: 'Mercado'
  },
  {
    role: 'Atendente do posto de combustível',
    gender: 'male',
    x: 72,
    z: -35,
    patrol: false,
    outfit: 0x263b65,
    service: 'fuel',
    serviceName: 'Posto de Combustível'
  },

  // NOVOS FUNCIONÁRIOS DOS ESTABELECIMENTOS

  {
    role: 'Funcionário do Banco',
    gender: 'male',
    x: -50,
    z: 58.5,
    patrol: false,
    outfit: 0x263b65,
    service: 'bank',
    serviceName: 'Banco Nacional'
  },
  {
    role: 'Vendedora da Boutique',
    gender: 'female',
    x: -50,
    z: 29.5,
    patrol: false,
    outfit: 0x8d315c,
    service: 'clothing',
    serviceName: 'Boutique Central'
  },
  {
    role: 'Rececionista do Hospital',
    gender: 'female',
    x: 91,
    z: 101.5,
    patrol: false,
    outfit: 0xffffff,
    service: 'hospital',
    serviceName: 'Hospital Municipal'
  }
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

      const isClothing =
        /cloth|shirt|jacket|pants|trouser|uniform|dress|coat|suit|top|skirt|blazer/.test(name);

      if (isClothing && material.color) {
        material.color.setHex(color);
      }

      return material;
    });

    object.material = Array.isArray(object.material)
      ? changed
      : changed[0];
  });
}

function normalizeCharacter(model) {
  model.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  const originalHeight = size.y;

  if (!Number.isFinite(originalHeight) || originalHeight <= 0) {
    throw new Error('Não foi possível medir a altura do personagem.');
  }

  const normalized = new THREE.Group();
  normalized.add(model);

  const factor = HUMAN_HEIGHT / originalHeight;

  normalized.scale.setScalar(factor);
  normalized.position.y = -bounds.min.y * factor;

  normalized.updateMatrixWorld(true);

  return normalized;
}

function makeNPC(scene, job, assets, index) {
  const root = new THREE.Group();
  const model = clone(assets[job.gender]);
  const normalizedModel = normalizeCharacter(model);

  customizeClothes(normalizedModel, job.outfit);

  root.add(normalizedModel);
  root.position.set(job.x, 0, job.z);
  root.rotation.y = Math.PI;

  root.userData.role = job.role;
  root.userData.job = job.role;

  if (job.service) {
    root.userData.service = job.service;
    root.userData.serviceName = job.serviceName || job.role;
    root.userData.clickableService = true;
  }

  scene.add(root);

  const mixer = new THREE.AnimationMixer(normalizedModel);

  const idleClip = assets[job.gender + 'Idle'];
  const walkClip = assets[job.gender + 'Walk'];

  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const walk = walkClip ? mixer.clipAction(walkClip) : null;

  if (idle) {
    idle.play();
  } else if (walk) {
    walk.play();
    walk.paused = true;
  }

  return {
    root,
    model: normalizedModel,
    mixer,
    idle,
    walk,
    current: idle ? 'idle' : 'walk',
    role: job.role,
    service: job.service || null,
    patrol: Boolean(job.patrol),
    axis: job.axis || 'z',
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

  if (!next) return;

  next.reset();
  next.fadeIn(0.25).play();

  if (previous) {
    previous.fadeOut(0.25);
  }

  npc.current = name;
}

export function createPeople(scene, world) {
  world.npcs = [];
  activeWorld = world;

  loadAssets()
    .then(assets => {
      JOBS.forEach((job, index) => {
        const npc = makeNPC(scene, job, assets, index);
        world.npcs.push(npc);
      });

      console.log(
        'ANGOLA LIFE 3D: funcionários e habitantes carregados:',
        world.npcs.length
      );
    })
    .catch(error => {
      console.error('Erro ao carregar habitantes:', error);
    });
}

export async function createRestaurantStaff(scene, restaurants = []) {
  const assets = await loadAssets();
  const staff = [];

  restaurants.forEach((restaurant, index) => {
    const job = {
      role: 'Garçonete',
      gender: 'female',
      x: restaurant.x,
      z: restaurant.z - 4.5,
      patrol: false,
      outfit: index % 2 === 0 ? 0x762d3c : 0x263b35
    };

    const npc = makeNPC(scene, job, assets, index + 20);

    npc.root.rotation.y = 0;
    npc.root.userData.restaurant = restaurant;
    npc.root.userData.clickableWaiter = true;
    npc.root.userData.role = 'Garçonete';

    npc.root.traverse(object => {
      if (object.isMesh) {
        object.userData.restaurantWaiter = npc.root;
      }
    });

    staff.push(npc);
  });

  console.log(
    'ANGOLA LIFE 3D: garçonetes humanas carregadas:',
    staff.length
  );

  return staff;
}

export function updateRestaurantStaff(staff = [], delta) {
  for (const npc of staff) {
    if (npc.mixer) {
      npc.mixer.update(delta);
    }
  }
}

export function updatePeople(delta) {
  if (!activeWorld) return;

  for (const npc of activeWorld.npcs) {
    npc.mixer.update(delta);

    if (!npc.patrol) continue;

    npc.timer -= delta;

    if (npc.timer <= 0) {
      if (npc.current === 'idle' && npc.walk) {
        setAnimation(npc, 'walk');
        npc.timer = 3.5;
      } else {
        setAnimation(npc, 'idle');
        npc.timer = 2.5 + (npc.phase % 2);
        npc.direction *= -1;
      }
    }

    if (npc.current === 'walk') {
      const movement = npc.direction * npc.speed * delta;

      if (npc.axis === 'z') {
        npc.root.position.z += movement;
        npc.root.rotation.y = npc.direction > 0 ? 0 : Math.PI;
      } else {
        npc.root.position.x += movement;
        npc.root.rotation.y = npc.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      const distance = npc.axis === 'z'
        ? Math.abs(npc.root.position.z - npc.originZ)
        : Math.abs(npc.root.position.x - npc.originX);

      if (distance > 2.5) {
        npc.direction *= -1;
      }
    }
  }
}
