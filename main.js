
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const $ = (selector) => document.querySelector(selector);

const supabaseReady = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const supabase = supabaseReady
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : null;

let user = null;
let profile = null;
let channel = null;
let money = 2500;
let hunger = 100;
let energy = 100;
let target = null;
let walkTime = 0;
let selectedPlayer = null;
let privateChannel = null;
let cityMessages = [];
let onlinePlayers = [];

$('#app').innerHTML = `
<header class="topbar">
  <div class="brand">
    <span class="flag">🇦🇴</span>
    <div><b>ANGOLA LIFE <i>3D</i></b><small>O teu mundo. A tua vida.</small></div>
  </div>
  <div class="status"><span class="dot"></span><span id="online">A ligar...</span></div>
</header>

<main>
  <section class="scene-wrap">
    <div id="scene"></div>
    <div class="scene-label"><b>LUANDA · ANGOLA</b><span>Explora a cidade</span></div>
    <div class="hud">
      <div><small>DINHEIRO</small><b id="money">Kz 2.500</b></div>
      <div><small>ENERGIA</small><b id="energy">100%</b></div>
      <div><small>FOME</small><b id="hunger">100%</b></div>
    </div>
    <div class="hint">Toca no chão para caminhar</div>
    <button id="phone-open" class="phone-open hidden">📱 <span>TELEMÓVEL</span></button>

    <div id="phone-screen" class="phone-screen hidden">
      <div class="phone-top"><span>🇦🇴 ANGOLA LIFE</span><button id="phone-close">✕</button></div>
      <div class="phone-heading">
        <small>O TEU TELEMÓVEL</small>
        <h2 id="phone-player">Olá, jogador!</h2>
        <p id="phone-location">Luanda · Angola</p>
      </div>
      <div class="phone-balance">
        <small>CARTEIRA</small><strong id="phone-money">Kz 2.500</strong>
        <div class="phone-stats"><span>⚡ <b id="phone-energy">100%</b></span><span>🍲 <b id="phone-hunger">100%</b></span></div>
      </div>
      <div class="phone-section-title">APLICAÇÕES</div>
      <div class="phone-apps">
        <button data-app="personagem">👤<span>Personagem</span></button>
        <button data-app="empregos">💼<span>Empregos</span></button>
        <button data-app="banco">🏦<span>Banco</span></button>
        <button data-app="casas">🏠<span>Casas</span></button>
        <button data-app="veiculos">🚘<span>Veículos</span></button>
        <button data-app="lojas">🛍️<span>Lojas</span></button>
        <button data-app="inventario">🎒<span>Inventário</span></button>
        <button data-app="mapa">🗺️<span>Mapa</span></button>
        <button data-app="mensagens">💬<span>Mensagens</span></button>
        <button data-app="definicoes">⚙️<span>Definições</span></button>
      </div>
      <div id="phone-app-content" class="phone-app-content">
        <b>Bem-vindo ao teu telemóvel!</b><p>Escolhe uma aplicação para começar.</p>
      </div>
    </div>
  </section>

  <aside class="panel">
    <div id="auth">
      <div class="eyebrow">BEM-VINDO AO MUNDO</div>
      <h1>Entra na tua<br><em>vida virtual.</em></h1>
      <p class="muted">Cria a tua conta para entrares na cidade.</p>
      <label>Email</label><input id="email" type="email" placeholder="teuemail@exemplo.com">
      <label>Palavra-passe</label><input id="password" type="password" placeholder="Mínimo 6 caracteres">
      <button id="signup" class="primary">Criar conta</button>
      <button id="login" class="secondary">Iniciar sessão</button>
      <p id="authmsg" class="message"></p>
    </div>

    <div id="profile" class="hidden">
      <div class="eyebrow">A TUA IDENTIDADE</div><h2>Cria o teu personagem</h2>
      <label>Nome no jogo</label><input id="nickname" maxlength="18" placeholder="Escolhe o teu nome">
      <label>Província inicial</label>
      <select id="province">
        <option>Luanda</option><option>Bengo</option><option>Benguela</option>
        <option>Bié</option><option>Cabinda</option><option>Cuando</option>
        <option>Cuanza Norte</option><option>Cuanza Sul</option><option>Cubango</option>
        <option>Cunene</option><option>Huambo</option><option>Huíla</option>
        <option>Icolo e Bengo</option><option>Malanje</option><option>Moxico</option>
        <option>Moxico Leste</option><option>Namibe</option><option>Uíge</option><option>Zaire</option>
      </select>
      <button id="saveprofile" class="primary">Entrar na cidade</button>
      <p id="profilemsg" class="message"></p>
    </div>

    <div id="gamepanel" class="hidden">
      <div class="eyebrow">A TUA VIDA EM ANGOLA</div>
      <h2 id="playername">Jogador</h2>
      <p class="muted" id="playerprovince">Luanda</p>

      <div class="section-title">JOGADORES ONLINE <span id="count">0</span></div>
      <div id="players" class="players">A aguardar jogadores...</div>

      <div class="chat-tabs">
        <button id="city-tab" class="active">🌍 Cidade</button>
        <button id="private-tab">🔒 Privado</button>
      </div>

      <section id="city-chat" class="chat-section">
        <div class="chat-title">CHAT DA CIDADE</div>
        <div id="chatlog" class="chatlog"></div>
        <form id="chatform"><input id="chatinput" maxlength="180" placeholder="Escreve para todos..."><button>➤</button></form>
      </section>

      <section id="private-chat" class="chat-section hidden">
        <div class="chat-title">CONVERSA PRIVADA</div>
        <select id="private-player"><option value="">Escolhe um jogador online</option></select>
        <div id="private-status">Escolhe um jogador para começar a conversa.</div>
        <div id="privatelog" class="chatlog"></div>
        <form id="privateform"><input id="privateinput" maxlength="1000" placeholder="Mensagem privada..." disabled><button disabled>➤</button></form>
      </section>

      <button id="logout" class="secondary">Terminar sessão</button>
    </div>
  </aside>
</main>
`;

