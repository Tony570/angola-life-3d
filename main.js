import * as THREE from 'three';
import { createWorld } from './world.js';

// --- INICIALIZAÇÃO DA CENA, CÂMARA E RENDERIZADOR ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Cor de céu diurno

const camera = new THREE.PerspectiveCamera(
  60, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);

// Posicionamento inicial da câmara (visão geral sobre o centro de Luanda)
camera.position.set(0, 45, 50);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// --- CONSTRUIR O MUNDO ---
createWorld(scene);

// --- AJUSTE DE JANELA (Responsivo) ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- LOOP DE ANIMAÇÃO ---
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
