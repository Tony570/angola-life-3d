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
    x: 75,
    z: -185,
    patrol: false,
    outfit: 0x263b65,
    service: 'police',
    serviceName: 'Esquadra de Polícia'
  },
  {
    role: 'Rececionista de hotel',
    gender: 'female',
    x: 89,
    z: 25,
    patrol: false,
    outfit: 0x283e55,
    service: 'hotel',
    serviceName: 'Hotel'
  },
  {
    role: 'Funcionário de hotel',
    gender: 'male',
    x: 93,
    z: 25,
    patrol: false,
    outfit: 0x70452e
  },
  {
    role: 'Trabalhador de escritório',
    gender: 'male',
    x: 25,
    z: -25,
    patrol: false,
    outfit: 0x526b45
  },
  {
    role: 'Trabalhadora de escritório',
    gender: 'female',
    x: -25,
    z: -25,
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
    role: 'Vendedor da Concessionária',
    gender: 'male',
    x: 50,
    z: 61,
    patrol: false,
    outfit: 0x263b65,
    service: 'dealership',
    serviceName: 'Concessionária de Automóveis'
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

function createPurchasedVehicle(scene, world, data) {
  const group = new THREE.Group();

  const paint = new THREE.MeshStandardMaterial({
    color: Number(data.color) || 0xc62828,
    roughness: 0.34,
    metalness: 0.28
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x9acbd4,
    roughness: 0.16,
    metalness: 0.12,
    transparent: true,
    opacity: 0.72
  });

  const dark = new THREE.MeshStandardMaterial({
    color: 0x202326,
    roughness: 0.9
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xbfc5c8,
    metalness: 0.8,
    roughness: 0.25
  });

  const addBox = (x, y, z, w, h, d, material) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    return mesh;
  };

  // Carroceria, capô, tejadilho e vidros.
  addBox(0, 0.48, 0, 2.15, 0.62, 4.35, paint);
  addBox(0, 0.91, -0.28, 1.78, 0.72, 2.35, glass);
  addBox(0, 0.85, 1.48, 2.04, 0.28, 1.05, paint);
  addBox(0, 0.85, -1.55, 2.04, 0.28, 0.9, paint);
  addBox(0, 1.29, -0.28, 1.8, 0.12, 2.2, paint);
  addBox(-0.83, 0.55, 0, 0.08, 0.52, 2.1, chrome);
  addBox(0.83, 0.55, 0, 0.08, 0.52, 2.1, chrome);

  for (const x of [-1.08, 1.08]) {
    for (const z of [-1.42, 1.42]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.43, 0.43, 0.27, 20),
        dark
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.42, z);
      wheel.castShadow = true;
      group.add(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.19, 0.285, 16),
        chrome
      );

      hub.rotation.z = Math.PI / 2;
      hub.position.set(x, 0.42, z);
      group.add(hub);
    }
  }

  for (const x of [-0.72, 0.72]) {
    addBox(
      x,
      0.57,
      2.19,
      0.42,
      0.2,
      0.08,
      new THREE.MeshStandardMaterial({
        color: 0xfff2c2,
        emissive: 0x665522
      })
    );

    addBox(
      x,
      0.57,
      -2.19,
      0.42,
      0.2,
      0.08,
      new THREE.MeshStandardMaterial({
        color: 0xb52222
      })
    );
  }

  // Entrega no parque em frente à concessionária.
  const bay = world.vehicles.filter(vehicle => vehicle.purchased).length;

  group.position.set(
    43 + (bay % 3) * 4.5,
    0,
    69 + Math.floor(bay / 3) * 6
  );

  group.rotation.y = Math.PI;
  group.userData.vehicleName = data.name;
  group.userData.purchased = true;

  scene.add(group);

  const vehicle = {
    group,
    speed: 0,
    occupied: false,
    purchased: true,
    name: data.name,
    price: data.price,
    fuel: 100,
    maxFuel: 100
  };

  world.vehicles.push(vehicle);

  return vehicle;
}

export function createPeople(scene, world) {
  world.npcs = [];
  activeWorld = world;

  // Recebe a compra feita na concessionária e cria a viatura no mapa.
  if (typeof window !== 'undefined') {
    if (window.__angolaVehiclePurchaseHandler) {
      window.removeEventListener(
        'angolaLife3D:vehiclePurchase',
        window.__angolaVehiclePurchaseHandler
      );
    }

    window.__angolaVehiclePurchaseHandler = event => {
      if (!event.detail || !activeWorld) return;

      createPurchasedVehicle(scene, activeWorld, event.detail);
    };

    window.addEventListener(
      'angolaLife3D:vehiclePurchase',
      window.__angolaVehiclePurchaseHandler
    );
  }

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

  // Funcionários permanecem nos seus postos de trabalho.
  // Não são criados habitantes artificiais a caminhar nas ruas.
  for (const npc of activeWorld.npcs) {
    if (npc.mixer) npc.mixer.update(delta);
  }
}
