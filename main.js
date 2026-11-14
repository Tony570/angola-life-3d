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
