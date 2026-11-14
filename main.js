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
function goToFloor(floor) {
  if (!activeHouse) return;
  const next = Math.max(0, Math.min(activeHouse.floorCount - 1, Number(floor) || 0));
  activeFloor = next;
  activeHouse.currentFloor = next;
  player.setIndoorFloor(next * activeHouse.floorHeight + 0.16);
  player.teleport(activeHouse.interiorX, activeHouse.interiorZ + 6.2);
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
function enterHouse(house) {
  house.ensureInterior();
  house.interior.visible = true;
  if (house.interiorRoof) house.interiorRoof.visible = false;
  if (house.exterior) house.exterior.visible = false;
  activeHouse = house;
  activeFloor = 0;
  player.setIndoor(true);
  player.setIndoorFloor(0.16);
  player.setColliders(house.colliders);
  player.teleport(house.interiorX, house.interiorZ + 6.2);
  elevatorPanel.hidden = false;
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
  player.setIndoor(false);
  player.setColliders(world.colliders);
  player.teleport(house.entranceX, house.entranceZ + 1.5);
  player.cameraDistance = 7;
  player.updateCamera();
  interactButton.textContent = '🏠 ENTRAR EM CASA';
  districtLocation.textContent = '🏙️ KILAMBA · BAIRRO RESIDENCIAL';
}
function interactWithHouse() {
  if (services.isOpen()) return;
  if (activeHouse) { leaveHouse(); return; }
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
  if (activeHouse || services.isOpen()) return;
  const house = nearestHouse();
  if (house) { interactButton.textContent = '🏠 ENTRAR · '+house.name.toUpperCase(); districtLocation.textContent = '🏢 KILAMBA · '+house.name.toUpperCase(); }
  else { interactButton.textContent = '🏠 ENTRAR EM CASA'; districtLocation.textContent = '🏙️ KILAMBA · BAIRRO RESIDENCIAL'; }
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

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);

  if (started && !services.isOpen()) {
    player.update(delta);
    updateHousePrompt();
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
