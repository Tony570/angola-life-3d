import * as THREE from 'three';
import { Player } from './player.js';
import { createServices } from './services.js';
import { createOnlineAccount } from './online.js';
import { createPlayerPhone } from './player-phone.js';
import { createKilambaDistrict } from './kilamba.js';
import { createHouseSystem } from './kilamba-apartments.js';
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
      <p>Explora o bairro Kilamba. Dez blocos residenciais com casas habitáveis.</p>
      <button id="start-game" type="button">ENTRAR NO KILAMBA</button>
    </div>
  </div>

  <div id="hud">
    <div class="location" id="district-location">🏙️ KILAMBA · BAIRRO RESIDENCIAL</div>
    <button id="interact-button" type="button">🏠 ENTRAR EM CASA</button>
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
  antialias: !isMobile,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false,
  depth: true,
  precision: 'mediump'
});

// Perfil leve para telemóveis: evita renderização em excesso e mantém a imagem nítida.
function updateRenderQuality() {
  const deviceRatio = window.devicePixelRatio || 1;
  const cap = isMobile ? 0.72 : 1.2;
  renderer.setPixelRatio(Math.min(deviceRatio, cap));
  renderer.setSize(window.innerWidth, window.innerHeight);
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 0.72 : 1.2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
// Sombras dinâmicas são dispendiosas em telemóveis e não são essenciais nesta fase.
renderer.shadowMap.enabled = false;
game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#f4f8ff', '#78634e', 2.25));
const sun = new THREE.DirectionalLight('#fff3dc', 1.85);
sun.position.set(-40, 70, 35);
sun.castShadow = false;
scene.add(sun);

// Bairro Kilamba: ruas, passeios, jardins e exatamente dez blocos habitáveis.
const world = createKilambaDistrict(scene);
const houses = createHouseSystem(scene, world);

const player = new Player(scene, camera, world.vehicles);
player.setColliders(world.colliders);

const moneyDisplay = document.querySelector('.money');
let services = null;

const online = createOnlineAccount({
  onProfile(data) {
    currentPlayerData = data;
    if (services) services.syncOnlineData(data);
    if (wardrobePanel) renderWardrobeProfile();
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

let activeHouse = null;
let activeFloor = 0;
let activeInteractable = null;
const districtLocation = document.querySelector('#district-location');

// Painel de elevador: rés-do-chão e quatro pisos residenciais.
const elevatorPanel = document.createElement('section');
elevatorPanel.id = 'elevator-panel';
elevatorPanel.hidden = true;
elevatorPanel.innerHTML = `
  <div class="elevator-heading"><span>ELEVADOR</span><strong id="elevator-current-floor">RÉS-DO-CHÃO</strong></div>
  <div class="elevator-floor-buttons">
    <button type="button" data-floor="0">R/C</button>
    <button type="button" data-floor="1">1</button>
    <button type="button" data-floor="2">2</button>
    <button type="button" data-floor="3">3</button>
    <button type="button" data-floor="4">4</button>
  </div>
  <small>Escolhe o piso para subir ou descer.</small>
`;
game.appendChild(elevatorPanel);
const elevatorLabel = elevatorPanel.querySelector('#elevator-current-floor');
const homePanel = document.createElement('section');
homePanel.id = 'home-tools'; homePanel.hidden = true;
homePanel.innerHTML = ['<div class="home-tools-heading"><strong>CASA</strong><button type="button" id="close-home-tools">✕</button></div>','<button type="button" id="toggle-decor-mode">🪴 MODO DECORAÇÃO</button>','<div id="decor-catalog" hidden><small>ESCOLHE UM OBJETO</small><div class="decor-items"><button type="button" data-decor="plant">🌿 Planta</button><button type="button" data-decor="table">🪑 Mesa</button><button type="button" data-decor="chair">🛋️ Cadeira</button></div><div class="decor-actions"><button type="button" id="rotate-decor">↻ Rodar</button><button type="button" id="remove-decor">⌫ Apagar último</button></div></div>','<small id="home-tools-help">Aproxima-te dos móveis e usa INTERAGIR.</small>'].join('');
game.appendChild(homePanel);
const decorCatalog = homePanel.querySelector('#decor-catalog');
let decorMode = false, decorRotation = 0, selectedDecor = 'plant';
const decorMaterials = {wood:new THREE.MeshStandardMaterial({color:0x805638,roughness:.82}),green:new THREE.MeshStandardMaterial({color:0x39764a,roughness:.9}),pot:new THREE.MeshStandardMaterial({color:0xa65f3d,roughness:.9}),fabric:new THREE.MeshStandardMaterial({color:0x547b89,roughness:.95})};
function createDecorObject(type) { const group=new THREE.Group(); if(type==='plant'){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,.42,10),decorMaterials.pot);pot.position.y=.21;group.add(pot);const leaves=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),decorMaterials.green);leaves.position.y=.72;leaves.scale.set(.8,1.35,.8);group.add(leaves);}else if(type==='table'){const top=new THREE.Mesh(new THREE.BoxGeometry(1.15,.12,.8),decorMaterials.wood);top.position.y=.78;group.add(top);for(const x of [-.48,.48])for(const z of [-.3,.3]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.09,.75,.09),decorMaterials.wood);leg.position.set(x,.37,z);group.add(leg);}}else{const seat=new THREE.Mesh(new THREE.BoxGeometry(.8,.18,.72),decorMaterials.fabric);seat.position.y=.48;group.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.8,.72,.12),decorMaterials.fabric);back.position.set(0,.82,-.3);group.add(back);for(const x of [-.3,.3])for(const z of [-.25,.25]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.07,.42,.07),decorMaterials.wood);leg.position.set(x,.21,z);group.add(leg);}}group.userData.isPlayerDecoration=true;return group;}
function placeDecoration(type=selectedDecor) {if(!activeHouse||!decorMode||player.sitting)return;const level=activeHouse.interior.children.find(child=>Math.abs(child.position.y-activeFloor*activeHouse.floorHeight)<.01);if(!level)return;const forward=new THREE.Vector3(Math.sin(player.group.rotation.y),0,Math.cos(player.group.rotation.y));const pos=player.group.position.clone().addScaledVector(forward,1.7);const x=pos.x-activeHouse.interiorX,z=pos.z-activeHouse.interiorZ;if(Math.abs(x)>12.5||Math.abs(z)>12.5)return;const item=createDecorObject(type);item.position.set(x/1.5,0,z/1.5);item.rotation.y=decorRotation;level.add(item);if(!activeHouse.decorations)activeHouse.decorations=[];activeHouse.decorations.push(item);}
homePanel.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.id==='close-home-tools')homePanel.hidden=true;if(button.id==='toggle-decor-mode'){decorMode=!decorMode;decorCatalog.hidden=!decorMode;button.textContent=decorMode?'✓ MODO DECORAÇÃO ATIVO':'🪴 MODO DECORAÇÃO';}if(button.dataset.decor){selectedDecor=button.dataset.decor;placeDecoration(selectedDecor);}if(button.id==='rotate-decor')decorRotation+=Math.PI/4;if(button.id==='remove-decor'&&activeHouse?.decorations?.length){const last=activeHouse.decorations.pop();last.parent?.remove(last);}});