function show(id) {
  ['auth', 'profile', 'gamepanel'].forEach(name => {
    $('#' + name).classList.toggle('hidden', name !== id);
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function moneyText(value) {
  return 'Kz ' + Math.round(value).toLocaleString('pt-PT');
}

function updateStats() {
  $('#money').textContent = moneyText(money);
  $('#energy').textContent = energy + '%';
  $('#hunger').textContent = hunger + '%';
  $('#phone-money').textContent = moneyText(money);
  $('#phone-energy').textContent = energy + '%';
  $('#phone-hunger').textContent = hunger + '%';
}

function openPhone() {
  $('#phone-screen').classList.remove('hidden');
  $('#phone-open').classList.add('hidden');
  target = null;
}
function closePhone() {
  $('#phone-screen').classList.add('hidden');
  $('#phone-open').classList.remove('hidden');
}
$('#phone-open').onclick = openPhone;
$('#phone-close').onclick = closePhone;

const apps = {
  personagem: ['👤 Personagem', 'O teu personagem está na cidade. A personalização avançada será adicionada numa próxima atualização.'],
  empregos: ['💼 Empregos', 'O sistema de profissões será desenvolvido numa próxima atualização.'],
  banco: ['🏦 Banco', 'Saldo atual: ' + moneyText(money)],
  casas: ['🏠 Casas', 'O sistema de compra e arrendamento de casas será desenvolvido numa próxima atualização.'],
  veiculos: ['🚘 Veículos', 'Os veículos circulam pela cidade. A garagem e a condução serão adicionadas numa próxima atualização.'],
  lojas: ['🛍️ Lojas', 'As lojas e compras serão desenvolvidas numa próxima atualização.'],
  inventario: ['🎒 Inventário', 'O teu inventário está preparado para futuras atualizações.'],
  mapa: ['🗺️ Mapa', 'Estás a explorar Luanda, Angola.'],
  mensagens: ['💬 Mensagens', 'Usa os separadores Cidade e Privado no painel para conversar.'],
  definicoes: ['⚙️ Definições', 'Conta do jogador e opções do jogo.']
};

document.querySelectorAll('[data-app]').forEach(button => {
  button.onclick = () => {
    const app = apps[button.dataset.app];
    $('#phone-app-content').innerHTML = `<b>${escapeHtml(app[0])}</b><p>${escapeHtml(app[1])}</p>`;
  };
});

// CIDADE 3D EXPANDIDA
const host = $('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d1e5');
scene.fog = new THREE.Fog('#a9d1e5', 75, 210);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 350);
camera.position.set(0, 18, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6b785e, 2.1));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-35, 65, 25);
scene.add(sun);

