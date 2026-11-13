
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createHouseSystem } from './houses.js';
import { Player } from './player.js';
import { updatePeople } from './people.js';
import './style.css';

// ============================================
// ANGOLA LIFE 3D — SISTEMA PRINCIPAL
// Cidade, casas, interiores, carros e habitantes
// ============================================

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

    <div id="joystick">
      <div id="joystick-knob"></div>
    </div>

    <div id="mobile-controls">
      <button data-key="w">▲</button>
      <div>
        <button data-key="a">◀</button>
        <button data-key="s">▼</button>
        <button data-key="d">▶</button>
      </div>
    </div>

    <div id="help">JOYSTICK: MOVER · E: ENTRAR OU SAIR</div>
  </div>
`;

const game = document.querySelector('#game');

// ============================================
// CENA
// ============================================

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9ac7df');

const outsideFog = new THREE.Fog('#9ac7df', 100, 230);
scene.fog = outsideFog;

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1200
);

camera.position.set(0, 6, 28);

// ============================================
// RENDERIZADOR
// ============================================

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

game.prepend(renderer.domElement);

// ============================================
// ILUMINAÇÃO
// ============================================

scene.add(
  new THREE.HemisphereLight('#ffffff', '#76634b', 2)
);

const sun = new THREE.DirectionalLight('#fff0d2', 2.2);
sun.position.set(-40, 70, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// ============================================
// MUNDO, CASAS E JOGADOR
// ============================================

const world = createWorld(scene);
const houses = createHouseSystem(scene);

const player = new Player(scene, camera, world.vehicles);

const exteriorColliders = houses.flatMap(
  house => house.exteriorColliders || []
);

player.setColliders(exteriorColliders);

const clock = new THREE.Clock();

// ============================================
// INTERFACE
// ============================================

const welcome = document.querySelector('#welcome');
const startButton = document.querySelector('#start-game');
const actionButton = document.querySelector('#vehicle-button');
const mapButton = document.querySelector('#map-button');
const mapPanel = document.querySelector('#map-panel');
const destinations = document.querySelector('#map-destinations');

let started = false;
let currentHouse = null;

// ============================================
// INÍCIO
// ============================================

startButton.addEventListener('click', () => {
  started = true;
  welcome.classList.add('hidden');
  player.updateCamera();
});

// ============================================
// CÂMARA
// ============================================

function snapCameraToPlayer() {
  const target = player.currentVehicle
    ? player.currentVehicle.group.position
    : player.group.position;

  const rotation = player.currentVehicle
    ? player.currentVehicle.group.rotation.y
    : player.group.rotation.y;

  const distance = player.currentVehicle
    ? 10
    : player.indoor
      ? 3.2
      : 7;

  const height = player.currentVehicle
    ? 5
    : player.indoor
      ? 2.8
      : 4;

  camera.position.set(
    target.x - Math.sin(rotation) * distance,
    target.y + height,
    target.z - Math.cos(rotation) * distance
  );

  camera.lookAt(
    target.x,
    target.y + (player.currentVehicle ? 1.5 : 1.4),
    target.z
  );
}

// ============================================
// TETO DO INTERIOR
// ============================================

function setInteriorView(house, inside) {
  if (!house || !house.interiorRoof) return;

  house.interiorRoof.visible = !inside;
}

// ============================================
// MAPA
// ============================================

mapButton.addEventListener('click', () => {
  mapPanel.classList.toggle('visible');
});

document.querySelector('#close-map').addEventListener('click', () => {
  mapPanel.classList.remove('visible');
});

world.destinations.forEach(destination => {
  const button = document.createElement('button');

  button.className = 'destination';
  button.textContent = '📍 ' + destination.name;

  button.addEventListener('click', () => {
    if (currentHouse) {
      exitHouse();
    }

    player.teleport(destination.x, destination.z);
    snapCameraToPlayer();

    mapPanel.classList.remove('visible');
  });

  destinations.appendChild(button);
});

// ============================================
// ENCONTRAR CASA E DETETAR A PORTA
// ============================================

function findNearestHouse() {
  if (currentHouse) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  const playerX = player.group.position.x;
  const playerZ = player.group.position.z;

  for (const house of houses) {
    const dx = playerX - house.x;
    const dz = playerZ - (house.z + 7);

    const alignedWithDoor = Math.abs(dx) <= 3.2;
    const inFrontOfDoor = dz >= -1 && dz <= 6;

    if (!alignedWithDoor || !inFrontOfDoor) continue;

    const distance = Math.hypot(dx, dz);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = house;
    }
  }

  return nearestDistance <= 6 ? nearest : null;
}

// ============================================
// ENTRAR EM CASA
// ============================================

function enterHouse(house) {
  if (!house || currentHouse) return;

  if (player.currentVehicle) {
    player.exitVehicle();
  }

  currentHouse = house;

  house.interior.visible = true;
  setInteriorView(house, true);

  scene.fog = null;

  player.setColliders(house.colliders || []);
  player.setIndoor(true);
  player.group.visible = true;
  player.group.rotation.y = 0;

  player.teleport(
    house.interiorX,
    house.interiorZ
  );

  snapCameraToPlayer();

  actionButton.textContent = '🚪 SAIR DE CASA';
}

// ============================================
// SAIR DE CASA
// ============================================

function exitHouse() {
  if (!currentHouse) return;

  const house = currentHouse;

  house.interior.visible = false;
  setInteriorView(house, false);

  player.setIndoor(false);

  currentHouse = null;

  scene.fog = outsideFog;

  player.setColliders(exteriorColliders);
  player.group.visible = true;

  player.teleport(
    house.x,
    house.z + 8
  );

  snapCameraToPlayer();

  actionButton.textContent = '🏠 ENTRAR EM CASA';
}

// ============================================
// INTERAÇÃO
// ============================================

function interact() {
  if (!started) return;

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

actionButton.addEventListener('click', interact);

// ============================================
// CONTROLOS MÓVEIS
// ============================================

document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;

  button.addEventListener('pointerdown', event => {
    event.preventDefault();

    player.keys[key] = true;
    button.classList.add('pressed');
  });

  const release = () => {
    player.keys[key] = false;
    button.classList.remove('pressed');
  };

  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

// ============================================
// BOTÃO DE INTERAÇÃO
// ============================================

function updateActionButton() {
  if (currentHouse) {
    actionButton.textContent = '🚪 SAIR DE CASA';
    return;
  }

  const house = findNearestHouse();

  if (house) {
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

// ============================================
// CICLO DO JOGO
// ============================================

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (started) {
    player.update(delta);

    // Atualizar animações dos habitantes.
    // Não movimentar habitantes enquanto o jogador está dentro de casa.
    if (!currentHouse) {
      updatePeople(delta);
    }

    updateActionButton();
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// ============================================
// REDIMENSIONAR ECRÃ
// ============================================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});