function nearestHouse() {
  if (activeHouse) return activeHouse;
  let nearest = null, distance = Infinity;
  for (const house of houses) {
    const d = Math.hypot(player.group.position.x-house.entranceX,player.group.position.z-house.entranceZ);
    if (d < distance) { distance=d; nearest=house; }
  }
  return distance <= 5.5 ? nearest : null;
}
function floorName(floor) { return floor === 0 ? 'RÉS-DO-CHÃO' : 'PISO '+floor; }
function setActiveHouseColliders() {
  if (!activeHouse) return;
  player.setColliders(activeHouse.colliders.filter(item => !item._houseDoor || (item.floor === activeFloor && item.door.userData.houseDoorCollider.active)));
}
function goToFloor(floor) {
  if (!activeHouse) return;
  const next = Math.max(0, Math.min(activeHouse.floorCount - 1, Number(floor) || 0));
  activeFloor = next;
  activeHouse.currentFloor = next;
  setActiveHouseColliders();
  player.setIndoorFloor(next * activeHouse.floorHeight + 0.16);
  player.cameraDistance = 6.2;
  player.cameraHeightAngle = 0.34;
  player.teleport(activeHouse.interiorX, activeHouse.interiorZ + 7.2);
  elevatorLabel.textContent = floorName(next);
  elevatorPanel.querySelectorAll('[data-floor]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.floor) === next);
  });
  districtLocation.textContent = '🏢 KILAMBA · '+activeHouse.name.toUpperCase()+' · '+floorName(next);
}
elevatorPanel.addEventListener('click', event => {
  const button = event.target.closest('[data-floor]');
  if (button) goToFloor(button.dataset.floor);
});
function addReceptionistUniform(group, variant=0) {
  if (!group || group.userData.hotelUniformApplied) return;
  group.userData.hotelUniformApplied = true;
  const navy = new THREE.MeshStandardMaterial({color:variant===0?0x14283f:0x24364b,roughness:.62});
  const white = new THREE.MeshStandardMaterial({color:0xf5f3ed,roughness:.78});
  const gold = new THREE.MeshStandardMaterial({color:0xb99554,metalness:.55,roughness:.32});
  const black = new THREE.MeshStandardMaterial({color:0x171b20,roughness:.85});
  const makeBox=(x,y,z,w,h,d,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z); mesh.castShadow=false; mesh.receiveShadow=false; group.add(mesh); return mesh;
  };
  const makeCylinder=(x,y,z,r1,r2,h,material)=>{
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,10),material);
    mesh.position.set(x,y,z); group.add(mesh); return mesh;
  };
  // Colete/blazer azul-marinho sobre a camisa, com lapelas claras.
  makeBox(0,1.36,0,.62,.82,.34,navy);
  makeBox(0,1.39,.177,.28,.73,.025,white);
  makeBox(0,1.43,.198,.065,.48,.025,variant===0?gold:navy);
  for(const side of [-1,1]) {
    const lapel=makeBox(side*.13,1.56,.198,.13,.32,.035,white);
    lapel.rotation.z=side*.22;
    const sleeve=makeCylinder(side*.37,1.32,0,.105,.13,.72,navy);
    sleeve.rotation.z=side*.08;
    makeCylinder(side*.37,.94,0,.105,.105,.12,white);
  }
  // Calças sociais e sapatos escuros.
  makeBox(-.16,.55,0,.22,.68,.27,navy);
  makeBox(.16,.55,0,.22,.68,.27,navy);
  makeBox(-.16,.16,.07,.25,.16,.4,black);
  makeBox(.16,.16,.07,.25,.16,.4,black);
  // Crachá dourado e botões do uniforme.
  makeBox(-.19,1.58,.22,.13,.07,.025,gold);
  for(const y of [1.25,1.4,1.55]) makeCylinder(.12,y,.205,.018,.018,.025,gold);
  // Ombreiras discretas de concierge.
  makeBox(-.27,1.73,0,.19,.055,.36,gold);
  makeBox(.27,1.73,0,.19,.055,.36,gold);
}

