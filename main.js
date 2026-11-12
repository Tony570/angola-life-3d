
import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';
import './style.css';

// CENA PRINCIPAL
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 90, 260);

// CÂMARA
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  600
);

// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.domElement.id = 'game-canvas';
renderer.domElement.style.cssText =
  'position:fixed;inset:0;width:100%;height:100%;display:block;z-index:1;';

document.body.appendChild(renderer.domElement);

// CONSTRUIR CIDADE E JOGADOR
createWorld(scene);
const player = new Player(scene, camera);

// AJUSTAR ECRÃ
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);

// CICLO DO JOGO
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  player.update(delta);
  renderer.render(scene, camera);
}

animate();