const mat = (color, roughness = 0.86) =>
  new THREE.MeshStandardMaterial({ color, roughness });

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  mat('#c8b58c')
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.04;
scene.add(ground);

function road(x, z, width, depth, horizontal = false) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(horizontal ? depth : width, horizontal ? width : depth),
    mat('#343b40')
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.015, z);
  scene.add(mesh);

  const length = horizontal ? depth : depth;
  for (let p = -length / 2 + 4; p < length / 2; p += 9) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(horizontal ? 3 : 0.18, horizontal ? 0.18 : 3),
      mat('#f4d98a')
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(x + (horizontal ? p : 0), 0.035, z + (horizontal ? 0 : p));
    scene.add(line);
  }
}
road(0, 0, 13, 210);
road(-48, 0, 11, 210);
road(48, 0, 11, 210);
road(0, -52, 11, 210, true);
road(0, 52, 11, 210, true);

function building(x, z, w, d, h, color, style = 0) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  body.position.y = h / 2;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.25, 0.35, d + 0.25),
    mat(style === 1 ? '#4c5962' : '#74513e')
  );
  roof.position.y = h + 0.17;
  group.add(roof);

  const windowMat = mat(style === 1 ? '#7cb6c9' : '#9ac8d0', 0.3);
  const cols = Math.max(1, Math.floor(w / 1.8));
  const rows = Math.max(1, Math.floor(h / 2.1));
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.9, 0.07), windowMat);
      win.position.set(-w / 2 + 0.9 + col * 1.7, 1.5 + row * 2, d / 2 + 0.05);
      group.add(win);
    }
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.08), mat('#46372e'));
  door.position.set(0, 0.9, d / 2 + 0.06);
  group.add(door);

  group.position.set(x, 0, z);
  scene.add(group);
}

const buildingColors = ['#d9a36b', '#d77b58', '#e7d7b6', '#c9a47d', '#b9c2bf', '#d4bd91'];
for (let z = -88; z <= 88; z += 22) {
  for (const side of [-1, 1]) {
    const x = side * (17 + Math.random() * 5);
    const height = 7 + Math.random() * 15;
    building(x, z, 8 + Math.random() * 3, 8 + Math.random() * 3, height,
      buildingColors[Math.floor(Math.random() * buildingColors.length)]);
    const x2 = side * (34 + Math.random() * 4);
    building(x2, z + 7, 9, 10, 10 + Math.random() * 18,
      buildingColors[Math.floor(Math.random() * buildingColors.length)], 1);
  }
}

// Árvores e palmeiras
function tree(x, z, palm = false) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(palm ? 0.22 : 0.3, 0.42, palm ? 5 : 2.5, 8),
    mat('#76503a')
  );
  trunk.position.y = palm ? 2.5 : 1.25;
  group.add(trunk);

  if (palm) {
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 4.3, 5),
        mat('#347344')
      );
      leaf.position.y = 5;
      leaf.rotation.z = Math.PI / 2;
      leaf.rotation.y = i * Math.PI * 2 / 7;
      leaf.rotation.x = 0.35;
      group.add(leaf);
    }
  } else {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 8), mat('#4e8050'));
    crown.position.y = 3;
    group.add(crown);
  }
  group.position.set(x, 0, z);
  scene.add(group);
}
for (let z = -90; z <= 90; z += 15) {
  tree(-9, z, z % 2 === 0);
  tree(9, z + 5, z % 3 === 0);
}

