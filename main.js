import * as THREE from 'three';
import { Player } from './player.js';
import { createServices } from './services.js';
import { createOnlineAccount } from './online.js';
import { createPlayerPhone } from './player-phone.js';
import './style.css';

const app = document.querySelector('#app');

app.innerHTML = `
<div id="game">
  <div id="topbar">
    <div class="brand">ANGOLA <span>LIFE 3D</span></div>
    <div class="money">💰 25.000 Kz</div>
    <button id="bank-button" type="button">💳 BANCO</button>
  </div>

  <div id="welcome" class="screen">
    <div class="welcome-content">
      <div class="logo">ANGOLA LIFE 3D</div>
      <p>O teu personagem está pronto.</p>
      <button id="start-game" type="button">ENTRAR NO MUNDO</button>
    </div>
  </div>

  <div id="hud">
    <div class="location">🧍 SÓ O TEU PERSONAGEM</div>
    <button id="interact-button" type="button">💳 CONTA E TRANSFERÊNCIAS</button>
  </div>

  <div id="mobile-controls" aria-label="Controlos do personagem">
    <button data-key="w" aria-label="Avançar">▲</button>
    <div>
      <button data-key="a" aria-label="Esquerda">◀</button>
      <button data-key="s" aria-label="Recuar">▼</button>
      <button data-key="d" aria-label="Direita">▶</button>
    </div>
  </div>

  <div id="help">USA W A S D OU OS BOTÕES PARA MOVER O PERSONAGEM · ARRASTA O ECRÃ PARA RODAR A CÂMARA</div>
</div>
`;

const game = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101b20');

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1200
);

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false,
  depth: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 0.85 : 1.25));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = false;
game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#f4f8ff', '#78634e', 2.25));
const sun = new THREE.DirectionalLight('#fff3dc', 1.85);
sun.position.set(-40, 70, 35);
scene.add(sun);

// Mundo temporariamente vazio: não são criados edifícios, ruas, objetos,
// árvores, veículos, NPCs ou personagens secundários.
const world = {
  vehicles: [],
  trafficVehicles: [],
  npcs: [],
  buildings: [],
  destinations: [],
  updateTraffic() {}
};

const player = new Player(scene, camera, world.vehicles);
player.setColliders([]);

const moneyDisplay = document.querySelector('.money');
let services = null;

const online = createOnlineAccount({
  onProfile(data) {
    if (services) services.syncOnlineData(data);
    if (data?.profile?.appearance) {
      player.setAppearance(data.profile.appearance);
    }
  }
});

services = createServices({
  game,
  online,
  onMoneyChange(balance) {
    moneyDisplay.textContent = `💰 ${balance.toLocaleString('pt-PT')} Kz`;
  }
});

createPlayerPhone({ game, online, services, player });

window.addEventListener('angolaLife3D:clothingPurchase', event => {
  const item = event.detail?.name;
  if (!item) return;

  player.equipClothing(item);
  const appearance = online.getProfile()?.appearance || player.appearance || {};
  const clothing = {
    ...(appearance.clothing || {}),
    [player.clothingSlot(item)]: item
  };

  online.saveAppearance({ ...appearance, clothing }).catch(error => {
    console.warn('A roupa foi equipada, mas não foi possível guardá-la online:', error);
  });
});

const welcome = document.querySelector('#welcome');
const startButton = document.querySelector('#start-game');
const bankButton = document.querySelector('#bank-button');
const interactButton = document.querySelector('#interact-button');
const mobileControls = document.querySelector('#mobile-controls');
let started = false;

function openBank() {
  if (services.isOpen()) services.close();
  else services.open('bank');
}

bankButton.addEventListener('click', openBank);
interactButton.addEventListener('click', openBank);
player.onInteract = openBank;

startButton.addEventListener('click', () => {
  started = true;
  welcome.classList.add('hidden');
  player.update(0);
});

mobileControls.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-key]');
  if (!button) return;
  event.preventDefault();
  player.keys[button.dataset.key] = true;
  button.classList.add('pressed');
});

function releaseMobileControl(event) {
  const button = event.target.closest?.('[data-key]');
  if (!button) return;
  player.keys[button.dataset.key] = false;
  button.classList.remove('pressed');
}

mobileControls.addEventListener('pointerup', releaseMobileControl);
mobileControls.addEventListener('pointercancel', releaseMobileControl);
mobileControls.addEventListener('pointerleave', releaseMobileControl);

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (started && !services.isOpen()) {
    player.update(delta);
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 0.85 : 1.25));
});
