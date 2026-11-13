
import * as THREE from 'three';
import { createWorld } from './world.js';
import { createHouseSystem } from './houses.js';
import { Player } from './player.js';
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

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9ac7df');
scene.fog = new THREE.Fog('#9ac7df', 100, 230);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  700
);
camera.position.set(0, 6, 28);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
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
const houses = createHouseSystem(scene);
const player = new Player(scene, camera, world.vehicles);

const clock = new THREE.Clock();

const welcome = document.querySelector('#welcome');
const startButton = document.querySelector('#start-game');
const actionButton = document.querySelector('#vehicle-button');
const mapButton = document.querySelector('#map-button');
const mapPanel = document.querySelector('#map-panel');

let started = false;
let currentHouse = null;

startButton.addEventListener('click', () => {
  started = true;
  welcome.classList.add('hidden');
  player.updateCamera();
});

mapButton.addEventListener('click', () => {
  mapPanel.classList.toggle('visible');
});

document.querySelector('#close-map').addEventListener('click', () => {
  mapPanel.classList.remove('visible');
});

const destinations = document.querySelector('#map-destinations');

world.destinations.forEach(destination => {
  const button = document.createElement('button');
  button.className = 'destination';
  button.textContent = '📍 ' + destination.name;

  button.addEventListener('click', () => {
    if (currentHouse) exitHouse();
    player.teleport(destination.x, destination.z);
    mapPanel.classList.remove('visible');
  });

  destinations.appendChild(button);
});

function findNearestHouse() {
  if (currentHouse) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const house of houses) {
    const dx = player.group.position.x - house.x;
    const dz = player.group.position.z - house.z;
    const distance = Math.hypot(dx, dz);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = house;
    }
  }

  return nearestDistance <= 13 ? nearest : null;
}

function enterHouse(house) {
  if (!house || currentHouse) return;

  currentHouse = house;
  house.interior.visible = true;

  player.teleport(house.interiorX, house.interiorZ);
  actionButton.textContent = '🚪 SAIR DE CASA';
}

function exitHouse() {
  if (!currentHouse) return;

  const house = currentHouse;
  house.interior.visible = false;
  currentHouse = null;

  player.teleport(house.x, house.z + 13);
  actionButton.textContent = '🏠 ENTRAR EM CASA';
}

function interact() {
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

// Controlos móveis
document.querySelectorAll('[data-key]').forEach(button => {
  const key = button.dataset.key;

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
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

function animateNPCs(delta, time) {
  world.npcs.forEach(npc => {
    const t = time * 0.35 + npc.phase;
    npc.group.position.x = npc.originX + Math.sin(t) * 3;
    npc.group.position.z = npc.originZ + Math.cos(t) * 3;
    npc.group.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t));
  });
}

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

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if (started) {
    player.update(delta);

    if (!currentHouse) {
      animateNPCs(delta, time);
    }

    updateActionButton();
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