// Carros 3D detalhados, em circulação
const trafficCars = [];
function createCar(color, x, z, direction = 1) {
  const car = new THREE.Group();
  const bodyMat = mat(color, 0.35);
  const glassMat = new THREE.MeshStandardMaterial({ color: '#a9d5e4', metalness: 0.2, roughness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.72, 4.2), bodyMat);
  body.position.y = 0.78;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.78, 2.1), glassMat);
  cabin.position.set(0, 1.45, -0.15);
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.12, 1.95), bodyMat);
  roof.position.set(0, 1.86, -0.15);
  car.add(roof);

  for (const side of [-1, 1]) {
    for (const frontBack of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12),
        mat('#17191b')
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.05, 0.48, frontBack * 1.35);
      car.add(wheel);
    }
  }

  const lampMat = new THREE.MeshBasicMaterial({ color: '#fff0bd' });
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.08), lampMat);
    lamp.position.set(side * 0.68, 0.95, 2.13);
    car.add(lamp);
  }

  car.position.set(x, 0, z);
  if (direction < 0) car.rotation.y = Math.PI;
  scene.add(car);
  trafficCars.push({ car, direction, startZ: z });
}
createCar('#bd3030', -3.5, -90, 1);
createCar('#e6e6df', 3.5, -35, 1);
createCar('#263e65', -3.5, 35, 1);
createCar('#d7a52c', 3.5, 90, 1);

// Personagem com roupa, cabelo, rosto, braços e pernas articulados
function createAvatar(shirtColor = '#24734c', skinColor = '#8e573d') {
  const group = new THREE.Group();
  const skin = mat(skinColor);
  const shirt = mat(shirtColor);
  const pants = mat('#263c58');
  const shoes = mat('#201f20');
  const hair = mat('#211714');

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.65, 5, 10), shirt);
  torso.position.y = 1.45;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), skin);
  head.position.y = 2.25;
  group.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hair
  );
  hairCap.position.y = 2.38;
  group.add(hairCap);

  const eyesMat = new THREE.MeshBasicMaterial({ color: '#171313' });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyesMat);
    eye.position.set(side * 0.12, 2.28, 0.31);
    group.add(eye);
  }

  const legs = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.2, 0.85, 0);
    group.add(leg);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.48, 4, 8), pants);
    thigh.position.y = -0.28;
    leg.add(thigh);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.15, 0.4), shoes);
    shoe.position.set(0, -0.7, 0.08);
    leg.add(shoe);
    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.48, 1.65, 0);
    group.add(arm);
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.52, 4, 8), shirt);
    upperArm.position.y = -0.28;
    arm.add(upperArm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skin);
    hand.position.y = -0.58;
    arm.add(hand);
    arms.push(arm);
  }

  group.userData = { legs, arms };
  return group;
}

const avatar = createAvatar();
avatar.position.set(0, 0, 5);
scene.add(avatar);

// Peões NPCs espalhados pela cidade
const npcs = [];
const npcShirts = ['#c63f35', '#315b9a', '#e0b13e', '#4d8054', '#8b4e9c'];
for (let i = 0; i < 12; i++) {
  const npc = createAvatar(npcShirts[i % npcShirts.length], '#75452f');
  npc.position.set((i % 2 ? 1 : -1) * (12 + Math.random() * 27), 0, -75 + i * 13);
  npc.rotation.y = Math.random() * Math.PI * 2;
  scene.add(npc);
  npcs.push({ npc, phase: Math.random() * 6 });
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', event => {
  if (!$('#phone-screen').classList.contains('hidden')) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(ground)[0];
  if (hit) {
    target = hit.point.clone();
    target.x = THREE.MathUtils.clamp(target.x, -100, 100);
    target.z = THREE.MathUtils.clamp(target.z, -100, 100);
  }
});

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();

function animate() {
  requestAnimationFrame(animate);
  let moving = false;

  if (target) {
    const dx = target.x - avatar.position.x;
    const dz = target.z - avatar.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.2) {
      moving = true;
      avatar.position.x += dx / distance * 0.11;
      avatar.position.z += dz / distance * 0.11;
      avatar.rotation.y = Math.atan2(dx, dz);
    } else target = null;
  }

  const parts = avatar.userData;
  if (moving) {
    walkTime += 0.18;
    const swing = Math.sin(walkTime) * 0.5;
    parts.legs[0].rotation.x = swing;
    parts.legs[1].rotation.x = -swing;
    parts.arms[0].rotation.x = -swing;
    parts.arms[1].rotation.x = swing;
  } else {
    [...parts.legs, ...parts.arms].forEach(part => { part.rotation.x *= 0.8; });
  }

  trafficCars.forEach(item => {
    item.car.position.z += item.direction * 0.16;
    if (item.car.position.z > 110) item.car.position.z = -110;
  });

  npcs.forEach(item => {
    item.phase += 0.015;
    item.npc.position.x += Math.sin(item.phase) * 0.008;
    item.npc.position.z += Math.cos(item.phase) * 0.008;
  });

  camera.position.x += (avatar.position.x - camera.position.x) * 0.025;
  camera.position.z += (avatar.position.z + 20 - camera.position.z) * 0.025;
  camera.lookAt(avatar.position.x, 0, avatar.position.z);
  renderer.render(scene, camera);
}
animate();

