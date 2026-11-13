
import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';
import './style.css';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  800
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.domElement.id = 'game-canvas';
document.body.appendChild(renderer.domElement);

// Mundo
const world = createWorld(scene);

// Jogador
const player = new Player(scene, camera, world.vehicles);

// Interface
const ui = document.createElement('div');
ui.id = 'game-ui';

ui.innerHTML = `
  <div id="topbar">
    <div class="profile">
      <div class="avatar">👤</div>
      <div>
        <strong>Jogador</strong>
        <small>Nível 1</small>
      </div>
    </div>
    <div class="money">💰 0 Kz</div>
  </div>

  <div id="map">
    <div class="map-title">LUANDA</div>
    <div id="map-player"></div>
  </div>

  <div id="bottom-info">
    <span>🇦🇴 ANGOLA LIFE 3D</span>
    <span id="vehicle-status">A pé</span>
  </div>

  <button id="vehicle-button">🚗 ENTRAR NO CARRO (E)</button>

  <div id="start-screen">
    <div class="start-content">
      <h1>ANGOLA LIFE 3D</h1>
      <p>Vive a tua vida em Luanda.</p>
      <button id="start-button">ENTRAR NA CIDADE</button>
    </div>
  </div>
`;

document.body.appendChild(ui);

let started = false;

document.getElementById('start-button').addEventListener('click', () => {
  started = true;
  document.getElementById('start-screen').style.display = 'none';
});

document.getElementById('vehicle-button').addEventListener('click', () => {
  if (!started) return;
  player.toggleVehicle();
});

const map = document.getElementById('map');

map.addEventListener('pointerdown', e => {
  if (!started || e.target.id === 'map-player') return;

  const rect = map.getBoundingClientRect();

  const x = (e.clientX - rect.left) / rect.width;
  const z = (e.clientY - rect.top) / rect.height;

  player.setPosition(
    (x - 0.5) * 380,
    (z - 0.5) * 380
  );
});

const marker = document.getElementById('map-player');
const status = document.getElementById('vehicle-status');

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (started) {
    player.update(delta);

    marker.style.left =
      (50 + player.group.position.x / 380 * 100) + '%';

    marker.style.top =
      (50 + player.group.position.z / 380 * 100) + '%';

    status.textContent = player.vehicle
      ? '🚗 A conduzir'
      : '🚶 A pé';

    world.pedestrians.forEach((p, i) => {
      p.phase += delta * 2;

      p.group.position.x =
        p.originX + Math.sin(p.phase * 0.4 + i) * 4;

      p.group.position.z =
        p.originZ + Math.cos(p.phase * 0.4 + i) * 4;

      p.group.rotation.y = p.phase;
    });
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
