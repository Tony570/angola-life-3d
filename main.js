import * as THREE from 'three';
import { Player } from './player.js';
import { createServices } from './services.js';
import { createOnlineAccount } from './online.js';
import { createPlayerPhone } from './player-phone.js';
import { createKilambaDistrict } from './kilamba.js';
import { createHouseSystem } from './kilamba-apartments.js';
import { createReceptionist } from './people.js';
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
    <button data-key="s" aria-label="Recuar">▼</button>
    <div>
      <button data-key="a" aria-label="Esquerda">◀</button>
      <button data-key="w" aria-label="Avançar">▲</button>
      <button data-key="d" aria-label="Direita">▶</button>
    </div>
  </div>

  <div id="help">USA W A S D OU OS BOTÕES PARA MOVER O PERSONAGEM · ARRASTA O ECRÃ PARA RODAR A CÂMARA</div>
</div>
`;

const game = document.querySelector('#game');
const scene = new THREE.Scene();
// Céu diurno realista de Luanda: azul profundo no alto, horizonte quente e nuvens suaves.
scene.background = new THREE.Color('#9bc9e6');
scene.fog = new THREE.Fog('#c6dfeb', 210, 680);

const skyCanvas = document.createElement('canvas');
skyCanvas.width = 2048;
skyCanvas.height = 1024;
const skyContext = skyCanvas.getContext('2d');
const skyGradient = skyContext.createLinearGradient(0, 0, 0, 1024);
skyGradient.addColorStop(0, '#145b9d');
skyGradient.addColorStop(0.32, '#3f91c9');
skyGradient.addColorStop(0.62, '#8fc5e3');
skyGradient.addColorStop(0.82, '#d9d9d0');
skyGradient.addColorStop(1, '#f3c99b');
skyContext.fillStyle = skyGradient;
skyContext.fillRect(0, 0, 2048, 1024);

// Nuvens cumuliformes claras, com bordas difusas e sombras muito subtis.
for (let cloud = 0; cloud < 34; cloud++) {
  const cx = ((cloud * 317) % 2300) - 120;
  const cy = 330 + ((cloud * 97) % 310);
  const width = 95 + ((cloud * 43) % 125);
  const height = 22 + ((cloud * 17) % 34);
  const puffCount = 5 + (cloud % 5);
  for (let puff = 0; puff < puffCount; puff++) {
    const px = cx + (puff - puffCount / 2) * width * 0.22;
    const py = cy + Math.sin(puff * 1.7 + cloud) * height * 0.32;
    const radius = height * (0.75 + ((puff * 13 + cloud) % 30) / 55);
    const puffGradient = skyContext.createRadialGradient(px, py, 2, px, py, radius * 1.8);
    puffGradient.addColorStop(0, 'rgba(255,255,255,0.48)');
    puffGradient.addColorStop(0.58, 'rgba(255,255,255,0.25)');
    puffGradient.addColorStop(1, 'rgba(255,255,255,0)');
    skyContext.fillStyle = puffGradient;
    skyContext.beginPath();
    skyContext.ellipse(px, py, radius * 1.65, radius, 0, 0, Math.PI * 2);
    skyContext.fill();
  }
}
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;
skyTexture.mapping = THREE.EquirectangularReflectionMapping;
const skyDome = new THREE.Mesh(
  new THREE.SphereGeometry(950, 40, 24),
  new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, depthWrite: false, fog: false })
);
skyDome.renderOrder = -1000;
scene.add(skyDome);

// Sol quente e halo atmosférico no horizonte.
const sunCanvas = document.createElement('canvas');
sunCanvas.width = 256;
sunCanvas.height = 256;
const sunContext = sunCanvas.getContext('2d');
const sunGlow = sunContext.createRadialGradient(128, 128, 8, 128, 128, 126);
sunGlow.addColorStop(0, 'rgba(255,250,225,1)');
sunGlow.addColorStop(0.16, 'rgba(255,239,190,0.96)');
sunGlow.addColorStop(0.38, 'rgba(255,218,145,0.42)');
sunGlow.addColorStop(1, 'rgba(255,205,130,0)');
sunContext.fillStyle = sunGlow;
sunContext.fillRect(0, 0, 256, 256);
const sunTexture = new THREE.CanvasTexture(sunCanvas);
const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
  map: sunTexture, color: 0xffffff, transparent: true, depthWrite: false, fog: false
}));
sunDisc.position.set(-390, 245, -720);
sunDisc.scale.set(145, 145, 1);
sunDisc.renderOrder = -900;
scene.add(sunDisc);

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

scene.add(new THREE.HemisphereLight('#e8f5ff', '#8b765d', 2.05));
const sun = new THREE.DirectionalLight('#fff0d2', 1.7);
sun.position.set(-390, 245, -720);
sun.castShadow = false;
scene.add(sun);

// Bairro Kilamba: ruas, passeios, jardins e exatamente dez blocos habitáveis.
const world = createKilambaDistrict(scene);
const houses = createHouseSystem(scene, world);

const player = new Player(scene, camera, world.vehicles);
player.setColliders(world.colliders);
// A câmara fica livre para mostrar a cidade; não bloquear a vista com fachadas dos edifícios.

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
// Deteção por UA e por ponteiro: alguns navegadores Android não identificam
// corretamente o modelo do aparelho no userAgent.
const hasTouchControls = isMobile || window.matchMedia('(pointer: coarse)').matches;
if (hasTouchControls) {
  mobileControls.style.display = 'flex';
  mobileControls.style.zIndex = '50';
  mobileControls.style.pointerEvents = 'auto';
}
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
homePanel.innerHTML = ['<div class="home-tools-heading"><strong>CASA</strong><button type="button" id="close-home-tools">✕</button></div>','<button type="button" id="toggle-decor-mode">🪴 MODO DECORAÇÃO</button>','<div id="decor-catalog" hidden><small>ESCOLHE UM OBJETO</small><div class="decor-items"><button type="button" data-decor="plant">🌿 Planta · 5.000 Kz</button><button type="button" data-decor="table">🪑 Mesa · 40.000 Kz</button><button type="button" data-decor="chair">🛋️ Cadeira · 8.000 Kz</button></div><div class="decor-actions"><button type="button" id="rotate-decor">↻ Rodar</button><button type="button" id="remove-decor">⌫ Apagar último</button></div></div>','<small id="home-tools-help">Aproxima-te dos móveis e usa INTERAGIR.</small>'].join('');
game.appendChild(homePanel);
const decorCatalog = homePanel.querySelector('#decor-catalog');
let decorMode = false, decorRotation = 0, selectedDecor = 'plant';
const decorMaterials = {wood:new THREE.MeshStandardMaterial({color:0x805638,roughness:.82}),green:new THREE.MeshStandardMaterial({color:0x39764a,roughness:.9}),pot:new THREE.MeshStandardMaterial({color:0xa65f3d,roughness:.9}),fabric:new THREE.MeshStandardMaterial({color:0x547b89,roughness:.95})};
function createDecorObject(type) { const group=new THREE.Group(); if(type==='plant'){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,.42,10),decorMaterials.pot);pot.position.y=.21;group.add(pot);const leaves=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),decorMaterials.green);leaves.position.y=.72;leaves.scale.set(.8,1.35,.8);group.add(leaves);}else if(type==='table'){const top=new THREE.Mesh(new THREE.BoxGeometry(1.15,.12,.8),decorMaterials.wood);top.position.y=.78;group.add(top);for(const x of [-.48,.48])for(const z of [-.3,.3]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.09,.75,.09),decorMaterials.wood);leg.position.set(x,.37,z);group.add(leg);}}else{const seat=new THREE.Mesh(new THREE.BoxGeometry(.8,.18,.72),decorMaterials.fabric);seat.position.y=.48;group.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.8,.72,.12),decorMaterials.fabric);back.position.set(0,.82,-.3);group.add(back);for(const x of [-.3,.3])for(const z of [-.25,.25]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.07,.42,.07),decorMaterials.wood);leg.position.set(x,.21,z);group.add(leg);}}group.userData.isPlayerDecoration=true;return group;}
async function placeDecoration(type=selectedDecor) {
  if(!activeHouse||!decorMode||player.sitting)return;
  if(!online.isAuthenticated()) { homePanel.querySelector('#home-tools-help').textContent='Inicia sessão para comprar e guardar móveis.'; return; }
  const property=activeHouse.currentProperty;
  if(!property) { homePanel.querySelector('#home-tools-help').textContent='Este apartamento ainda não te pertence. Compra-o na recepção para o mobilar.'; return; }
  const level=activeHouse.interior.children.find(child=>Math.abs(child.position.y-activeFloor*activeHouse.floorHeight)<.01);
  if(!level)return;
  const catalog={plant:'furniture:Planta decorativa',table:'furniture:Mesa de jantar',chair:'furniture:Cadeira'};
  const itemKey=catalog[type];
  if(!itemKey)return;
  const forward=new THREE.Vector3(Math.sin(player.group.rotation.y),0,Math.cos(player.group.rotation.y));
  const pos=player.group.position.clone().addScaledVector(forward,1.7);
  const x=pos.x-activeHouse.interiorX,z=pos.z-activeHouse.interiorZ;
  if(Math.abs(x)>12.5||Math.abs(z)>12.5)return;
  const record={type,x:x/1.7,z:z/1.7,rotation:decorRotation};
  const previous=Array.isArray(property.interior_data?.furniture)?property.interior_data.furniture:[];
  if(previous.length>=100){homePanel.querySelector('#home-tools-help').textContent='Já atingiste o limite de 100 móveis neste apartamento.';return;}
  try {
    homePanel.querySelector('#home-tools-help').textContent='A comprar o móvel e a guardar no teu apartamento...';
    await online.purchaseItem(itemKey,1);
    await online.saveKilambaFurniture(property.id,[...previous,record]);
    property.interior_data={...(property.interior_data||{}),furniture:[...previous,record]};
    const item=createDecorObject(type);
    item.position.set(record.x,0,record.z);item.rotation.y=record.rotation;item.userData.furnitureRecord=record;
    level.add(item);
    if(!activeHouse.decorations)activeHouse.decorations=[];
    activeHouse.decorations.push(item);
    const data=await online.loadPlayerData();services.syncOnlineData(data);
    homePanel.querySelector('#home-tools-help').textContent='Móvel comprado e colocado. O teu apartamento ficou guardado online.';
  } catch(error) {
    homePanel.querySelector('#home-tools-help').textContent=error.message||'Não foi possível comprar ou guardar o móvel.';
  }
}
homePanel.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.id==='close-home-tools')homePanel.hidden=true;if(button.id==='toggle-decor-mode'){decorMode=!decorMode;decorCatalog.hidden=!decorMode;button.textContent=decorMode?'✓ MODO DECORAÇÃO ATIVO':'🪴 MODO DECORAÇÃO';}if(button.dataset.decor){selectedDecor=button.dataset.decor;placeDecoration(selectedDecor);}if(button.id==='rotate-decor')decorRotation+=Math.PI/4;if(button.id==='remove-decor'&&activeHouse?.decorations?.length){const level=activeHouse.interior.children.find(child=>Math.abs(child.position.y-activeFloor*activeHouse.floorHeight)<.01);const candidates=activeHouse.decorations.filter(item=>item.parent===level);const last=candidates[candidates.length-1];if(last){activeHouse.decorations.splice(activeHouse.decorations.indexOf(last),1);last.parent?.remove(last);const property=activeHouse.currentProperty;if(property&&last.userData.furnitureRecord){const remaining=(property.interior_data?.furniture||[]).filter(item=>item!==last.userData.furnitureRecord);online.saveKilambaFurniture(property.id,remaining).then(()=>{property.interior_data.furniture=remaining;homePanel.querySelector('#home-tools-help').textContent='Último móvel removido e alterações guardadas.';}).catch(error=>{homePanel.querySelector('#home-tools-help').textContent=error.message||'Não foi possível guardar a remoção.';});}}}});

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
  player.setColliders(activeHouse.colliders.filter(item => (item.floor === undefined || item.floor === activeFloor) && (!item._houseDoor || item.door.userData.houseDoorCollider.active)));
}
function goToFloor(floor) {
  if (!activeHouse) return;
  const next = Math.max(0, Math.min(activeHouse.floorCount - 1, Number(floor) || 0));
  activeFloor = next;
  activeHouse.currentFloor = next;
  activeHouse.interior.traverse(child => {
    if(child.userData && Number.isInteger(child.userData.houseFloor)) {
      child.visible = child.userData.houseFloor === next;
    }
  });
  setActiveHouseColliders();
  player.setIndoorFloor(next * activeHouse.floorHeight + 0.16);
  // Câmara próxima, mas livre: o jogador pode rodar e aproximar/afastar a vista.
  player.cameraDistance = 6.2;
  player.cameraHeightAngle = 0.28;
  player.teleport(activeHouse.interiorX, activeHouse.interiorZ + 5.0);
  elevatorLabel.textContent = floorName(next);
  elevatorPanel.querySelectorAll('[data-floor]').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.floor) === next);
  });
  districtLocation.textContent = '🏢 KILAMBA · '+activeHouse.name.toUpperCase()+' · '+floorName(next);
  homePanel.hidden = next === 0;
  activeHouse.currentProperty = null;
  if(next>0 && online.isAuthenticated()) {
    const expectedName=activeHouse.name+' · Piso '+next;
    online.getOwnedProperties().then(properties=>{
      if(!activeHouse || activeFloor!==next)return;
      const property=properties.find(item=>item.property_name===expectedName);
      activeHouse.currentProperty=property||null;
      const help=homePanel.querySelector('#home-tools-help');
      help.textContent=property?'Apartamento teu. Compra os móveis e coloca-os onde quiseres.':'Apartamento disponível para compra. Visita a recepção para o adquirir.';
      if(!property)return;
      const level=activeHouse.interior.children.find(child=>Math.abs(child.position.y-next*activeHouse.floorHeight)<.01);
      if(!level || level.userData.furniturePropertyId===property.id)return;
      level.userData.furniturePropertyId=property.id;
      const placed=Array.isArray(property.interior_data?.furniture)?property.interior_data.furniture:[];
      for(const record of placed){
        if(!['plant','table','chair'].includes(record.type))continue;
        const item=createDecorObject(record.type);item.position.set(Number(record.x)||0,0,Number(record.z)||0);item.rotation.y=Number(record.rotation)||0;item.userData.furnitureRecord=record;level.add(item);
        if(!activeHouse.decorations)activeHouse.decorations=[];activeHouse.decorations.push(item);
      }
    }).catch(error=>{homePanel.querySelector('#home-tools-help').textContent=error.message||'Não foi possível consultar a propriedade.';});
  }
}
elevatorPanel.addEventListener('click', event => {
  const button = event.target.closest('[data-floor]');
  if (button) goToFloor(button.dataset.floor);
});

const receptionPricePanel=document.createElement('section');
receptionPricePanel.id='reception-price-panel';
receptionPricePanel.hidden=true;
receptionPricePanel.innerHTML=`
  <div class="hotel-price-card">
    <button type="button" id="close-hotel-prices" aria-label="Fechar">×</button>
    <small>RECEÇÃO · KILAMBA</small>
    <h2 id="reception-greeting">Bom dia! Seja bem-vindo.</h2>
    <p id="reception-dialogue">Sou da equipa de receção. Posso dar-lhe informações sobre os apartamentos e a hospedagem.</p>
    <div class="reception-dialogue-actions">
      <button type="button" data-reception-info="buy">Comprar apartamento</button>
      <button type="button" data-reception-info="night">Alugar quarto no hotel</button>
      <button type="button" data-reception-info="apartments">Informações dos apartamentos</button>
      <button type="button" data-reception-info="welcome">Voltar ao atendimento</button>
    </div>
    <div id="property-floor-options" hidden>
      <small>ESCOLHE O PISO DO TEU APARTAMENTO</small>
      <div class="property-floor-grid">
        <button type="button" data-buy-floor="1">1.º ANDAR</button>
        <button type="button" data-buy-floor="2">2.º ANDAR</button>
        <button type="button" data-buy-floor="3">3.º ANDAR</button>
        <button type="button" data-buy-floor="4">4.º ANDAR</button>
      </div>
      <small>Preço por apartamento: 500.000 Kz · Compra definitiva</small>
    </div>
    <span id="reception-extra">Escolha o assunto para receber informações do rececionista.</span>
  </div>`;
document.body.appendChild(receptionPricePanel);
const hotelPriceStyle=document.createElement('style');
hotelPriceStyle.textContent=`#reception-price-panel{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:18px;background:rgba(5,12,16,.78);backdrop-filter:blur(5px)}#reception-price-panel[hidden]{display:none!important}.hotel-price-card{position:relative;width:min(420px,94vw);max-height:88vh;overflow:auto;padding:28px 24px;border:1px solid #d7b66f;border-radius:20px;background:linear-gradient(145deg,#f4efe4,#d8cbb5);color:#25332f;box-shadow:0 24px 70px #000b;font-family:Arial,sans-serif}.hotel-price-card small{color:#8a642c;font-size:10px;font-weight:900;letter-spacing:2px}.hotel-price-card h2{margin:10px 0 12px;font-size:23px}.hotel-price-card p{margin:8px 0 12px;color:#4d5b53;font-size:13px;line-height:1.6}.hotel-price-card span{display:block;margin-top:16px;padding-top:13px;border-top:1px solid #b9ad99;color:#62675f;font-size:11px;line-height:1.55}.hotel-price-card #close-hotel-prices{position:absolute;top:12px;right:12px;width:34px;height:34px;border:0;border-radius:50%;background:#263e35;color:#fff;font-size:22px}.reception-dialogue-actions{display:grid;gap:8px;margin-top:18px}.reception-dialogue-actions button{min-height:44px;padding:11px 14px;border:1px solid #b69a68;border-radius:10px;background:linear-gradient(135deg,#24483a,#17372d);color:#fff;text-align:left;font-size:12px;font-weight:800}.reception-dialogue-actions button:last-child{background:#e5ddce;color:#344238}#property-floor-options{margin-top:14px;padding:12px;border:1px solid #b69a68;border-radius:12px;background:#eee5d6}#property-floor-options[hidden]{display:none!important}#property-floor-options>small{display:block;margin:5px 0;color:#6d5631;font-size:10px;font-weight:800;letter-spacing:.5px}.property-floor-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:9px 0}.property-floor-grid button{min-height:42px;border:0;border-radius:8px;background:#24483a;color:#fff;font-size:11px;font-weight:900}.property-floor-grid button:disabled{opacity:.55}`;
document.head.appendChild(hotelPriceStyle);
function openReceptionConversation(index=0) {
  const greeting=receptionPricePanel.querySelector('#reception-greeting');
  const dialogue=receptionPricePanel.querySelector('#reception-dialogue');
  const extra=receptionPricePanel.querySelector('#reception-extra');
  greeting.textContent=index===1?'Olá! Em que posso ajudar?':'Bom dia! Seja bem-vindo.';
  dialogue.textContent='Sou da equipa de receção do Kilamba. Posso explicar os preços e dar informações sobre os apartamentos e a hospedagem.';
  extra.textContent='Escolha o assunto para receber informações do rececionista.';
  receptionPricePanel.hidden=false;
}
receptionPricePanel.querySelector('#close-hotel-prices').addEventListener('click',()=>{receptionPricePanel.hidden=true;});
receptionPricePanel.addEventListener('click',event=>{
  const floorButton=event.target.closest('[data-buy-floor]');
  if(floorButton){
    const floor=Number(floorButton.dataset.buyFloor);
    const dialogue=receptionPricePanel.querySelector('#reception-dialogue');
    const extra=receptionPricePanel.querySelector('#reception-extra');
    const propertyName=(activeHouse?.name || 'Bloco A')+' · Piso '+floor;
    if(!online.isAuthenticated()){
      dialogue.textContent='Para concluir uma compra segura e guardar o apartamento na tua conta, primeiro tens de iniciar sessão.';
      extra.textContent='Abre CONTA no topo do ecrã, entra na tua conta e volta à recepção.';
      const accountPanel=document.querySelector('#account-panel');
      if(accountPanel) accountPanel.style.zIndex='140';
      online.open();
      return;
    }
    floorButton.disabled=true;
    dialogue.textContent='A confirmar a disponibilidade e o pagamento do apartamento...';
    extra.textContent='Não feches esta janela enquanto a compra está a ser processada.';
    online.purchaseKilambaApartment(propertyName,'Kilamba · '+(activeHouse?.name || 'Bloco A'))
      .then(async result=>{
        const data=await online.loadPlayerData();
        services.syncOnlineData(data);
        dialogue.textContent=result?.already_owned
          ? 'Este apartamento já pertence à tua conta.'
          : 'Compra concluída! O apartamento agora pertence-te.';
        extra.textContent=propertyName+' · 500.000 Kz. A propriedade ficou registada na tua conta.';
        floorButton.textContent='✓ ADQUIRIDO';
      })
      .catch(error=>{
        dialogue.textContent=error.message || 'Não foi possível concluir a compra.';
        extra.textContent='Confirma o saldo e tenta novamente. Cada apartamento só pode ter um proprietário.';
        floorButton.disabled=false;
      });
    return;
  }
  const button=event.target.closest('[data-reception-info]');
  if(!button)return;
  const dialogue=receptionPricePanel.querySelector('#reception-dialogue');
  const extra=receptionPricePanel.querySelector('#reception-extra');
  const floorOptions=receptionPricePanel.querySelector('#property-floor-options');
  floorOptions.hidden=button.dataset.receptionInfo!=='buy';
  const messages={
    buy:['Temos apartamentos vazios disponíveis do 1.º ao 4.º andar. Escolhe o piso abaixo para verificar a disponibilidade e concluir a compra na tua conta.','Preço de compra: 500.000 Kz por apartamento. O apartamento comprado fica associado à tua conta.'],
    night:['Temos quartos disponíveis para aluguer no hotel. O preço é 1.000 Kz por noite.','Aluguer de quarto: 1.000 Kz/noite. O pagamento e a reserva serão ativados numa próxima etapa.'],
    apartments:['Temos apartamentos disponíveis para compra nos pisos superiores e quartos de hotel para aluguer.','Compra do apartamento: 500.000 Kz. Aluguer do quarto: 1.000 Kz por noite.'],
    welcome:['Seja bem-vindo ao Kilamba. Estamos disponíveis para ajudar com informações sobre compra e hospedagem.','Em que mais posso ajudar?']
  };
  const message=messages[button.dataset.receptionInfo];
  if(message){dialogue.textContent=message[0];extra.textContent=message[1];}
});
function addReceptionistUniform(group, variant=0) {
  if (!group || group.userData.hotelUniformApplied) return;
  group.userData.hotelUniformApplied = true;

  // createReceptionist já compensa a escala 1,70x do interior.
  // Não voltar a reduzir aqui: isso deixava os rececionistas com metade da altura.

  const looks = [
    {skin:0x875236,hair:0x17110e,eyes:0x392318,uniform:0x172b43,shirt:0xf4f1e9,trousers:0x20252c,hairstyle:1.08,head:1.025},
    {skin:0xa56b49,hair:0x38251c,eyes:0x24170f,uniform:0x29483e,shirt:0xf1e7d8,trousers:0x292b35,hairstyle:0.86,head:0.975}
  ];
  const look=looks[variant%looks.length];
  const skin=new THREE.Color(look.skin);
  const hair=new THREE.Color(look.hair);
  const eyes=new THREE.Color(look.eyes);
  const uniform=new THREE.Color(look.uniform);
  const shirt=new THREE.Color(look.shirt);
  const trousers=new THREE.Color(look.trousers);

  group.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    const names=[object.name,...materials.map(material=>material.name||'')].join(' ').toLowerCase();
    let tint=null;
    if (/hair|cabelo|beard|barba/.test(names)) {
      tint=hair;
      if (!object.userData.baseReceptionHairScale) object.userData.baseReceptionHairScale=object.scale.clone();
      object.scale.copy(object.userData.baseReceptionHairScale);
      object.scale.y*=look.hairstyle;
    } else if (/eye|iris|pupil|olho/.test(names)) {
      tint=eyes;
    } else if (/skin|face|head|body|arm|hand|leg|neck|pele|rosto/.test(names)) {
      tint=skin;
      if (/face|head|rosto/.test(names)) {
        object.scale.x*=look.head;
      }
    } else if (/pant|trouser|jean|bottom|calça/.test(names)) {
      tint=trousers;
    } else if (/shirt|jacket|cloth|uniform|coat|top|blazer|camisa|roupa/.test(names)) {
      tint=uniform;
    }

    if (!tint) return;
    const changed=materials.map(material=>{
      const copy=material.clone();
      if(copy.color) copy.color.copy(tint);
      return copy;
    });
    object.material=Array.isArray(object.material)?changed:changed[0];
  });
}
function ensureHouseResidents(house) {
  if (!house || !house.interior || house.residentsCreated) return;
  house.residentsCreated = true;
  const lobbyFloor = house.interior.children.find(child => child.userData?.houseFloor === 0) || house.interior;

  // Recepção com duas pessoas diferentes: modelos masculino e feminino,
  // ambos normalizados para a mesma altura do personagem do jogador.
  Promise.all([
    createReceptionist(lobbyFloor, {
      role: 'Rececionista',
      gender: 'male',
      x: -4.8, y: 0.16, z: 5.25,
      rotationY: Math.PI,
      outfit: 0x172b43
    }, 0),
    createReceptionist(lobbyFloor, {
      role: 'Rececionista',
      gender: 'female',
      x: -2.1, y: 0.16, z: 5.25,
      rotationY: 0,
      outfit: 0x29483e
    }, 1)
  ]).then(created => {
    house.residents = created.map(npc => ({group:npc.root,mixer:npc.mixer}));
    house.residents.forEach((resident,index) => {
      addReceptionistUniform(resident.group,index);
      resident.group.userData.houseAction = {
        label: 'FALAR COM O RECECIONISTA',
        type: 'reception-agent',
        receptionistIndex: index
      };
      resident.group.userData.receptionist = true;
      if (Array.isArray(house.interactables) && !house.interactables.includes(resident.group)) {
        house.interactables.push(resident.group);
      }
    });
  }).catch(error => {
    house.residentsCreated = false;
    console.error('Não foi possível carregar a equipa da receção:', error);
  });
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
  house.previousCameraYawOffset = player.cameraYawOffset;
  house.previousCameraPitch = player.cameraPitch;
  house.previousCameraHeightAngle = player.cameraHeightAngle;
  activeHouse = house;
  activeFloor = 0;
  player.setIndoor(true);
  // Dentro do hotel, a câmara deve parar nas paredes do próprio interior.
  player.setCameraOccluders([house.interior]);
  player.cameraDistance = 8.0;
  player.cameraHeightAngle = 0.38;
  player.setIndoorFloor(0.16);
  player.setColliders(house.colliders.filter(item => (item.floor === undefined || item.floor === 0) && (!item._houseDoor || item.door.userData.houseDoorCollider.active)));
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
  // Fora do hotel, a câmara volta a ficar livre para mostrar a cidade.
  player.setCameraOccluders([]);
  elevatorPanel.hidden = true;
  homePanel.hidden = true;
  decorMode = false;
  decorCatalog.hidden = true;
  player.setIndoor(false);
  player.cameraYawOffset = house.previousCameraYawOffset ?? 0;
  player.cameraPitch = house.previousCameraPitch ?? 0;
  player.cameraHeightAngle = house.previousCameraHeightAngle ?? 0.42;
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
      if(action.type==='reception'||action.type==='reception-agent'){openReceptionConversation(action.receptionistIndex??0);return;}
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

// Tocar diretamente num rececionista abre o atendimento no telemóvel ou computador.
const receptionistRaycaster = new THREE.Raycaster();
const receptionistPointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerup', event => {
  if (!activeHouse || activeFloor !== 0 || receptionPricePanel.hidden === false) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const rect = renderer.domElement.getBoundingClientRect();
  receptionistPointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  receptionistRaycaster.setFromCamera(receptionistPointer, camera);
  const roots = (activeHouse.residents || []).map(resident => resident.group).filter(Boolean);
  if (!roots.length) return;
  const hits = receptionistRaycaster.intersectObjects(roots, true);
  if (!hits.length) return;
  let target = hits[0].object;
  while (target && !target.userData?.receptionist) target = target.parent;
  if (target?.userData?.receptionist) {
    openReceptionConversation(target.userData.houseAction?.receptionistIndex ?? 0);
  }
});

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
    let nearestDistance = 3.25;
    for (const object of activeHouse.interactables || []) {
      if (!object.visible) continue;
      let floorParent = object;
      while(floorParent && !Number.isInteger(floorParent.userData?.houseFloor)) floorParent = floorParent.parent;
      if(floorParent && floorParent.userData.houseFloor !== activeFloor) continue;
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

// Cada botão gere o seu próprio toque. A libertação é global para evitar
// que uma tecla fique presa quando o Android termina o gesto fora do botão.
const activeMobilePointers = new Map();
function pressMobileControl(button, pointerId) {
  const key = button.dataset.key;
  if (!key) return;
  player.keys[key] = true;
  button.classList.add('pressed');
  if (pointerId !== undefined) activeMobilePointers.set(pointerId, { key, button });
}
function releaseAllMobileControls() {
  for (const { key, button } of activeMobilePointers.values()) {
    player.keys[key] = false;
    button.classList.remove('pressed');
  }
  activeMobilePointers.clear();
  mobileControls.querySelectorAll('[data-key].pressed').forEach(button => {
    player.keys[button.dataset.key] = false;
    button.classList.remove('pressed');
  });
}
mobileControls.querySelectorAll('[data-key]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
    pressMobileControl(button, event.pointerId);
  }, { passive: false });
  button.addEventListener('pointerup', releaseAllMobileControls);
  button.addEventListener('pointercancel', releaseAllMobileControls);
  button.addEventListener('lostpointercapture', releaseAllMobileControls);
  // Compatibilidade com navegadores Android antigos que ainda emitem Touch Events.
  button.addEventListener('touchstart', event => {
    event.preventDefault();
    pressMobileControl(button);
  }, { passive: false });
  button.addEventListener('touchend', releaseAllMobileControls, { passive: true });
  button.addEventListener('touchcancel', releaseAllMobileControls, { passive: true });
});
window.addEventListener('pointerup', releaseAllMobileControls);
window.addEventListener('pointercancel', releaseAllMobileControls);
window.addEventListener('touchend', releaseAllMobileControls, { passive: true });
window.addEventListener('touchcancel', releaseAllMobileControls, { passive: true });
window.addEventListener('blur', releaseAllMobileControls);

const clock = new THREE.Clock();

let promptAccumulator = 0;
let renderAccumulator = 0;
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  // Brisa suave: as nuvens deslocam-se lentamente sobre a cidade.
  skyDome.rotation.y += delta * 0.00055;

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