// AUTENTICAÇÃO E PERFIL
async function auth(mode) {
  if (!supabase) {
    $('#authmsg').textContent = 'Servidor Supabase não configurado.';
    return;
  }

  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!email || password.length < 6) {
    $('#authmsg').textContent = 'Indica email e palavra-passe com pelo menos 6 caracteres.';
    return;
  }

  const result = mode === 'signup'
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  if (result.error) {
    $('#authmsg').textContent = result.error.message;
    return;
  }

  user = result.data.user;
  if (mode === 'signup' && !result.data.session) {
    $('#authmsg').textContent = 'Confirma o email enviado e depois inicia sessão.';
    return;
  }
  await afterAuth();
}

async function afterAuth() {
  if (!supabase || !user) return;
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (error) {
    $('#authmsg').textContent = error.message;
    return;
  }
  profile = data;
  if (profile) enterGame();
  else show('profile');
}

function enterGame() {
  $('#playername').textContent = profile.nickname;
  $('#playerprovince').textContent = profile.province;
  $('#phone-player').textContent = 'Olá, ' + profile.nickname + '!';
  $('#phone-location').textContent = profile.province + ' · Angola';
  $('#phone-open').classList.remove('hidden');
  show('gamepanel');
  updateStats();
  joinWorld();
}

$('#signup').onclick = () => auth('signup');
$('#login').onclick = () => auth('login');

$('#saveprofile').onclick = async () => {
  const nickname = $('#nickname').value.trim();
  if (!nickname) {
    $('#profilemsg').textContent = 'Escolhe um nome para o personagem.';
    return;
  }

  const row = { id: user.id, nickname, province: $('#province').value };
  const { error } = await supabase.from('profiles').upsert(row);
  if (error) {
    $('#profilemsg').textContent = error.message;
    return;
  }
  profile = row;
  enterGame();
};

