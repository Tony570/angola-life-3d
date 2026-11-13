
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createHouseSystem } from './houses.js';
import { Player } from './player.js';
import {
  updatePeople,
  createRestaurantStaff,
  updateRestaurantStaff
} from './people.js';
import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
<div id="game">
  <div id="topbar">
    <div class="brand">ANGOLA <span>LIFE 3D</span></div>
    <div class="money">💰 25.000 Kz</div>
  </div>

  <div id="welcome" class="screen">
    <div class="welcome-content">
      <div class="logo">ANGOLA LIFE 3D</div>
      <p>Vive a tua vida em Luanda.</p>
      <button id="start-game">ENTRAR NA CIDADE</button>
    </div>
  </div>

  <div id="hud">
    <div class="location">📍 LUANDA, ANGOLA</div>
    <button id="map-button">🗺️ MAPA</button>
    <button id="vehicle-button">🚗 INTERAGIR</button>
  </div>

  <div id="map-panel">
    <div class="map-heading">
      <strong>MAPA DE LUANDA</strong>
      <button id="close-map">✕</button>
    </div>
    <div id="map-destinations"></div>
  </div>

  <div id="restaurant-panel" aria-hidden="true">
    <div class="restaurant-head">
      <div>
        <small>ANGOLA LIFE 3D</small>
        <h2 id="restaurant-title">Restaurante</h2>
      </div>
      <button id="restaurant-close">✕</button>
    </div>

    <p class="restaurant-subtitle">
      Escolhe o que desejas pedir.
    </p>

    <div class="restaurant-tabs">
      <button class="restaurant-tab active" data-menu-tab="food">🍲 Comidas</button>
      <button class="restaurant-tab" data-menu-tab="drinks">🥤 Bebidas</button>
    </div>

    <div id="restaurant-menu"></div>

    <div class="restaurant-order">
      <div>
        <strong>O teu pedido</strong>
        <span id="restaurant-total">Total: 0 Kz</span>
      </div>
      <div id="restaurant-cart">Ainda não escolheste nada.</div>
      <button id="restaurant-confirm" disabled>CONFIRMAR PEDIDO</button>
      <p id="restaurant-notice" role="status"></p>
    </div>
  </div>

  <div id="joystick"><div id="joystick-knob"></div></div>

  <div id="mobile-controls">
    <button data-key="w">▲</button>
    <div>
      <button data-key="a">◀</button>
      <button data-key="s">▼</button>
      <button data-key="d">▶</button>
    </div>
  </div>

  <div id="help">
    JOYSTICK: MOVER · E: INTERAGIR / LEVANTAR · CLIQUE NA CADEIRA: SENTAR
  </div>
