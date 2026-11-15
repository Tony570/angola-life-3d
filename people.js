import * as THREE from 'three';
import { createStylizedAvatar } from './stylized-avatar.js';
import { attachRealCar } from './vehicle-models.js';


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
    z: 53.5,
    patrol: false,
    outfit: 0x263b65,
    service: 'bank',
    serviceName: 'Banco Nacional'
  },
  {
    role: 'Vendedora da Boutique',
    gender: 'female',
    x: -50,
    z: 24.5,
    patrol: false,
    outfit: 0x8d315c,
    service: 'clothing',
    serviceName: 'Boutique Central'
  },
  {
    role: 'Vendedor da Concessionária',
    gender: 'male',
    x: 50,
    z: 55,
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

function makeNPC(scene, job, index = 0) {
  const appearance = {
    skin: ['#8d5524','#a96b42','#6f4028','#c58a61'][index % 4],
    hair: ['#17120f','#3b2418','#b9b9b9','#6b3f25'][index % 4],
    hairstyle: ['curto','encaracolado','espetado','afro'][index % 4],
    outfitColor: '#' + Number(job.outfit || 0x2877a8).toString(16).padStart(6,'0')
  };
  const root = new THREE.Group();
  const model = createStylizedAvatar(appearance);
  root.add(model);
  root.position.set(job.x,0,job.z);
  root.rotation.y = Math.PI;
  root.userData.role = job.role;
  root.userData.job = job.role;
  if(job.service){root.userData.service=job.service;root.userData.serviceName=job.serviceName||job.role;root.userData.clickableService=true;}
  scene.add(root);
  return {root,model,mixer:null,idle:null,walk:null,current:'idle',role:job.role,service:job.service||null,patrol:Boolean(job.patrol),axis:job.axis||'z',originX:job.x,originZ:job.z,phase:index*1.7,timer:2+(index%4),direction:index%2===0?1:-1,speed:.65+(index%3)*.12};
}

export async function createReceptionist(parent, job = {}, index = 0) {
  const npc = makeNPC(parent,{role:job.role||'Rececionista',x:Number(job.x)||0,z:Number(job.z)||0,outfit:Number(job.outfit)||(index%2?0x29483e:0x172b43)},index+100);
  npc.root.position.y=Number(job.y)||0;
  npc.root.rotation.y=Number(job.rotationY)||0;
  return npc;
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

  // As viaturas compradas usam o modelo 3D real; não são montadas com cubos.
  attachRealCar(group, {
    width: 2.25,
    length: 4.4,
    height: 1.6,
    paintColor: Number(data.color) || 0xc62828
  });

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

  JOBS.forEach((job,index)=>world.npcs.push(makeNPC(scene,job,index)));
  console.log('ANGOLA LIFE 3D: habitantes estilizados carregados:',world.npcs.length);
}

export async function createRestaurantStaff(scene, restaurants = []) {
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

    const npc = makeNPC(scene, job, index + 20);

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
    'ANGOLA LIFE 3D: funcionários estilizados carregados:',
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