// CHAT DA CIDADE
function addCityMessage(nickname, message, createdAt = new Date().toISOString()) {
  const log = $('#chatlog');
  const row = document.createElement('div');
  row.className = 'chat-message';
  const time = new Date(createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  row.innerHTML = `<div><b>${escapeHtml(nickname)}</b><time>${time}</time></div><p>${escapeHtml(message)}</p>`;
  log.appendChild(row);
  while (log.children.length > 80) log.removeChild(log.firstChild);
  log.scrollTop = log.scrollHeight;
}

async function loadCityMessages() {
  const { data, error } = await supabase
    .from('world_chat')
    .select('nickname,message,created_at')
    .order('created_at', { ascending: true })
    .limit(60);

  if (error) {
    $('#chatlog').innerHTML = '<p class="chat-note">O histórico ainda não está disponível.</p>';
    return;
  }
  $('#chatlog').innerHTML = '';
  (data || []).forEach(row => addCityMessage(row.nickname, row.message, row.created_at));
}

async function sendCityMessage(message) {
  if (!supabase || !user || !profile) return;
  const clean = message.trim();
  if (!clean) return;

  const { error } = await supabase.from('world_chat').insert({
    user_id: user.id,
    nickname: profile.nickname,
    message: clean
  });

  if (error) {
    $('#chatlog').insertAdjacentHTML('beforeend',
      `<p class="chat-note">Não foi possível enviar: ${escapeHtml(error.message)}</p>`);
    return;
  }

  if (channel) {
    await channel.send({
      type: 'broadcast',
      event: 'city-message',
      payload: { user_id: user.id, nickname: profile.nickname, message: clean, created_at: new Date().toISOString() }
    });
  }
}

$('#chatform').onsubmit = async event => {
  event.preventDefault();
  const input = $('#chatinput');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  await sendCityMessage(message);
};

// JOGADORES ONLINE E CHAT PRIVADO
function refreshPlayers() {
  const state = channel ? channel.presenceState() : {};
  const map = new Map();

  Object.values(state).flat().forEach(player => {
    if (player.user_id && player.user_id !== user?.id) map.set(player.user_id, player);
  });

  onlinePlayers = [...map.values()];
  $('#count').textContent = onlinePlayers.length + (user ? 1 : 0);

  const own = profile ? `<div class="player">🟢 ${escapeHtml(profile.nickname)} <small>(Tu)</small></div>` : '';
  const others = onlinePlayers.map(player =>
    `<button class="player player-select" data-user="${escapeHtml(player.user_id)}">🟢 ${escapeHtml(player.nickname || 'Jogador')} <small>Conversar</small></button>`
  ).join('');

  $('#players').innerHTML = own + (others || '<div class="player">Ainda não há outros jogadores online.</div>');

  $('#players').querySelectorAll('[data-user]').forEach(button => {
    button.onclick = () => {
      $('#private-player').value = button.dataset.user;
      selectPrivatePlayer(button.dataset.user);
      setChatTab('private');
    };
  });

  const select = $('#private-player');
  const current = select.value;
  select.innerHTML = '<option value="">Escolhe um jogador online</option>' +
    onlinePlayers.map(player =>
      `<option value="${escapeHtml(player.user_id)}">${escapeHtml(player.nickname || 'Jogador')}</option>`
    ).join('');
  if (onlinePlayers.some(player => player.user_id === current)) select.value = current;
}

async function selectPrivatePlayer(playerId) {
  selectedPlayer = onlinePlayers.find(player => player.user_id === playerId) || null;
  const input = $('#privateinput');
  const sendButton = $('#privateform button');

  if (!selectedPlayer) {
    $('#private-status').textContent = 'Este jogador já não aparece online. Escolhe outro jogador.';
    input.disabled = true;
    sendButton.disabled = true;
    $('#privatelog').innerHTML = '';
    return;
  }

  $('#private-status').textContent = 'Conversa privada com ' + selectedPlayer.nickname;
  input.disabled = false;
  sendButton.disabled = false;
  await loadPrivateMessages();
}

async function loadPrivateMessages() {
  if (!selectedPlayer || !user) return;
  const otherId = selectedPlayer.user_id;

  const { data, error } = await supabase
    .from('private_messages')
    .select('id,sender_id,recipient_id,message,created_at')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    $('#privatelog').innerHTML = `<p class="chat-note">Erro ao carregar mensagens: ${escapeHtml(error.message)}</p>`;
    return;
  }

  $('#privatelog').innerHTML = '';
  (data || []).forEach(addPrivateMessage);
}

function addPrivateMessage(row) {
  const log = $('#privatelog');
  const mine = row.sender_id === user?.id;
  const item = document.createElement('div');
  item.className = 'private-message ' + (mine ? 'mine' : 'theirs');
  const time = new Date(row.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  item.innerHTML = `<small>${mine ? 'Tu' : escapeHtml(selectedPlayer?.nickname || 'Jogador')} · ${time}</small><p>${escapeHtml(row.message)}</p>`;
  log.appendChild(item);
  log.scrollTop = log.scrollHeight;
}

$('#private-player').onchange = event => {
  if (event.target.value) selectPrivatePlayer(event.target.value);
  else {
    selectedPlayer = null;
    $('#private-status').textContent = 'Escolhe um jogador para começar a conversa.';
    $('#privatelog').innerHTML = '';
    $('#privateinput').disabled = true;
    $('#privateform button').disabled = true;
  }
};

$('#privateform').onsubmit = async event => {
  event.preventDefault();
  const message = $('#privateinput').value.trim();
  if (!message || !selectedPlayer || !user) return;

  const row = {
    sender_id: user.id,
    recipient_id: selectedPlayer.user_id,
    message
  };

  const { data, error } = await supabase
    .from('private_messages')
    .insert(row)
    .select('id,sender_id,recipient_id,message,created_at')
    .single();

  if (error) {
    $('#private-status').textContent = 'Não foi possível enviar: ' + error.message;
    return;
  }

  addPrivateMessage(data);
  $('#privateinput').value = '';
};

// Separadores do chat
function setChatTab(tab) {
  const city = tab === 'city';
  $('#city-chat').classList.toggle('hidden', !city);
  $('#private-chat').classList.toggle('hidden', city);
  $('#city-tab').classList.toggle('active', city);
  $('#private-tab').classList.toggle('active', !city);
}
$('#city-tab').onclick = () => setChatTab('city');
$('#private-tab').onclick = () => setChatTab('private');

// LIGAÇÃO MULTIJOGADOR
async function joinWorld() {
  if (!supabase || !user || channel) return;

  await loadCityMessages();

  channel = supabase.channel('city-luanda', {
    config: {
      presence: { key: user.id },
      broadcast: { self: false }
    }
  });

  channel
    .on('presence', { event: 'sync' }, refreshPlayers)
    .on('broadcast', { event: 'city-message' }, ({ payload }) => {
      if (payload.user_id !== user.id) {
        addCityMessage(payload.nickname, payload.message, payload.created_at);
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'private_messages',
      filter: `recipient_id=eq.${user.id}`
    }, payload => {
      const row = payload.new;
      if (selectedPlayer && row.sender_id === selectedPlayer.user_id) addPrivateMessage(row);
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          nickname: profile.nickname,
          province: profile.province,
          online_at: new Date().toISOString()
        });
        $('#online').textContent = 'Ligado ao mundo online';
        refreshPlayers();
      } else if (status === 'CHANNEL_ERROR') {
        $('#online').textContent = 'Problema de ligação';
      }
    });
}