function ensureHouseResidents(house) {
  if (!house || !house.interior || house.residentsCreated || !player.normalizedModel) return;
  house.residentsCreated = true;
  house.residents = [
    player.createResident(house.interior, -3.75, 0.16, 2.15, Math.PI),
    player.createResident(house.interior, 1.55, 0.16, 1.55, Math.PI)
  ].filter(Boolean);
  house.residents.forEach((resident,index) => addReceptionistUniform(resident.group,index));
}

player.onModelReady = () => {
  if (activeHouse) ensureHouseResidents(activeHouse);
};

function enterHouse(house) {
  house.ensureInterior();
  ensureHouseResidents(house);
  if (!house.interactables) {
    house.interactables = [];
    house.interior.traverse(object => {
      if (object.userData && object.userData.houseAction) house.interactables.push(object);
    });
  }
  house.interior.visible = true;
  if (house.interiorRoof) house.interiorRoof.visible = false;
  if (house.exterior) house.exterior.visible = false;
  activeHouse = house;
  activeFloor = 0;
  player.setIndoor(true);
  player.cameraDistance = 6.2;
  player.cameraHeightAngle = 0.38;
  player.setIndoorFloor(0.16);
  player.setColliders(house.colliders.filter(item => !item._houseDoor || (item.floor === 0 && item.door.userData.houseDoorCollider.active)));
  player.teleport(house.interiorX, house.interiorZ + 6.95);
  elevatorPanel.hidden = false;
  homePanel.hidden = false;
  goToFloor(0);
  interactButton.textContent = '🚪 SAIR DO BLOCO';
}
function leaveHouse() {
  if (!activeHouse) return;
  const house = activeHouse;
  house.interior.visible = false;
  if (house.interiorRoof) house.interiorRoof.visible = true;
  if (house.exterior) house.exterior.visible = true;
  activeHouse = null;
  elevatorPanel.hidden = true;
  homePanel.hidden = true;
  decorMode = false;
  decorCatalog.hidden = true;
  player.setIndoor(false);
  player.cameraHeightAngle = 0.42;
  player.setColliders(world.colliders);
  player.teleport(house.entranceX, house.entranceZ + 1.5);
  player.cameraDistance = 7;
  player.updateCamera();
  interactButton.textContent = '🏠 ENTRAR EM CASA';
  districtLocation.textContent = '🏙️ KILAMBA · BAIRRO RESIDENCIAL';
}
function interactWithHouse() {
  if (services.isOpen()) return;
  if (activeHouse) {
    if (player.sitting) {
      player.standUp();
      activeInteractable = null;
      return;
    }
    if (activeInteractable) {
      const action=activeInteractable.userData.houseAction;
      const position=activeInteractable.getWorldPosition(new THREE.Vector3());
      const showHomeMessage=message=>{districtLocation.textContent=message;window.setTimeout(()=>{if(activeHouse)districtLocation.textContent='🏢 KILAMBA · '+activeHouse.name.toUpperCase()+' · '+floorName(activeFloor);},1800);};
      if(action.type==='sit'||action.type==='bed'||action.type==='toilet'){player.sitAt(position.x,position.z+(action.offsetZ||1),action.rotationY||0);return;}
      if(action.type==='door'){const open=!activeInteractable.userData.isOpen;activeInteractable.userData.isOpen=open;activeInteractable.userData.houseDoorHinge.rotation.y=activeInteractable.userData.houseDoorBaseRotation+(open?action.openRotation:0);activeInteractable.userData.houseDoorCollider.active=!open;setActiveHouseColliders();showHomeMessage(open?'🚪 PORTA ABERTA':'🚪 PORTA FECHADA');return;}
      if(action.type==='stove'){const on=!activeInteractable.userData.isOn;activeInteractable.userData.isOn=on;activeInteractable.material.emissive.setHex(on?0xff4b08:0x000000);activeInteractable.material.emissiveIntensity=on ? .8 : 0;showHomeMessage(on?'🔥 FOGÃO LIGADO':'Fogão desligado');return;}
      if(action.type==='fridge'){const open=!activeInteractable.userData.isOpen;activeInteractable.userData.isOpen=open;activeInteractable.rotation.y=open ? .85 : 0;showHomeMessage(open?'🧊 FRIGORÍFICO ABERTO':'Frigorífico fechado');return;}
      if(action.type==='shower'){const on=!activeInteractable.userData.isOn;activeInteractable.userData.isOn=on;activeInteractable.material.opacity=on ? .68 : .38;showHomeMessage(on?'🚿 DUCHE LIGADO':'Duche desligado');return;}
      if(action.type==='sink'){showHomeMessage('🚰 A LAVAR AS MÃOS');return;}
      if(action.type==='wardrobe'){showHomeMessage('👕 GUARDA-ROUPA · A LOJA DE ROUPA SERÁ INTEGRADA AQUI');return;}
    }
    leaveHouse();
    return;
  }
  const house = nearestHouse();
  if (house) enterHouse(house);
  else {
    interactButton.textContent = '🏠 APROXIMA-TE DE UM BLOCO';
    window.setTimeout(() => { if (!activeHouse) interactButton.textContent = '🏠 ENTRAR EM CASA'; }, 1500);
  }
}
interactButton.addEventListener('click', interactWithHouse);
player.onInteract = interactWithHouse;
function updateHousePrompt() {
  if (services.isOpen()) return;
  if (!activeHouse) {
    const doorwayHouse = nearestHouse();
    const actualDoorZ = doorwayHouse ? doorwayHouse.entranceZ - 3.55 : 0;
    if (doorwayHouse && Math.hypot(player.group.position.x - doorwayHouse.entranceX, player.group.position.z - actualDoorZ) <= 1.65) {
      enterHouse(doorwayHouse);
      return;
    }
  }
  if (activeHouse) {
    if (player.sitting) {
      activeInteractable = null;
      interactButton.textContent = '🧍 LEVANTAR';
      return;
    }
    let nearest = null;
    let nearestDistance = 2.8;
    for (const object of activeHouse.interactables || []) {
      if (!object.visible) continue;
      const position = object.getWorldPosition(new THREE.Vector3());
      const distance = Math.hypot(player.group.position.x - position.x, player.group.position.z - position.z);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = object;
      }
    }
    activeInteractable = nearest;
    interactButton.textContent = nearest
      ? 'E · ' + nearest.userData.houseAction.label
      : '🚪 SAIR DO BLOCO';
    return;
  }
  activeInteractable = null;
  const house = nearestHouse();
  if (house) {
    const prompt = '🏠 ENTRAR · ' + house.name.toUpperCase();
    if (interactButton.textContent !== prompt) interactButton.textContent = prompt;
    const location = '🏢 KILAMBA · ' + house.name.toUpperCase();
    if (districtLocation.textContent !== location) districtLocation.textContent = location;
  } else {
    if (interactButton.textContent !== '🏠 ENTRAR EM CASA') interactButton.textContent = '🏠 ENTRAR EM CASA';
    if (districtLocation.textContent !== '🏙️ KILAMBA · BAIRRO RESIDENCIAL') districtLocation.textContent = '🏙️ KILAMBA · BAIRRO RESIDENCIAL';
  }
}

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

