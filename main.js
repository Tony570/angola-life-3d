
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const $ = s => document.querySelector(s);

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
let selectedPlayer = null;
let onlinePlayers = [];
let money = 2500;
let energy = 100;
let hunger = 100;
let target = null;
let cameraAngle = 0;
let cameraHeight = 9;
let cameraDistance = 17;
let dragging = false;
let lastX = 0;
let lastY = 0;
let walkTime = 0;

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

    <div class="hint">Toca no chão para caminhar · Arrasta para mover a câmara</div>
    <button id="phone-open" class="phone-open hidden">📱 TELEMÓVEL</button>

    <div id="phone-screen" class="phone-screen hidden">
      <div class="phone-top"><span>🇦🇴 ANGOLA LIFE</span><button id="phone-close">✕</button></div>
      <div class="phone-heading">
        <small>O TEU TELEMÓVEL</small>
        <h2 id="phone-player">Olá, jogador!</h2>
        <p id="phone-location">Luanda · Angola</p>
      </div>
      <div class="phone-balance">
        <small>CARTEIRA</small><strong id="phone-money">Kz 2.500</strong>
        <div class="phone-stats">
          <span>⚡ <b id="phone-energy">100%</b></span>
          <span>🍲 <b id="phone-hunger">100%</b></span>
        </div>
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
      </div>
      <div id="phone-app-content" class="phone-app-content">
        <b>Bem-vindo!</b><p>Escolhe uma aplicação.</p>
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
      <div class="eyebrow">A TUA IDENTIDADE</div>
      <h2>Cria o teu personagem</h2>
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
        <form id="chatform">
          <input id="chatinput" maxlength="180" placeholder="Escreve para todos...">
          <button>➤</button>
        </form>
      </section>

      <section id="private-chat" class="chat-section hidden">
        <div class="chat-title">CONVERSA PRIVADA</div>
        <select id="private-player"><option value="">Escolhe um jogador online</option></select>
        <div id="private-status">Escolhe um jogador para conversar.</div>
        <div id="privatelog" class="chatlog"></div>
        <form id="privateform">
          <input id="privateinput" maxlength="1000" placeholder="Mensagem privada..." disabled>
          <button disabled>➤</button>
        </form>
      </section>
      <button id="logout" class="secondary">Terminar sessão</button>
    </div>
  </aside>