</div>
`;

const restaurantStyles = document.createElement('style');

restaurantStyles.textContent = `
#restaurant-panel {
  position:absolute;
  z-index:20;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  width:min(94vw,460px);
  max-height:86vh;
  overflow:auto;
  padding:18px;
  border:1px solid #ffffff30;
  border-radius:18px;
  background:#14231ef5;
  color:#fff;
  box-shadow:0 16px 50px #000b;
  display:none;
  font-family:Arial,Helvetica,sans-serif;
  touch-action:pan-y;
}
#restaurant-panel.visible {display:block}
.restaurant-head {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}
.restaurant-head small {
  color:#e5ad35;
  font-weight:800;
  letter-spacing:1.5px;
}
.restaurant-head h2 {font-size:23px;margin-top:4px}
.restaurant-head button {
  width:38px;height:38px;border-radius:9px;
  background:#803e32;color:#fff;font-size:18px;
}
.restaurant-subtitle {
  margin:12px 0;color:#d3ddd8;
  font-size:13px;line-height:1.45;
}
.restaurant-tabs {display:flex;gap:8px;margin:12px 0}
.restaurant-tab {
  flex:1;padding:12px;border-radius:9px;
  background:#263d35;color:#fff;
}
.restaurant-tab.active {
  background:#d59b32;color:#17221e;
}
.restaurant-item {
  display:flex;align-items:center;
  justify-content:space-between;gap:10px;
  padding:11px 4px;border-bottom:1px solid #ffffff20;
}
.restaurant-item>div:first-child {display:grid;gap:5px}
.restaurant-item strong {font-size:14px}
.restaurant-item span {font-size:12px;color:#e5bd6b}
.restaurant-quantity {display:flex;align-items:center;gap:10px}
.restaurant-quantity button {
  width:32px;height:32px;border-radius:8px;
  background:#315b4b;color:#fff;font-size:20px;
}
.restaurant-quantity b {min-width:14px;text-align:center}
.restaurant-order {
  margin-top:14px;padding:13px;
  border-radius:12px;background:#20382f;
}
.restaurant-order>div:first-child {
  display:flex;justify-content:space-between;
  gap:8px;font-size:13px;
}
.restaurant-order>div:first-child span {
  color:#f2c14e;font-weight:bold;
}
.restaurant-order #restaurant-cart {
  margin:10px 0;color:#dce5df;
  font-size:12px;line-height:1.5;
}
.restaurant-order>button {
  width:100%;padding:13px;border-radius:9px;
  background:#e5ad35;color:#17221e;font-weight:900;
}
.restaurant-order>button:disabled {opacity:.45}
.restaurant-order #restaurant-notice {
  margin-top:10px;color:#bce7c6;
  font-size:12px;line-height:1.45;
}
`;

document.head.appendChild(restaurantStyles);

const game = document.querySelector('#game');

const scene = new THREE.Scene();
const outsideFog = new THREE.Fog('#9ac7df', 100, 230);

scene.background = new THREE.Color('#9ac7df');
scene.fog = outsideFog;

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1200
);

camera.position.set(0, 6, 28);

const renderer = new THREE.WebGLRenderer({
  antialias:true,
  powerPreference:'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#ffffff', '#76634b', 2));

const sun = new THREE.DirectionalLight('#fff0d2', 2.2);
sun.position.set(-40, 70, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const world = createWorld(scene);

// Retira também os edifícios genéricos da grelha que ainda coincidam
// com os terrenos reservados aos três restaurantes.
const restaurantSites = [
  { x:-55, z:-20 },
  { x:-55, z:-43 },
  { x:-55, z:-66 }
];

world.buildings = (world.buildings || []).filter(building => {
  const overlapsRestaurant = restaurantSites.some(site =>
    Math.abs(building.x-site.x) < (building.width+17.2)/2 &&
    Math.abs(building.z-site.z) < (building.depth+14.2)/2
  );

  if (overlapsRestaurant) {
    scene.remove(building.group);
    return false;
  }

  return true;
});

const houses = createHouseSystem(scene);
const player = new Player(scene, camera, world.vehicles);

function createCityBuildingColliders(buildings = []) {
  const colliders = [];

  const addBox = (x, z, width, depth) => {
    if (width <= 0 || depth <= 0) return;

    colliders.push({
      minX:x-width/2,
      maxX:x+width/2,
      minZ:z-depth/2,
      maxZ:z+depth/2
    });
  };

  for (const building of buildings) {
    const wall = 0.32;
    const doorWidth = building.type === 'shop' ? 2.8 : 1.9;
    const sideWidth = Math.max(0, (building.width-doorWidth)/2);
    const frontZ = building.z + building.depth/2;

    addBox(
      building.x-building.width/2+wall/2,
      building.z,
      wall,
      building.depth
    );

    addBox(
      building.x+building.width/2-wall/2,
      building.z,
      wall,
      building.depth
    );

    addBox(
      building.x,
      building.z-building.depth/2+wall/2,
      building.width,
      wall
    );

    if (sideWidth > 0) {
      addBox(
        building.x-building.width/2+sideWidth/2,
        frontZ,
        sideWidth,
        wall
      );

      addBox(
        building.x+building.width/2-sideWidth/2,
        frontZ,
        sideWidth,
        wall
      );
    }
  }

  return colliders;
}

const houseExteriorColliders = houses.flatMap(
  house => house.exteriorColliders || []
);

const cityBuildingColliders = createCityBuildingColliders(
  world.buildings || []
);

const exteriorColliders = [
  ...houseExteriorColliders,
  ...cityBuildingColliders
];

player.setColliders(exteriorColliders);

const clock = new THREE.Clock();

const welcome = document.querySelector('#welcome');
const startButton = document.querySelector('#start-game');
const actionButton = document.querySelector('#vehicle-button');
const mapButton = document.querySelector('#map-button');
const mapPanel = document.querySelector('#map-panel');
const destinations = document.querySelector('#map-destinations');

const restaurantPanel = document.querySelector('#restaurant-panel');
const restaurantTitle = document.querySelector('#restaurant-title');
const restaurantMenu = document.querySelector('#restaurant-menu');
const restaurantCart = document.querySelector('#restaurant-cart');
const restaurantTotal = document.querySelector('#restaurant-total');
const restaurantNotice = document.querySelector('#restaurant-notice');
const restaurantConfirm = document.querySelector('#restaurant-confirm');

let started = false;
let currentHouse = null;
let currentRestaurant = null;
let activeRestaurant = null;
let activeMenuTab = 'food';

const order = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const restaurantStaff = [];
const clickableChairs = [];

// Restaurantes de Luanda.
const RESTAURANTS = [
  {
    id:'sabor-luanda',
    name:'Sabor de Luanda',
    x:-55,
    z:-20,
    food:[
      ['Funge com calulu',1500],
      ['Muamba de galinha',2000],
      ['Mufete',2500],
      ['Arroz com frango',1800],
      ['Hambúrguer',1500]
    ],
    drinks:[
      ['Água',300],
      ['Refrigerante',500],
      ['Sumol',600],
      ['Sumo natural',800]
    ]
  },
  {
    id:'cantinho-ilha',
    name:'Cantinho da Ilha',
    x:-55,
    z:-43,
    food:[
      ['Mufete',2500],
      ['Peixe grelhado',2300],
      ['Funge com calulu',1500],
      ['Arroz com peixe',1900],
      ['Frango grelhado',2000]
    ],
    drinks:[
      ['Água',300],
      ['Refrigerante',500],
      ['Sumol',600],
      ['Sumo natural',800]
    ]
  },
  {
    id:'paladar-angolano',
    name:'Paladar Angolano',
    x:-55,
    z:-66,
    food:[
      ['Muamba de galinha',2000],
      ['Funge com calulu',1500],
      ['Carne de porco',2200],
      ['Arroz com frango',1800],
      ['Hambúrguer',1500]
    ],
    drinks:[
      ['Água',300],
      ['Refrigerante',500],
      ['Sumol',600],
      ['Sumo natural',800]
    ]
  }
];

const formatKz = value =>
  `${value.toLocaleString('pt-PT')} Kz`;

function addBox(parent, size, position, material, cast = true) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material
  );

  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function createTable(parent, x, z, restaurant) {
  const wood = new THREE.MeshStandardMaterial({
    color:'#81512f',
    roughness:0.82
  });

  const metal = new THREE.MeshStandardMaterial({
    color:'#343b40',
    metalness:0.55,
    roughness:0.5
  });

  addBox(
    parent,
    [2.1,0.14,1.35],
    [x,1.05,z],
    wood
  );

  for (const dx of [-0.82,0.82]) {
    for (const dz of [-0.48,0.48]) {
      addBox(
        parent,
        [0.12,1,0.12],
        [x+dx,0.5,z+dz],
        metal
      );
    }
  }

  const chairMat = new THREE.MeshStandardMaterial({
    color:'#b87a3d',
    roughness:0.75
  });

  for (const dz of [-1.05,1.05]) {
    const seat = addBox(
      parent,
      [0.75,0.12,0.72],
      [x,0.48,z+dz],
      chairMat
    );

    seat.userData.restaurantChair = {
      x: restaurant.x + x,
      z: restaurant.z + z + dz,
      rotationY: dz > 0 ? Math.PI : 0
    };

    clickableChairs.push(seat);

    addBox(
      parent,
      [0.75,0.75,0.12],
      [x,0.86,z+dz*1.28],
      chairMat
    );
  }
}

function createTileFloor(parent, width, depth) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(width,0.045,depth),
    new THREE.MeshStandardMaterial({
      color:'#c7bba7',
      roughness:0.82
    })
  );

  floor.position.y = 0.36;
  floor.receiveShadow = true;
  parent.add(floor);

  const grout = new THREE.MeshStandardMaterial({
    color:'#8e887c',
    roughness:1
  });

  for (let x=-width/2+1; x<width/2; x+=1.5) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.025,0.008,depth),
      grout
    );

    line.position.set(x,0.386,0);
    parent.add(line);
  }

  for (let z=-depth/2+1; z<depth/2; z+=1.5) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(width,0.008,0.025),
      grout
    );

    line.position.set(0,0.386,z);
    parent.add(line);
  }
}

function createRestaurantCounter(parent) {
  const wood = new THREE.MeshStandardMaterial({
    color:'#573923',
    roughness:0.72
  });

  const stone = new THREE.MeshStandardMaterial({
    color:'#d6d0c4',
    roughness:0.38
  });

  addBox(parent,[5.8,1.15,0.85],[-0.2,0.95,-5.7],wood);
  addBox(parent,[6.05,0.14,1],[-0.2,1.59,-5.7],stone);

  const display = new THREE.MeshStandardMaterial({
    color:'#304b45',
    roughness:0.3
  });

  addBox(parent,[2.1,0.8,0.05],[-0.2,2.05,-5.2],display);
}

function createRestaurantDecor(parent) {
  const green = new THREE.MeshStandardMaterial({
    color:'#315b43',
    roughness:0.85
  });

  const gold = new THREE.MeshStandardMaterial({
    color:'#bd8a3c',
    metalness:0.45,
    roughness:0.45
  });

  for (const x of [-7.5,7.5]) {
    addBox(parent,[0.12,2.1,0.12],[x,1.35,-1],gold);

    const picture = addBox(
      parent,
      [0.12,1.2,1.6],
      [x*0.96,2.1,-1],
      green
    );

    picture.rotation.y = Math.PI/2;
  }

  addBox(parent,[0.25,2.2,0.25],[-7.2,1.4,-5],green);
  addBox(parent,[0.25,2.2,0.25],[7.2,1.4,-5],green);

  addBox(parent,[5.5,0.12,0.12],[0,3.1,-7],gold);
}

function createRestaurantStructure(interior, restaurant) {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: restaurant.id === 'cantinho-ilha' ? '#e7d8bd' : '#e8dfcc',
    roughness: 0.88
  });

  const trim = new THREE.MeshStandardMaterial({
    color: '#5b3828',
    roughness: 0.72
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#9ec9d2',
    roughness: 0.18,
    metalness: 0.05,
    transmission: 0.18,
    transparent: true,
    opacity: 0.72
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: '#57483b',
    roughness: 0.92
  });

  const gold = new THREE.MeshStandardMaterial({
    color: '#d4a13b',
    metalness: 0.35,
    roughness: 0.48
  });

  // Paredes laterais e parede do fundo.
  addBox(interior,[0.34,4.25,13.8],[-8.25,2.48,0],wallMaterial);
  addBox(interior,[0.34,4.25,13.8],[8.25,2.48,0],wallMaterial);
  addBox(interior,[16.8,4.25,0.34],[0,2.48,-6.75],wallMaterial);

  // Fachada com montras e entrada central.
  addBox(interior,[5.7,0.72,0.34],[-5.55,0.78,6.75],wallMaterial);
  addBox(interior,[5.7,0.72,0.34],[5.55,0.78,6.75],wallMaterial);
  addBox(interior,[5.7,0.48,0.34],[-5.55,4.35,6.75],wallMaterial);
  addBox(interior,[5.7,0.48,0.34],[5.55,4.35,6.75],wallMaterial);
  addBox(interior,[0.34,3.2,0.34],[-8.25,2.25,6.75],wallMaterial);
  addBox(interior,[0.34,3.2,0.34],[8.25,2.25,6.75],wallMaterial);

  // Montras de vidro e moldura da entrada.
  addBox(interior,[4.85,2.65,0.09],[-5.55,2.35,6.94],glass);
  addBox(interior,[4.85,2.65,0.09],[5.55,2.35,6.94],glass);
  addBox(interior,[0.16,3.15,0.2],[-2.72,1.95,6.9],trim);
  addBox(interior,[0.16,3.15,0.2],[2.72,1.95,6.9],trim);
  addBox(interior,[0.22,3.35,0.3],[-2.55,2.02,6.98],gold);
  addBox(interior,[0.22,3.35,0.3],[2.55,2.02,6.98],gold);
  addBox(interior,[5.3,0.18,0.65],[0,0.43,7.05],trim);

  // Cobertura.
  const roof = addBox(
    interior,
    [17.3,0.38,14.3],
    [0,4.72,0],
    roofMaterial
  );

  roof.name = 'restaurant-roof';

  addBox(interior,[17.5,0.18,0.35],[0,4.48,7.05],trim);
  addBox(interior,[17.5,0.18,0.35],[0,4.48,-7.05],trim);
  addBox(interior,[0.22,0.18,14.1],[-8.48,4.48,0],trim);
  addBox(interior,[0.22,0.18,14.1],[8.48,4.48,0],trim);

  // Letreiro exterior.
  const sign = new THREE.MeshStandardMaterial({
    color: restaurant.id === 'cantinho-ilha' ? '#286c79' :
      restaurant.id === 'paladar-angolano' ? '#8a352c' : '#2f6747',
    roughness: 0.65
  });

  addBox(interior,[6.2,0.85,0.24],[0,3.75,7.04],sign);
  addBox(interior,[5.7,0.08,0.28],[0,3.27,7.04],gold);

  // Candeeiros e iluminação quente.
  for (const x of [-5,0,5]) {
    const fixture = new THREE.MeshStandardMaterial({
      color: '#fff0c7',
      emissive: '#ffce79',
      emissiveIntensity: 0.55
    });

    addBox(interior,[0.9,0.12,0.9],[x,4.35,0],fixture);

    const light = new THREE.PointLight('#ffdda6',0.85,12);
    light.position.set(x,3.95,0);
    interior.add(light);
  }

  const colliders = [];

  const addCollider = (x,z,width,depth) => colliders.push({
    minX: restaurant.x+x-width/2,
    maxX: restaurant.x+x+width/2,
    minZ: restaurant.z+z-depth/2,
    maxZ: restaurant.z+z+depth/2
  });

  addCollider(-8.25,0,0.5,13.8);
  addCollider(8.25,0,0.5,13.8);
  addCollider(0,-6.75,16.8,0.5);
  addCollider(-5.55,6.75,5.7,0.5);
  addCollider(5.55,6.75,5.7,0.5);

  return { roof, colliders };
}

function buildRestaurants() {
  RESTAURANTS.forEach(restaurant => {
    const interior = new THREE.Group();
    interior.name = `Interior-${restaurant.id}`;

    createTileFloor(interior,16.8,13.8);

    const structure = createRestaurantStructure(interior,restaurant);
    restaurant.roof = structure.roof;
    restaurant.colliders = structure.colliders;

    createRestaurantCounter(interior);
    createRestaurantDecor(interior);

    createTable(interior,-3.2,-1.1,restaurant);
    createTable(interior,3.2,-1.1,restaurant);
    createTable(interior,-3.2,3.1,restaurant);
    createTable(interior,3.2,3.1,restaurant);

    const lamp = new THREE.PointLight('#ffdda6',1.4,18);
    lamp.position.set(0,3.5,0);
    interior.add(lamp);

    const lamp2 = new THREE.PointLight('#ffe7c0',0.8,12);
    lamp2.position.set(-5,3,-4);
    interior.add(lamp2);

    interior.position.set(restaurant.x,0,restaurant.z);
    restaurant.interior = interior;
    scene.add(interior);
  });

  createRestaurantStaff(scene,RESTAURANTS)
    .then(staff => restaurantStaff.push(...staff))
    .catch(error => console.error('Erro ao carregar garçonetes:',error));
}

buildRestaurants();

exteriorColliders.push(
  ...RESTAURANTS.flatMap(restaurant => restaurant.colliders || [])
);

player.setColliders(exteriorColliders);

function renderOrder() {
  let total = 0;
  const rows = [];

  for (const item of order.values()) {
    total += item.price*item.quantity;
    rows.push(`${item.name} × ${item.quantity}`);
  }

  restaurantCart.textContent = rows.length
    ? rows.join(' · ')
    : 'Ainda não escolheste nada.';

  restaurantTotal.textContent = `Total: ${formatKz(total)}`;
  restaurantConfirm.disabled = order.size===0;
}

function renderMenu() {
  if (!activeRestaurant) return;

  const items = activeRestaurant[activeMenuTab];

  restaurantMenu.innerHTML = items.map(([name,price]) => {
    const key = `${activeRestaurant.id}:${activeMenuTab}:${name}`;
    const quantity = order.get(key)?.quantity || 0;

    return `
      <div class="restaurant-item">
        <div>
          <strong>${name}</strong>
          <span>${formatKz(price)}</span>
        </div>
        <div class="restaurant-quantity">
          <button data-order-minus="${encodeURIComponent(key)}">−</button>
          <b>${quantity}</b>
          <button data-order-plus="${encodeURIComponent(key)}">+</button>
        </div>
      </div>
    `;
  }).join('');

  restaurantMenu.querySelectorAll('[data-order-plus]').forEach(button => {
    button.addEventListener('click',() => {
      changeOrder(decodeURIComponent(button.dataset.orderPlus),1);
    });
  });

  restaurantMenu.querySelectorAll('[data-order-minus]').forEach(button => {
    button.addEventListener('click',() => {
      changeOrder(decodeURIComponent(button.dataset.orderMinus),-1);
    });
  });
}

function changeOrder(key, amount) {
  if (!activeRestaurant) return;

  const [,tab,name] = key.split(':');
  const entry = activeRestaurant[tab].find(item => item[0]===name);

  if (!entry) return;

  const existing = order.get(key)?.quantity || 0;
  const quantity = Math.max(0,Math.min(20,existing+amount));

  if (quantity===0) {
    order.delete(key);
  } else {
    order.set(key,{
      name,
      price:entry[1],
      quantity
    });
  }

  renderMenu();
  renderOrder();
}

function openRestaurant(restaurant) {
  if (!started || currentHouse || player.currentVehicle) return;

  activeRestaurant = restaurant;
  activeMenuTab = 'food';
  order.clear();

  restaurantTitle.textContent = restaurant.name;
  restaurantNotice.textContent = '';

  restaurantPanel.classList.add('visible');
  restaurantPanel.setAttribute('aria-hidden','false');

  document.querySelectorAll('[data-menu-tab]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.menuTab===activeMenuTab
    );
  });

  renderMenu();
  renderOrder();
}

function closeRestaurant() {
  restaurantPanel.classList.remove('visible');
  restaurantPanel.setAttribute('aria-hidden','true');

  activeRestaurant = null;
  order.clear();
}

document.querySelector('#restaurant-close')
  .addEventListener('click',closeRestaurant);

document.querySelectorAll('[data-menu-tab]').forEach(button => {
  button.addEventListener('click',() => {
    if (!activeRestaurant) return;

    activeMenuTab = button.dataset.menuTab;

    document.querySelectorAll('[data-menu-tab]').forEach(tab => {
      tab.classList.toggle('active',tab===button);
    });

    renderMenu();
  });
});

restaurantConfirm.addEventListener('click',() => {
  if (!activeRestaurant || order.size===0) return;

  const total = [...order.values()].reduce(
    (sum,item) => sum+item.price*item.quantity,
    0
  );

  const details = [...order.values()]
    .map(item => `${item.name} x${item.quantity}`)
    .join(', ');

  restaurantNotice.textContent =
    `Pedido registado: ${details}. Total: ${formatKz(total)}. ` +
    'O pagamento será ligado ao sistema de carteira numa próxima etapa.';

  console.info(
    '[ANGOLA LIFE 3D] Pedido:',
    activeRestaurant.name,
    details,
    formatKz(total)
  );

  order.clear();
  renderMenu();
  renderOrder();
});

// Clique nas cadeiras para sentar e nas garçonetes para abrir o menu.
renderer.domElement.addEventListener('pointerdown',event => {
  if (
    !started ||
    restaurantPanel.classList.contains('visible') ||
    currentHouse ||
    player.currentVehicle
  ) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y = -((event.clientY-rect.top)/rect.height)*2+1;

  raycaster.setFromCamera(pointer,camera);

  if (player.sitting) return;

  const chairHit = raycaster.intersectObjects(clickableChairs,false)[0];

  if (chairHit) {
    const chair = chairHit.object.userData.restaurantChair;

    if (chair) {
      player.sitAt(chair.x,chair.z,chair.rotationY);
      return;
    }
  }

  const hit = raycaster.intersectObjects(restaurantStaff,true)[0];

  if (!hit) return;

  let object = hit.object;

  while (object && !object.userData.clickableWaiter) {
    object = object.parent;
  }

  if (object?.userData.restaurant) {
    openRestaurant(object.userData.restaurant);
  }
});

startButton.addEventListener('click',() => {
  started = true;
  welcome.classList.add('hidden');
  player.updateCamera();
});

function snapCameraToPlayer() {
  const target = player.currentVehicle
    ? player.currentVehicle.group.position
    : player.group.position;

  const rotation = player.currentVehicle
    ? player.currentVehicle.group.rotation.y
    : player.group.rotation.y;

  const distance = player.currentVehicle ? 10 : player.indoor ? 3.2 : 7;
  const height = player.currentVehicle ? 5 : player.indoor ? 2.8 : 4;

  camera.position.set(
    target.x-Math.sin(rotation)*distance,
    target.y+height,
    target.z-Math.cos(rotation)*distance
  );

  camera.lookAt(
    target.x,
    target.y+(player.currentVehicle?1.5:1.4),
    target.z
  );
}

function setInteriorView(house,inside) {
  if (house?.interiorRoof) {
    house.interiorRoof.visible = !inside;
  }
}

mapButton.addEventListener('click',() => {
  mapPanel.classList.toggle('visible');
});

document.querySelector('#close-map')
  .addEventListener('click',() => {
    mapPanel.classList.remove('visible');
  });

function exitRestaurant() {
  if (!currentRestaurant) return;

  const restaurant = currentRestaurant;

  restaurant.roof.visible = true;
  currentRestaurant = null;

  scene.fog = outsideFog;
  player.setIndoor(false);
  player.setColliders(exteriorColliders);
  player.teleport(restaurant.x,restaurant.z+9.2);
  snapCameraToPlayer();

  actionButton.textContent = '🍽️ ENTRAR NO RESTAURANTE';
}

function enterRestaurant(restaurant) {
  if (!restaurant || currentRestaurant || currentHouse) return;

  if (player.currentVehicle) player.exitVehicle();

  closeRestaurant();
  currentRestaurant = restaurant;
  player.moveTarget = null;

  restaurant.roof.visible = false;
  scene.fog = null;

  player.setColliders(restaurant.colliders || []);
  player.setIndoor(true);
  player.group.visible = true;
  player.teleport(restaurant.x,restaurant.z+4.2);

  snapCameraToPlayer();

  actionButton.textContent = '🚪 SAIR DO RESTAURANTE';
}

function findNearestRestaurantDoor() {
  if (currentRestaurant || currentHouse || player.currentVehicle) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const restaurant of RESTAURANTS) {
    const dx = player.group.position.x-restaurant.x;
    const dz = player.group.position.z-(restaurant.z+8.3);

    if (Math.abs(dx)>3.2 || dz < -2.4 || dz > 3.2) continue;

    const distance = Math.hypot(dx,dz);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = restaurant;
    }
  }

  return nearestDistance <= 3.2 ? nearest : null;
}

function exitHouse() {
  if (!currentHouse) return;

  const house = currentHouse;

  house.interior.visible = false;
  setInteriorView(house,false);
  player.setIndoor(false);
  currentHouse = null;

  scene.fog = outsideFog;
  player.setColliders(exteriorColliders);
  player.group.visible = true;

  player.teleport(house.x,house.z+8);
  snapCameraToPlayer();

  actionButton.textContent = '🏠 ENTRAR EM CASA';
}

function enterHouse(house) {
  if (!house || currentHouse) return;

  if (player.currentVehicle) {
    player.exitVehicle();
  }

  currentHouse = house;
  player.moveTarget = null;

  house.interior.visible = true;
  setInteriorView(house,true);
  scene.fog = null;

  player.setColliders(house.colliders||[]);
  player.setIndoor(true);
  player.group.visible = true;
  player.group.rotation.y = 0;

  player.teleport(house.interiorX,house.interiorZ);
  snapCameraToPlayer();

  actionButton.textContent = '🚪 SAIR DE CASA';
}

function findNearestHouse() {
  if (currentHouse || player.currentVehicle) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  const playerX = player.group.position.x;
  const playerZ = player.group.position.z;

  for (const house of houses) {
    const dx = playerX-house.x;
    const dz = playerZ-(house.z+6.2);

    if (Math.abs(dx)>2.1 || dz<0.25 || dz>4.2) continue;

    const distance = Math.hypot(dx,dz);

    if (distance<nearestDistance) {
      nearestDistance = distance;
      nearest = house;
    }
  }

  return nearestDistance<=4.2 ? nearest : null;
}

function tryAutoEnterHouse() {
  if (
    !started ||
    currentHouse ||
    currentRestaurant ||
    player.currentVehicle ||
    player.sitting ||
    restaurantPanel.classList.contains('visible')
  ) return;

  const playerX = player.group.position.x;
  const playerZ = player.group.position.z;

  for (const house of houses) {
    const dx = playerX-house.x;
    const distanceFromDoor = playerZ-(house.z+6.2);

    if (
      Math.abs(dx)<=2.1 &&
      distanceFromDoor>=0.35 &&
      distanceFromDoor<=2.0
    ) {
      enterHouse(house);
      return;
    }
  }
}

function interact() {
  if (!started) return;

  if (player.sitting) {
    player.standUp();
    return;
  }

  if (restaurantPanel.classList.contains('visible')) {
    closeRestaurant();
    return;
  }

  if (currentRestaurant) {
    exitRestaurant();
    return;
  }

  const restaurantDoor = findNearestRestaurantDoor();

  if (restaurantDoor) {
    enterRestaurant(restaurantDoor);
    return;
  }

  if (currentHouse) {
    exitHouse();
    return;
  }

  const house = findNearestHouse();

  if (house) {
    enterHouse(house);
    return;
  }

  player.toggleVehicle();
}

player.onInteract = interact;
actionButton.addEventListener('click',interact);

world.destinations.forEach(destination => {
  const button = document.createElement('button');

  button.className = 'destination';
  button.textContent = '📍 '+destination.name;

  button.addEventListener('click',() => {
    if (currentHouse) exitHouse();
    if (currentRestaurant) exitRestaurant();

    closeRestaurant();

    player.teleport(destination.x,destination.z);
    snapCameraToPlayer();

    mapPanel.classList.remove('visible');
  });

  destinations.appendChild(button);
});

document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;

  button.addEventListener('pointerdown',event => {
    event.preventDefault();

    if (player.sitting) return;

    player.keys[key] = true;
    button.classList.add('pressed');
  });

  const release = () => {
    player.keys[key] = false;
    button.classList.remove('pressed');
  };

  button.addEventListener('pointerup',release);
  button.addEventListener('pointerleave',release);
  button.addEventListener('pointercancel',release);
});

function updateActionButton() {
  if (player.sitting) {
    actionButton.textContent = '🧍 LEVANTAR';
    return;
  }

  if (restaurantPanel.classList.contains('visible')) {
    actionButton.textContent = '🍽️ FECHAR MENU';
    return;
  }

  if (currentRestaurant) {
    actionButton.textContent = '🚪 SAIR DO RESTAURANTE';
    return;
  }

  if (currentHouse) {
    actionButton.textContent = '🚪 SAIR DE CASA';
    return;
  }

  if (findNearestRestaurantDoor()) {
    actionButton.textContent = '🍽️ ENTRAR NO RESTAURANTE';
    return;
  }

  if (findNearestHouse()) {
    actionButton.textContent = '🏠 ENTRAR EM CASA';
    return;
  }

  if (player.currentVehicle) {
    actionButton.textContent = '🚶 SAIR DO CARRO';
  } else if (player.findNearestVehicle()) {
    actionButton.textContent = '🚗 ENTRAR NO CARRO';
  } else {
    actionButton.textContent = '🚶 A EXPLORAR';
  }
}

function animate() {
  const delta = Math.min(clock.getDelta(),0.05);

  if (started) {
    player.update(delta);
    tryAutoEnterHouse();

    if (!currentHouse) {
      updatePeople(delta);
    }

    updateRestaurantStaff(restaurantStaff,delta);
    updateActionButton();
  }

  renderer.render(scene,camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize',() => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