let promptAccumulator = 0;
let renderAccumulator = 0;
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (started && !services.isOpen()) {
    player.update(delta);
    if (activeHouse?.residents) {
      for (const resident of activeHouse.residents) resident.mixer?.update(delta);
    }
    promptAccumulator += delta;
    if (promptAccumulator >= 0.2) {
      updateHousePrompt();
      promptAccumulator = 0;
    }
  }

  // Em dispositivos móveis limita o desenho a 30 FPS, mantendo a simulação fluida.
  if (isMobile) {
    renderAccumulator += delta;
    if (renderAccumulator < 1 / 30) return;
    renderAccumulator = 0;
  }
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  updateRenderQuality();
});


// =========================================
// PERFIL DO PERSONAGEM E GUARDA-ROUPA
// Opção 4: perfil e guarda-roupa no mesmo ecrã.
// A coleção começa vazia; as roupas virão da futura loja.
// =========================================
let currentPlayerData = null;
let wardrobePanel = null;
let wardrobeStatus = null;

function getCurrentAppearance() {
  return online.getProfile()?.appearance || player.appearance || {
    skin: '#8d5524',
    hair: '#21160f',
    eyes: '#3b2418',
    hairstyle: 'curto'
  };
}

function renderPersonalKits() {
  if (!wardrobePanel) return;
  const list = wardrobePanel.querySelector('#personal-kits-list');
  const appearance = getCurrentAppearance();
  const kits = Array.isArray(appearance.kits) ? appearance.kits : [];

  if (!kits.length) {
    list.innerHTML = '<div class="wardrobe-empty"><strong>Ainda não tens kits pessoais</strong><span>Depois de comprares roupas na loja, poderás guardar conjuntos aqui.</span></div>';
    return;
  }

  list.innerHTML = kits.map((kit, index) => {
    const safeName = String(kit.name || 'Meu kit').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    const pieces = Object.keys(kit.clothing || {}).length;
    return `
      <article class="personal-kit">
        <div><strong>${safeName}</strong><small>${pieces} peça(s) guardada(s)</small></div>
        <div class="personal-kit-actions">
          <button type="button" data-kit-apply="${index}">VESTIR</button>
          <button type="button" data-kit-delete="${index}" aria-label="Apagar kit">APAGAR</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderWardrobeProfile() {
  if (!wardrobePanel) return;
  const profile = currentPlayerData?.profile || online.getProfile();
  const nickname = profile?.nickname || 'Visitante';
  const province = profile?.province || 'Angola';
  const name = wardrobePanel.querySelector('#wardrobe-player-name');
  const provinceLabel = wardrobePanel.querySelector('#wardrobe-player-province');
  const accountLabel = wardrobePanel.querySelector('#wardrobe-account-status');
  const clothesList = wardrobePanel.querySelector('#owned-clothes-list');

  name.textContent = nickname;
  provinceLabel.textContent = province;
  accountLabel.textContent = online.isAuthenticated() ? 'Conta online ligada' : 'A jogar como visitante';

  const inventory = Array.isArray(currentPlayerData?.inventory) ? currentPlayerData.inventory : [];
  const clothing = inventory.filter(item => /roupa|vestuário|vestuario|clothing|camisa|calça|sapato|ténis|tenis|casaco|vestido/i.test(
    `${item.category || ''} ${item.name || ''}`
  ));

  if (!clothing.length) {
    clothesList.innerHTML = '<div class="wardrobe-empty"><strong>O teu guarda-roupa está vazio</strong><span>Não há roupas disponíveis ainda. Vamos criar a loja numa etapa futura; será necessário comprar cada peça.</span></div>';
  } else {
    clothesList.innerHTML = clothing.map(item => `
      <div class="owned-clothing"><span>${String(item.name).replace(/[&<>"]/g, '')}</span><small>Quantidade: ${Number(item.quantity) || 1}</small></div>
    `).join('');
  }

  const saveButton = wardrobePanel.querySelector('#save-personal-kit');
  const hasClothesEquipped = Object.keys(getCurrentAppearance().clothing || {}).length > 0;
  saveButton.disabled = !hasClothesEquipped;
  saveButton.title = hasClothesEquipped
    ? 'Guardar o conjunto atual como um kit pessoal'
    : 'Compra e equipa roupas para poderes guardar um kit';
  renderPersonalKits();
}

function createWardrobePanel() {
  const openButton = document.createElement('button');
  openButton.id = 'character-button';
  openButton.type = 'button';
  openButton.textContent = '🧍 PERSONAGEM';
  document.querySelector('#topbar').appendChild(openButton);

  wardrobePanel = document.createElement('section');
  wardrobePanel.id = 'wardrobe-panel';
  wardrobePanel.setAttribute('aria-hidden', 'true');
  wardrobePanel.innerHTML = `
    <div class="wardrobe-window">
      <header class="wardrobe-header">
        <div><small>ANGOLA LIFE 3D · IDENTIDADE DO JOGADOR</small><h2>O MEU PERSONAGEM</h2></div>
        <button type="button" id="close-wardrobe" aria-label="Fechar">✕</button>
      </header>
      <div class="wardrobe-layout">
        <section class="wardrobe-profile">
          <div class="wardrobe-avatar-stage">
            <div class="wardrobe-avatar-icon">🧍🏿</div>
            <span>PERSONAGEM 3D</span>
            <small>O teu personagem aparece no mundo ao fundo.</small>
          </div>
          <div class="wardrobe-player-info">
            <small>PERFIL DO JOGADOR</small>
            <strong id="wardrobe-player-name">Visitante</strong>
            <span id="wardrobe-player-province">Angola</span>
            <span id="wardrobe-account-status">A jogar como visitante</span>
          </div>
          <div class="wardrobe-profile-note">A aparência e o progresso da tua conta continuam ligados ao sistema online.</div>
        </section>
        <section class="wardrobe-content">
          <nav class="wardrobe-tabs" aria-label="Secções do personagem">
            <button type="button" class="active" data-wardrobe-tab="clothes">GUARDA-ROUPA</button>
            <button type="button" data-wardrobe-tab="kits">KITS PESSOAIS</button>
          </nav>
          <div class="wardrobe-section active" data-wardrobe-section="clothes">
            <div class="wardrobe-section-heading"><div><small>COLEÇÃO</small><h3>As minhas roupas</h3></div><span>0 peças iniciais</span></div>
            <div class="wardrobe-shirt-preview" aria-label="Exemplo visual de uma camisa ainda não adquirida">
              <div class="wardrobe-shirt-art">
                <svg viewBox="0 0 220 190" role="img" aria-label="Ilustração de uma camisa">
                  <defs><linearGradient id="shirtFabric" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f2"/><stop offset="1" stop-color="#aebbb8"/></linearGradient></defs>
                  <path d="M76 24 91 13 Q110 29 129 13 L145 24 195 49 176 91 151 79 151 174 69 174 69 79 44 91 25 49Z" fill="url(#shirtFabric)" stroke="#e6eee9" stroke-width="4" stroke-linejoin="round"/>
                  <path d="M91 13 Q110 47 129 13 L119 52 101 52Z" fill="#d0d9d5" stroke="#8d9c97" stroke-width="2"/>
                  <path d="M110 53V169" stroke="#8d9c97" stroke-width="2" stroke-dasharray="4 5"/>
                  <circle cx="110" cy="75" r="2.5" fill="#64756e"/><circle cx="110" cy="94" r="2.5" fill="#64756e"/><circle cx="110" cy="113" r="2.5" fill="#64756e"/>
                </svg>
              </div>
              <div><strong>CAMISA</strong><span>Exemplo de peça da futura loja</span><small>AINDA NÃO ADQUIRIDA</small></div>
            </div>
            <div id="owned-clothes-list"></div>
            <p class="wardrobe-future-note">A loja de roupas será criada numa próxima etapa. Só poderás usar peças que comprares.</p>
          </div>
          <div class="wardrobe-section" data-wardrobe-section="kits" hidden>
            <div class="wardrobe-section-heading"><div><small>CONJUNTOS GUARDADOS</small><h3>Os meus kits</h3></div><span>Sem limite definido</span></div>
            <div id="personal-kits-list"></div>
            <button type="button" id="save-personal-kit" disabled>＋ GUARDAR ROUPA ATUAL COMO KIT</button>
            <p class="wardrobe-future-note">Poderás guardar vários conjuntos, voltar a vesti-los ou apagá-los. A opção fica disponível depois de teres roupas compradas e equipadas.</p>
          </div>
          <p id="wardrobe-status" role="status"></p>
        </section>
      </div>
    </div>
  `;
  game.appendChild(wardrobePanel);
  wardrobeStatus = wardrobePanel.querySelector('#wardrobe-status');

  const close = () => {
    wardrobePanel.classList.remove('visible');
    wardrobePanel.setAttribute('aria-hidden', 'true');
  };
  openButton.addEventListener('click', () => {
    renderWardrobeProfile();
    wardrobePanel.classList.add('visible');
    wardrobePanel.setAttribute('aria-hidden', 'false');
  });
  wardrobePanel.querySelector('#close-wardrobe').addEventListener('click', close);
  wardrobePanel.addEventListener('click', event => {
    if (event.target === wardrobePanel) close();
  });

  wardrobePanel.querySelectorAll('[data-wardrobe-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.wardrobeTab;
      wardrobePanel.querySelectorAll('[data-wardrobe-tab]').forEach(tab => {
        tab.classList.toggle('active', tab === button);
      });
      wardrobePanel.querySelectorAll('[data-wardrobe-section]').forEach(section => {
        const active = section.dataset.wardrobeSection === selected;
        section.classList.toggle('active', active);
        section.hidden = !active;
      });
    });
  });

  wardrobePanel.querySelector('#save-personal-kit').addEventListener('click', async () => {
    if (!online.isAuthenticated()) {
      wardrobeStatus.textContent = 'Inicia sessão na tua conta para guardar os kits online.';
      return;
    }
    const clothing = { ...(getCurrentAppearance().clothing || {}) };
    if (!Object.keys(clothing).length) {
      wardrobeStatus.textContent = 'Compra e equipa pelo menos uma peça na loja para guardar um kit.';
      return;
    }
    const kitName = window.prompt('Que nome queres dar a este kit?');
    if (!kitName || !kitName.trim()) return;
    const appearance = getCurrentAppearance();
    const kits = Array.isArray(appearance.kits) ? appearance.kits : [];
    const updated = {
      ...appearance,
      kits: [...kits, {
        id: `kit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: kitName.trim().slice(0, 32),
        clothing,
        createdAt: new Date().toISOString()
      }]
    };
    try {
      await online.saveAppearance(updated);
      player.setAppearance(updated);
      wardrobeStatus.textContent = 'Kit pessoal guardado na tua conta.';
      renderWardrobeProfile();
    } catch (error) {
      wardrobeStatus.textContent = error.message || 'Não foi possível guardar o kit.';
    }
  });

  wardrobePanel.querySelector('#personal-kits-list').addEventListener('click', async event => {
    const applyButton = event.target.closest('[data-kit-apply]');
    const deleteButton = event.target.closest('[data-kit-delete]');
    if (!applyButton && !deleteButton) return;
    if (!online.isAuthenticated()) {
      wardrobeStatus.textContent = 'Inicia sessão para gerir os teus kits pessoais.';
      return;
    }
    const appearance = getCurrentAppearance();
    const kits = Array.isArray(appearance.kits) ? [...appearance.kits] : [];
    const index = Number((applyButton || deleteButton).dataset[applyButton ? 'kitApply' : 'kitDelete']);
    if (!Number.isInteger(index) || !kits[index]) return;

    if (applyButton) {
      const updated = { ...appearance, clothing: { ...(kits[index].clothing || {}) } };
      try {
        player.setAppearance(updated);
        await online.saveAppearance(updated);
        wardrobeStatus.textContent = `Kit "${kits[index].name}" aplicado.`;
      } catch (error) {
        wardrobeStatus.textContent = error.message || 'Não foi possível aplicar o kit.';
      }
      return;
    }

    if (!window.confirm(`Apagar o kit "${kits[index].name}"?`)) return;
    kits.splice(index, 1);
    const updated = { ...appearance, kits };
    try {
      await online.saveAppearance(updated);
      wardrobeStatus.textContent = 'Kit apagado.';
      renderWardrobeProfile();
    } catch (error) {
      wardrobeStatus.textContent = error.message || 'Não foi possível apagar o kit.';
    }
  });

  renderWardrobeProfile();
}

createWardrobePanel();