// SAIR DA CONTA
$('#logout').onclick = async () => {
  if (channel) await supabase.removeChannel(channel);
  if (privateChannel) await supabase.removeChannel(privateChannel);
  if (supabase) await supabase.auth.signOut();

  user = null;
  profile = null;
  channel = null;
  selectedPlayer = null;
  onlinePlayers = [];
  $('#phone-open').classList.add('hidden');
  closePhone();
  show('auth');
};

// RECUPERAR SESSÃO
if (supabase) {
  supabase.auth.getSession().then(async ({ data }) => {
    if (data.session) {
      user = data.session.user;
      await afterAuth();
    }
  });
}

updateStats();


// ============================================
// EXPANSAO VISUAL - CIDADE DE LUANDA
// ============================================
{
  const sidewalk = mat('#c9c1b0');
  const curb = mat('#e7dfcf');
  const metal = mat('#424b50');
  const glass = new THREE.MeshStandardMaterial({
    color: '#75b8ca',
    metalness: 0.25,
    roughness: 0.22
  });

  // PASSEIOS E LANCIS
  function pavement(x, z, width, depth) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.16, depth),
      sidewalk
    );
    p.position.set(x, 0.08, z);
    scene.add(p);
  }

  function curbLine(x, z, width, depth) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.22, depth),
      curb
    );
    c.position.set(x, 0.15, z);
    scene.add(c);
  }

  [-1, 1].forEach(side => {
    pavement(side * 8.3, 0, 3.2, 210);
    curbLine(side * 10, 0, 0.22, 210);
    pavement(side * 42, 0, 3, 210);
    curbLine(side * 43.7, 0, 0.22, 210);
  });

  // PASSADEIRAS
  function crossing(x, z) {
    for (let i = 0; i < 9; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.035, 0.65),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      stripe.position.set(x, 0.12, z + (i - 4) * 0.9);
      scene.add(stripe);
    }
  }

  crossing(0, -10);
  crossing(0, 10);

  // POSTES DE ILUMINACAO
  function lampPost(x, z) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 6, 10),
      metal
    );
    post.position.set(x, 3, z);
    scene.add(post);

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.09, 0.09),
      metal
    );
    arm.position.set(x + 0.55, 5.8, z);
    scene.add(arm);

    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.35),
      new THREE.MeshBasicMaterial({ color: '#ffe6a6' })
    );
    lamp.position.set(x + 1.1, 5.65, z);
    scene.add(lamp);
  }

  for (let z = -90; z <= 90; z += 30) {
    lampPost(-10, z);
    lampPost(10, z);
    lampPost(-44, z);
    lampPost(44, z);
  }

  // LOJAS E COMERCIO
  function createShop(x, z, name, wallColor, signColor) {
    const shop = new THREE.Group();

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(9, 4.5, 7),
      mat(wallColor)
    );
    building.position.y = 2.25;
    shop.add(building);

    const windowShop = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.8, 0.12),
      glass
    );
    windowShop.position.set(0, 1.7, 3.56);
    shop.add(windowShop);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2.2, 0.15),
      mat('#49362a')
    );
    door.position.set(-3.2, 1.1, 3.6);
    shop.add(door);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.75, 0.2),
      mat(signColor)
    );
    sign.position.set(0, 3.85, 3.6);
    shop.add(sign);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 100;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 256, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const letters = new THREE.Mesh(
      new THREE.PlaneGeometry(6.5, 0.6),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    letters.position.set(0, 3.85, 3.72);
    shop.add(letters);

    shop.position.set(x, 0, z);
    scene.add(shop);
  }

  createShop(-18, -18, 'MERCADO', '#d8b78b', '#b94732');
  createShop(18, 18, 'RESTAURANTE', '#d6c29c', '#326b50');
  createShop(-34, 18, 'FARMACIA', '#e5e1d4', '#287b70');
  createShop(34, -18, 'CAFE LUANDA', '#d2a477', '#704b32');

  // TORRES RESIDENCIAIS
  function createTower(x, z, floors, color) {
    const height = floors * 2.4;

    const building = new THREE.Mesh(
      new THREE.BoxGeometry(10, height, 9),
      mat(color)
    );
    building.position.set(x, height / 2, z);
    scene.add(building);

    for (let floor = 0; floor < floors; floor++) {
      for (let side = -1; side <= 1; side++) {
        const windowMesh = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1.35, 0.1),
          glass
        );
        windowMesh.position.set(
          x + side * 2.8,
          1.4 + floor * 2.4,
          z + 4.56
        );
        scene.add(windowMesh);

        const balcony = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.12, 0.65),
          mat('#aeb8b6')
        );
        balcony.position.set(
          x + side * 2.8,
          0.75 + floor * 2.4,
          z + 4.9
        );
        scene.add(balcony);
      }
    }

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(10.3, 0.3, 9.3),
      mat('#59666b')
    );
    roof.position.set(x, height + 0.15, z);
    scene.add(roof);
  }

  createTower(-28, -42, 7, '#d4c3a7');
  createTower(29, 42, 8, '#c7d0cc');
  createTower(-29, 43, 6, '#d5a77d');

  // PRACA CENTRAL
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 0.25, 32),
    mat('#c9bda7')
  );
  plaza.position.set(27, 0.12, 0);
  scene.add(plaza);

  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.6, 0.7, 24),
    mat('#899b9d')
  );
  fountain.position.set(27, 0.55, 0);
  scene.add(fountain);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.85, 2.85, 0.12, 24),
    new THREE.MeshStandardMaterial({
      color: '#65b8c7',
      metalness: 0.25,
      roughness: 0.18
    })
  );
  water.position.set(27, 0.95, 0);
  scene.add(water);

  // BANCOS DA PRACA
  function createBench(x, z) {
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.16, 0.65),
      mat('#79533a')
    );
    seat.position.set(x, 0.65, z);
    scene.add(seat);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.75, 0.14),
      mat('#79533a')
    );
    back.position.set(x, 1.05, z - 0.25);
    scene.add(back);
  }

  createBench(20, -6);
  createBench(34, -6);
  createBench(20, 6);
  createBench(34, 6);

  // CONTENTORES DE LIXO
  function createBin(x, z) {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.32, 0.9, 12),
      mat('#397258')
    );
    body.position.set(x, 0.52, z);
    scene.add(body);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.12, 12),
      mat('#263b34')
    );
    lid.position.set(x, 1.03, z);
    scene.add(lid);
  }

  createBin(-12, -5);
  createBin(12, 42);
  createBin(-12, 65);
  createBin(12, -65);

  // MAIS HABITANTES NA CIDADE
  const shirts = [
    '#e0b54c',
    '#f0e8d8',
    '#27745b',
    '#b84d3b',
    '#416b9b',
    '#754b82'
  ];

  for (let i = 0; i < 14; i++) {
    const npc = createAvatar(
      shirts[i % shirts.length],
      ['#6d412f', '#8a563d', '#a66d4d'][i % 3]
    );

    const side = i % 2 ? 1 : -1;
    npc.position.set(side * (14 + (i % 4) * 5), 0, -62 + i * 9);
    npc.rotation.y = Math.random() * Math.PI * 2;

    scene.add(npc);
    npcs.push({
      npc,
      phase: Math.random() * Math.PI * 2
    });
  }
}