</main>
`;

function show(id) {
  ['auth', 'profile', 'gamepanel'].forEach(name =>
    $('#' + name).classList.toggle('hidden', name !== id)
  );
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  }[c]));
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

$('#phone-open').onclick = () => {
  $('#phone-screen').classList.remove('hidden');
  $('#phone-open').classList.add('hidden');
  target = null;
};

$('#phone-close').onclick = () => {
  $('#phone-screen').classList.add('hidden');
  $('#phone-open').classList.remove('hidden');
};

const appInfo = {
  personagem: ['👤 Personagem', 'O teu personagem está na cidade.'],
  empregos: ['💼 Empregos', 'Procura oportunidades de trabalho.'],
  banco: ['🏦 Banco', 'Saldo disponível: ' + moneyText(money)],
  casas: ['🏠 Casas', 'Explora as casas da cidade.'],
  veiculos: ['🚘 Veículos', 'Os veículos circulam pela cidade.'],
  lojas: ['🛍️ Lojas', 'Visita as lojas de Luanda.'],
  inventario: ['🎒 Inventário', 'O teu inventário está vazio.'],
  mapa: ['🗺️ Mapa', 'Estás em Angola. Explora a cidade 3D.'],
  mensagens: ['💬 Mensagens', 'Usa o chat privado para conversar.']
};

document.querySelectorAll('[data-app]').forEach(button => {
  button.onclick = () => {
    const app = appInfo[button.dataset.app];
    $('#phone-app-content').innerHTML =
      `<b>${safe(app[0])}</b><p>${safe(app[1])}</p>`;
  };
});

// CIDADE 3D
const host = $('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d1e5');
scene.fog = new THREE.Fog('#a9d1e5', 75, 220);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'low-power'
});
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6b785e, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-35, 65, 25);
scene.add(sun);

const material = color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  material('#c8b58c')
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
scene.add(ground);

function road(x, z, width, depth, horizontal = false) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(
      horizontal ? depth : width,
      horizontal ? width : depth
    ),
    material('#343b40')
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.01, z);
  scene.add(mesh);

  for (let p = -depth / 2 + 4; p < depth / 2; p += 9) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(
        horizontal ? 3 : 0.18,
        horizontal ? 0.18 : 3
      ),
      material('#f4d98a')
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(
      x + (horizontal ? p : 0),
      0.025,
      z + (horizontal ? 0 : p)
    );
    scene.add(line);
  }
}

road(0, 0, 13, 210);
road(-48, 0, 11, 210);
road(48, 0, 11, 210);
road(0, -52, 11, 210, true);
road(0, 52, 11, 210, true);

function building(x, z, w, d, h, color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  body.position.y = h / 2;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2),
    material('#74513e')
  );
  roof.position.y = h + 0.15;
  group.add(roof);

  const windows = material('#9ac8d0');
  for (let y = 1.5; y < h - 1; y += 2.5) {
    for (let wx = -w / 2 + 1; wx < w / 2 - 0.5; wx += 1.8) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.9, 0.07),
        windows
      );
      win.position.set(wx, y, d / 2 + 0.05);
      group.add(win);
    }
  }
  group.position.set(x, 0, z);
  scene.add(group);
}

const colors = ['#d9a36b', '#d77b58', '#e7d7b6', '#c9a47d', '#b9c2bf'];
for (let z = -88; z <= 88; z += 22) {
  for (const side of [-1, 1]) {
    building(
      side * 20, z, 9, 9, 8 + Math.random() * 13,
      colors[Math.floor(Math.random() * colors.length)]
    );
    building(
      side * 36, z + 7, 9, 10, 12 + Math.random() * 15,
      colors[Math.floor(Math.random() * colors.length)]
    );
  }
}

function tree(x, z, palm = false) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.35, palm ? 5 : 2.5, 8),
    material('#76503a')
  );
  trunk.position.y = palm ? 2.5 : 1.25;
  group.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(palm ? 1.5 : 1.6, 10, 8),
    material('#347344')
  );
  crown.position.y = palm ? 5 : 3;
  crown.scale.y = palm ? 0.35 : 1;
  group.add(crown);
  group.position.set(x, 0, z);
  scene.add(group);
}

for (let z = -90; z <= 90; z += 15) {
  tree(-9, z, true);
  tree(9, z + 5);
}

function createAvatar(shirtColor = '#24734c', skinColor = '#8e573d') {
  const group = new THREE.Group();
  const skin = material(skinColor);
  const shirt = material(shirtColor);
  const pants = material('#263c58');


// PERSONAGENS 3D MELHORADOS
function createAvatar(shirtColor = '#24734c', skinColor = '#8e573d') {
  const group = new THREE.Group();

  const material = (color, roughness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const skin = material(skinColor);
  const darkSkin = material('#352019');
  const shirt = material(shirtColor);
  const pants = material('#202b3d');
  const shoes = material('#171719');
  const hair = material('#17100e');
  const white = material('#fff8ed');
  const black = material('#171313');
  const lips = material('#713c38');

  function part(geometry, mat, x, y, z, parent = group) {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // Corpo e pescoço
  part(new THREE.CapsuleGeometry(0.37, 0.65, 6, 12),
    shirt, 0, 1.43, 0);

  part(new THREE.CylinderGeometry(0.13, 0.15, 0.25, 12),
    skin, 0, 1.92, 0);

  // Cabeça
  part(new THREE.SphereGeometry(0.34, 24, 20),
    skin, 0, 2.27, 0);

  // Orelhas
  for (const side of [-1, 1]) {
    part(new THREE.SphereGeometry(0.085, 12, 10),
      skin, side * 0.34, 2.27, 0);

    part(new THREE.SphereGeometry(0.035, 10, 8),
      darkSkin, side * 0.365, 2.27, 0.035);
  }

  // Cabelo e penteado
  const hairCap = part(
    new THREE.SphereGeometry(0.355, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    hair, 0, 2.39, 0
  );

  // Volume superior do cabelo
  part(new THREE.SphereGeometry(0.29, 18, 12),
    hair, 0, 2.52, -0.025);

  // Sobrancelhas, olhos e pálpebras
  for (const side of [-1, 1]) {
    part(new THREE.BoxGeometry(0.13, 0.035, 0.045),
      hair, side * 0.12, 2.37, 0.285);

    part(new THREE.SphereGeometry(0.065, 14, 12),
      white, side * 0.12, 2.29, 0.285);

    part(new THREE.SphereGeometry(0.034, 12, 10),
      black, side * 0.12, 2.29, 0.34);

    part(new THREE.SphereGeometry(0.012, 8, 8),
      white, side * 0.11, 2.305, 0.365);
  }

  // Nariz
  part(new THREE.SphereGeometry(0.065, 12, 12),
    skin, 0, 2.22, 0.325);

  part(new THREE.SphereGeometry(0.035, 10, 8),
    skin, 0, 2.19, 0.355);

  // Boca e lábios
  part(new THREE.BoxGeometry(0.13, 0.025, 0.025),
    lips, 0, 2.12, 0.316);

  // Barba discreta
  const beard = part(
    new THREE.SphereGeometry(0.25, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.25),
    hair, 0, 2.08, 0.08
  );
  beard.scale.set(1, 0.7, 0.7);

  // Roupa: gola
  part(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16),
    material('#e8e2d8'), 0, 1.83, 0);

  // Braços, mãos, pernas e sapatos
  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 0.91, 0);
    group.add(leg);

    part(new THREE.CapsuleGeometry(0.16, 0.52, 5, 10),
      pants, 0, -0.28, 0, leg);

    part(new THREE.BoxGeometry(0.27, 0.15, 0.4),
      shoes, 0, -0.68, 0.09, leg);

    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.66, 0);
    group.add(arm);

    part(new THREE.CapsuleGeometry(0.115, 0.48, 5, 10),
      shirt, 0, -0.28, 0, arm);

    part(new THREE.SphereGeometry(0.115, 12, 10),
      skin, 0, -0.58, 0, arm);

    arms.push(arm);
  }

  // Detalhes da roupa
  part(new THREE.BoxGeometry(0.12, 0.3, 0.025),
    material('#e8d7a2'), 0, 1.49, 0.36);

  // Altura e proporções
  group.scale.set(1, 1, 1);

  group.userData = { legs, arms };
  return group;
}

const avatar = createAvatar();
avatar.position.set(0, 0, 5);
scene.add(avatar);

// Peões espalhados pela cidade
const npcs = [];
const npcShirts = [
  '#c63f35', '#315b9a', '#e0b13e',
  '#4d8054', '#8b4e9c', '#eeeeee',
  '#252525', '#d17c45'
];

for (let i = 0; i < 12; i++) {
  const npc = createAvatar(
    npcShirts[i % npcShirts.length],
    ['#75452f', '#9b6748', '#593a2b', '#b47c58'][i % 4]
  );

  npc.position.set(
    (i % 2 ? 1 : -1) * (12 + Math.random() * 27),
    0,
    -75 + i * 13
  );

  npc.rotation.y = Math.random() * Math.PI * 2;
  scene.add(npc);
  npcs.push({ npc, phase: Math.random() * 6 });
}

  npcs.push({ npc, phase: Math.random() * 6 });
}

const cars = [];
function createCar(color, x, z) {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.72, 4.2),
    material(color)
  );
  body.position.y = 0.78;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.78, 2.1),
    material('#a9d5e4')
  );
  cabin.position.set(0, 1.45, -0.15);
  car.add(cabin);

  car.position.set(x, 0, z);
  scene.add(car);
  cars.push(car);
}

createCar('#bd3030', -3.5, -90);
createCar('#e6e6df', 3.5, -35);
createCar('#263e65', -3.5, 35);
createCar('#d7a52c', 3.5, 90);

// Câmara: arrastar para rodar e usar a roda para aproximar
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', event => {
  if (!$('#phone-screen').classList.contains('hidden')) return;
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
});

renderer.domElement.addEventListener('pointermove', event => {
  if (!dragging) return;
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  cameraAngle -= dx * 0.006;
  cameraHeight = THREE.MathUtils.clamp(cameraHeight + dy * 0.035, 4, 22);
  lastX = event.clientX;
  lastY = event.clientY;
});

renderer.domElement.addEventListener('pointerup', event => {
  if (!dragging) return;
  const moved = Math.hypot(event.clientX - lastX, event.clientY - lastY);
  dragging = false;

  if (moved > 8 || !$('#phone-screen').classList.contains('hidden')) return;

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

renderer.domElement.addEventListener('wheel', event => {
  cameraDistance = THREE.MathUtils.clamp(
    cameraDistance + event.deltaY * 0.015, 8, 35
  );
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
    } else {
      target = null;
    }
  }

  if (moving) {
    walkTime += 0.18;
    const swing = Math.sin(walkTime) * 0.5;
    avatar.userData.legs[0].rotation.x = swing;
    avatar.userData.legs[1].rotation.x = -swing;
    avatar.userData.arms[0].rotation.x = -swing;
    avatar.userData.arms[1].rotation.x = swing;
  } else {
    [...avatar.userData.legs, ...avatar.userData.arms]
      .forEach(part => { part.rotation.x *= 0.8; });
  }

  cars.forEach(car => {
    car.position.z += 0.16;
    if (car.position.z > 110) car.position.z = -110;
  });

  npcs.forEach(item => {
    item.phase += 0.015;
    item.npc.position.x += Math.sin(item.phase) * 0.008;
    item.npc.position.z += Math.cos(item.phase) * 0.008;
  });

  camera.position.x = avatar.position.x + Math.sin(cameraAngle) * cameraDistance;
  camera.position.z = avatar.position.z + Math.cos(cameraAngle) * cameraDistance;
  camera.position.y = cameraHeight + 5;
  camera.lookAt(avatar.position.x, 1, avatar.position.z);

  renderer.render(scene, camera);
}

animate();

// AUTENTICAÇÃO
async function auth(mode) {
  if (!supabase) {
    $('#authmsg').textContent = 'Supabase não está configurado.';
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
    $('#authmsg').textContent = 'Confirma o email e depois inicia sessão.';
    return;
  }

  await afterAuth();
}

async function afterAuth() {
  if (!supabase || !user) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

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
  if (!nickname || !user || !supabase) return;

  const row = {
    id: user.id,
    nickname,
    province: $('#province').value
  };

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
  const row = document.createElement('div');
  row.className = 'chat-message';
  const time = new Date(createdAt).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  row.innerHTML =
    `<div><b>${safe(nickname)}</b><time>${time}</time></div><p>${safe(message)}</p>`;

  $('#chatlog').appendChild(row);
  while ($('#chatlog').children.length > 80) {
    $('#chatlog').removeChild($('#chatlog').firstChild);
  }
  $('#chatlog').scrollTop = $('#chatlog').scrollHeight;
}

async function loadCityMessages() {
  const { data, error } = await supabase
    .from('world_chat')
    .select('nickname,message,created_at')
    .order('created_at', { ascending: true })
    .limit(60);

  if (error) {
    $('#chatlog').textContent = 'Histórico indisponível.';
    return;
  }

  $('#chatlog').innerHTML = '';
  (data || []).forEach(row =>
    addCityMessage(row.nickname, row.message, row.created_at)
  );
}

async function sendCityMessage(message) {
  const clean = message.trim();
  if (!clean || !user || !profile) return;

  const { error } = await supabase.from('world_chat').insert({
    user_id: user.id,
    nickname: profile.nickname,
    message: clean
  });

  if (error) {
    addCityMessage('Sistema', 'Não foi possível enviar a mensagem.');
    return;
  }

  if (channel) {
    await channel.send({
      type: 'broadcast',
      event: 'city-message',
      payload: {
        user_id: user.id,
        nickname: profile.nickname,
        message: clean,
        created_at: new Date().toISOString()
      }
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

// JOGADORES ONLINE
function refreshPlayers() {
  if (!channel) return;

  const state = channel.presenceState();
  const map = new Map();

  Object.values(state).flat().forEach(player => {
    if (player.user_id && player.user_id !== user?.id) {
      map.set(player.user_id, player);
    }
  });

  onlinePlayers = [...map.values()];
  $('#count').textContent = onlinePlayers.length + (user ? 1 : 0);

  const own = profile
    ? `<div class="player">🟢 ${safe(profile.nickname)} <small>(Tu)</small></div>`
    : '';

  const others = onlinePlayers.map(player =>
    `<button class="player player-select" data-user="${safe(player.user_id)}">
      🟢 ${safe(player.nickname || 'Jogador')} <small>Conversar</small>
    </button>`
  ).join('');

  $('#players').innerHTML =
    own + (others || '<div class="player">Ainda não há outros jogadores online.</div>');

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
      `<option value="${safe(player.user_id)}">${safe(player.nickname || 'Jogador')}</option>`
    ).join('');

  if (onlinePlayers.some(p => p.user_id === current)) select.value = current;
}

// CHAT PRIVADO
async function selectPrivatePlayer(playerId) {
  selectedPlayer = onlinePlayers.find(p => p.user_id === playerId) || null;

  $('#privatelog').innerHTML = '';
  $('#privateinput').disabled = !selectedPlayer;
  $('#privateform button').disabled = !selectedPlayer;

  if (!selectedPlayer) {
    $('#private-status').textContent = 'Escolhe um jogador online.';
    return;
  }

  $('#private-status').textContent =
    'Conversa privada com ' + selectedPlayer.nickname;

  await loadPrivateMessages();
}

async function loadPrivateMessages() {
  if (!selectedPlayer || !user) return;

  const otherId = selectedPlayer.user_id;

  const { data, error } = await supabase
    .from('private_messages')
    .select('id,sender_id,recipient_id,message,created_at')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    $('#private-status').textContent = 'Erro ao carregar mensagens.';
    return;
  }

  $('#privatelog').innerHTML = '';
  (data || []).forEach(addPrivateMessage);
}

function addPrivateMessage(row) {
  const item = document.createElement('div');
  const mine = row.sender_id === user?.id;
  item.className = 'private-message ' + (mine ? 'mine' : 'theirs');

  const time = new Date(row.created_at).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  item.innerHTML =
    `<small>${mine ? 'Tu' : safe(selectedPlayer?.nickname || 'Jogador')} · ${time}</small>
     <p>${safe(row.message)}</p>`;

  $('#privatelog').appendChild(item);
  $('#privatelog').scrollTop = $('#privatelog').scrollHeight;
}

$('#private-player').onchange = event => {
  if (event.target.value) selectPrivatePlayer(event.target.value);
  else {
    selectedPlayer = null;
    $('#private-status').textContent = 'Escolhe um jogador para conversar.';
    $('#privatelog').innerHTML = '';
    $('#privateinput').disabled = true;
    $('#privateform button').disabled = true;
  }
};

$('#privateform').onsubmit = async event => {
  event.preventDefault();
  const message = $('#privateinput').value.trim();
  if (!message || !selectedPlayer || !user) return;

  const { data, error } = await supabase
    .from('private_messages')
    .insert({
      sender_id: user.id,
      recipient_id: selectedPlayer.user_id,
      message
    })
    .select('id,sender_id,recipient_id,message,created_at')
    .single();

  if (error) {
    $('#private-status').textContent = 'Não foi possível enviar a mensagem.';
    return;
  }

  addPrivateMessage(data);
  $('#privateinput').value = '';
};

// SEPARADORES
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
    }, ({ new: row }) => {
      if (selectedPlayer && row.sender_id === selectedPlayer.user_id) {
        addPrivateMessage(row);
      }
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
  if (supabase) await supabase.auth.signOut();

  user = null;
  profile = null;
  channel = null;
  selectedPlayer = null;
  onlinePlayers = [];

  $('#phone-open').classList.add('hidden');
  $('#phone-screen').classList.add('hidden');
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
