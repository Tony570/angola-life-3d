
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import './style.css';

// ==========================================
// ANGOLA LIFE 3D - MOTOR PRINCIPAL
// ==========================================

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
let inCar = false;
let car = null;
let target = null;
let walkTime = 0;
let joystickX = 0;
let joystickY = 0;
let lastNeedUpdate = 0;

const keys = new Set();

// ==========================================
// INTERFACE
// ==========================================

$('#app').innerHTML = `
<div class="topbar">
  <div class="brand">
    <span class="flag">🇦🇴</span>
    <div>
      <b>ANGOLA LIFE <i>3D</i></b>
      <small>O teu mundo. A tua vida.</small>
    </div>
  </div>
  <div class="status">
    <span class="dot"></span>
    <span id="online">Modo offline</span>
  </div>
</div>

<main>
  <section class="scene-wrap">
    <div id="scene"></div>

    <div class="scene-label">
      <b>LUANDA · ANGOLA</b>
      <span>Explora a cidade</span>
    </div>

    <div class="hud">
      <div><small>DINHEIRO</small><b id="money">Kz 2.500</b></div>
      <div><small>ENERGIA</small><b id="energy">100%</b></div>
      <div><small>FOME</small><b id="hunger">100%</b></div>
    </div>

    <div class="hint" id="hint">
      Usa o joystick ou toca no chão para caminhar
    </div>

    <div id="mobile-controls">
      <div id="joystick-base">
        <div id="joystick-knob"></div>
      </div>
    </div>
  </section>

  <aside class="panel">

    <div id="auth">
      <div class="eyebrow">BEM-VINDO AO MUNDO</div>
      <h1>Entra na tua<br><em>vida virtual.</em></h1>
      <p class="muted">Cria a tua conta para entrares na cidade.</p>

      <label>Email</label>
      <input id="email" type="email" placeholder="teuemail@exemplo.com">

      <label>Palavra-passe</label>
      <input id="password" type="password" placeholder="Mínimo 6 caracteres">

      <button id="signup" class="primary">Criar conta</button>
      <button id="login" class="secondary">Iniciar sessão</button>
      <p id="authmsg" class="message"></p>
    </div>

    <div id="profile" class="hidden">
      <div class="eyebrow">A TUA IDENTIDADE</div>
      <h2>Cria o teu jogador</h2>

      <label>Nome no jogo</label>
      <input id="nickname" maxlength="18" placeholder="O teu nome">

      <label>Província</label>
      <select id="province">
        <option>Luanda</option>
        <option>Benguela</option>
        <option>Huíla</option>
        <option>Huambo</option>
        <option>Cabinda</option>
        <option>Namibe</option>
        <option>Malanje</option>
        <option>Uíge</option>
        <option>Zaire</option>
        <option>Cuanza Norte</option>
        <option>Cuanza Sul</option>
        <option>Bié</option>
        <option>Moxico</option>
        <option>Cunene</option>
        <option>Lunda Norte</option>
        <option>Lunda Sul</option>
        <option>Bengo</option>
        <option>Cuando Cubango</option>
      </select>

      <button id="saveprofile" class="primary">Entrar na cidade</button>
      <p id="profilemsg" class="message"></p>
      <button id="logout" class="secondary">Sair</button>
    </div>

    <div id="gamepanel" class="hidden">
      <div class="eyebrow">A TUA VIDA EM ANGOLA</div>
      <h2 id="playername">Jogador</h2>
      <p class="muted" id="playerprovince">Luanda</p>

      <div class="quickgrid">
        <button data-action="work">💼<span>Trabalhar</span></button>
        <button data-action="eat">🍲<span>Comer</span></button>
        <button data-action="home">🏠<span>Casa</span></button>
        <button data-action="car">🚘<span>Veículo</span></button>
      </div>

      <div class="section-title">ESTADO DO JOGADOR</div>
      <div id="player-state" class="muted">Pronto para explorar.</div>

      <div class="section-title">
        JOGADORES ONLINE <span id="count">1</span>
      </div>
      <div id="players" class="players">
        <p class="muted">A aguardar jogadores…</p>
      </div>

      <div class="section-title">CHAT DA CIDADE</div>
      <div id="chatlog" class="chatlog"></div>

      <form id="chatform">
        <input id="chatinput" maxlength="180" placeholder="Escreve uma mensagem…">
        <button type="submit">➤</button>
      </form>

      <button id="logout2" class="secondary">Sair da conta</button>
    </div>

    <div class="footnote">
      Angola Life 3D · Projeto em desenvolvimento
    </div>
  </aside>
</main>
`;

// ==========================================
// CONTROLADORES PARA TELEMÓVEL
// ==========================================

const controlStyle = document.createElement('style');

controlStyle.textContent = `
#mobile-controls {
 position:absolute;
 left:15px;
 bottom:20px;
 width:130px;
 height:130px;
 z-index:10;
 touch-action:none;
}
#joystick-base {
 width:112px;
 height:112px;
 border-radius:50%;
 background:#172d3477;
 border:2px solid #ffffff99;
 display:grid;
 place-items:center;
 touch-action:none;
}
#joystick-knob {
 width:48px;
 height:48px;
 border-radius:50%;
 background:#ffffffdd;
 border:2px solid #345;
 pointer-events:none;
}
#scene canvas {
 display:block;
 touch-action:none;
}
`;

document.head.appendChild(controlStyle);

const joystick = $('#joystick-base');
const knob = $('#joystick-knob');

let joystickPointer = null;

function resetJoystick() {
  joystickX = 0;
  joystickY = 0;
  joystickPointer = null;
  knob.style.transform = 'translate(0px,0px)';
}

function moveJoystick(event) {
  if (joystickPointer !== event.pointerId) return;

  const rect = joystick.getBoundingClientRect();

  let dx = event.clientX - (rect.left + rect.width / 2);
  let dy = event.clientY - (rect.top + rect.height / 2);

  const max = 30;
  const distance = Math.hypot(dx, dy);

  if (distance > max) {
    dx = dx / distance * max;
    dy = dy / distance * max;
  }

  joystickX = dx / max;
  joystickY = dy / max;

  knob.style.transform = `translate(${dx}px,${dy}px)`;
  target = null;
}

joystick.addEventListener('pointerdown', event => {
  event.preventDefault();
  joystickPointer = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  moveJoystick(event);
});

joystick.addEventListener('pointermove', moveJoystick);
joystick.addEventListener('pointerup', resetJoystick);
joystick.addEventListener('pointercancel', resetJoystick);

// ==========================================
// MUNDO 3D
// ==========================================

const host = $('#scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d8e7');
scene.fog = new THREE.Fog('#b9d8e7', 40, 130);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'low-power'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x68745e, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-15, 25, 12);
scene.add(sun);

const mat = color => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.85
});

// CHÃO

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  mat('#c8b78f')
);

ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ESTRADA

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 170),
  mat('#42484d')
);

road.rotation.x = -Math.PI / 2;
road.position.y = 0.03;
scene.add(road);

// LINHAS DA ESTRADA

for (let z = -80; z < 85; z += 7) {
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.03, 3),
    mat('#f5e3a2')
  );

  stripe.position.set(0, 0.06, z);
  scene.add(stripe);
}

// EDIFÍCIOS

function building(x, z, width, depth, height, color) {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    mat(color)
  );

  body.position.set(x, height / 2, z);
  scene.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.2, 0.25, depth + 0.2),
    mat('#70503d')
  );

  roof.position.set(x, height + 0.12, z);
  scene.add(roof);

  for (let y = 1.5; y < height - 1; y += 2.2) {
    for (let xx = -width / 2 + 1; xx < width / 2 - 0.4; xx += 1.7) {
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.85, 0.06),
        mat('#a9dce7')
      );

      windowMesh.position.set(
        x + xx,
        y,
        z + depth / 2 + 0.04
      );

      scene.add(windowMesh);
    }
  }
}

[
  [-12,-10,7,7,10,'#e2a65e'],
  [-12,3,7,8,13,'#d87c52'],
  [-12,17,7,7,8,'#e7d6ad'],
  [12,-10,7,8,12,'#d5a56c'],
  [12,4,7,7,9,'#c96e50'],
  [12,18,7,8,14,'#e3c88f'],
  [-22,0,7,9,8,'#dfc49b'],
  [22,0,7,9,11,'#d9a56d'],
  [-23,23,8,8,12,'#dfb37a'],
  [23,24,8,8,9,'#cf8e61']
].forEach(args => building(...args));

// ÁRVORES

for (let i = 0; i < 35; i++) {
  const x = (i % 2 ? 1 : -1) * (17 + Math.random() * 12);
  const z = -65 + i * 4;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.25, 2),
    mat('#765039')
  );

  trunk.position.set(x, 1, z);
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 8, 7),
    mat('#4e8152')
  );

  crown.position.set(x, 2.6, z);
  scene.add(crown);
}

// ==========================================
// PERSONAGEM
// ==========================================

function createAvatar() {
  const group = new THREE.Group();

  const skin = mat('#a96d4c');
  const shirt = mat('#26734d');
  const pants = mat('#263c58');
  const shoes = mat('#292522');
  const hair = mat('#211b19');

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.65, 5, 10),
    shirt
  );

  torso.position.y = 1.48;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 20, 16),
    skin
  );

  head.position.y = 2.25;
  group.add(head);

  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair
  );

  hairCap.position.y = 2.39;
  group.add(hairCap);

  const waist = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.25, 0.38),
    pants
  );

  waist.position.y = 0.91;
  group.add(waist);

  const arms = [];
  const legs = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.52, 1.72, 0);
    group.add(arm);

    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.42, 4, 8),
      shirt
    );

    upper.position.y = -0.27;
    arm.add(upper);
    arms.push(arm);

    const leg = new THREE.Group();
    leg.position.set(side * 0.22, 0.85, 0);
    group.add(leg);

    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.48, 4, 8),
      pants
    );

    thigh.position.y = -0.29;
    leg.add(thigh);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.15, 0.42),
      shoes
    );

    shoe.position.set(0, -0.7, 0.08);
    leg.add(shoe);
    legs.push(leg);
  }

  group.userData = {
    leftArm: arms[0],
    rightArm: arms[1],
    leftLeg: legs[0],
    rightLeg: legs[1]
  };

  return group;
}

const player = createAvatar();
player.position.set(0, 0, 5);
scene.add(player);

// ==========================================
// VEÍCULO 3D
// ==========================================

function createCar() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.65, 4),
    mat('#c42e25')
  );

  body.position.y = 0.75;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.8, 2),
    mat('#9acbd5')
  );

  cabin.position.set(0, 1.4, -0.2);
  group.add(cabin);

  for (const x of [-0.9, 0.9]) {
    for (const z of [-1.3, 1.3]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12),
        mat('#171717')
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      group.add(wheel);
    }
  }

  return group;
}

car = createCar();
car.position.set(4, 0, 8);
scene.add(car);

// ==========================================
// MOVIMENTO
// ==========================================

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', event => {
  if (inCar) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObject(ground)[0];

  if (hit) target = hit.point.clone();
});

window.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();

  if ([
    'w','a','s','d',
    'arrowup','arrowdown','arrowleft','arrowright'
  ].includes(key)) {
    keys.add(key);
    target = null;
  }
});

window.addEventListener('keyup', event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener('blur', () => {
  keys.clear();
  resetJoystick();
});

// ==========================================
// INTERFACE DE ESTADO
// ==========================================

function updateHUD() {
  $('#money').textContent = `Kz ${money.toLocaleString('pt-PT')}`;
  $('#energy').textContent = `${Math.round(energy)}%`;
  $('#hunger').textContent = `${Math.round(hunger)}%`;
}

function stateMessage(message) {
  $('#player-state').textContent = message;
  $('#hint').textContent = message;
}

function showPanel(id) {
  ['auth', 'profile', 'gamepanel'].forEach(name => {
    $('#' + name).classList.toggle('hidden', name !== id);
  });
}

// ==========================================
// SISTEMA DE TRABALHO
// ==========================================

function work() {
  if (energy < 15) {
    stateMessage('Estás cansado. Vai descansar primeiro.');
    return;
  }

  if (hunger < 10) {
    stateMessage('Estás com fome. Come antes de trabalhar.');
    return;
  }

  const salary = 500;

  money += salary;
  energy = Math.max(0, energy - 15);
  hunger = Math.max(0, hunger - 10);

  updateHUD();

  stateMessage(`Trabalho concluído! Recebeste Kz ${salary}.`);
}

// ==========================================
// SISTEMA DE ALIMENTAÇÃO
// ==========================================

function eat() {
  if (money < 100) {
    stateMessage('Não tens dinheiro suficiente para comprar comida.');
    return;
  }

  if (hunger >= 100) {
    stateMessage('Não tens fome neste momento.');
    return;
  }

  money -= 100;
  hunger = Math.min(100, hunger + 35);

  updateHUD();
  stateMessage('Compraste comida e recuperaste energia.');
}

// ==========================================
// SISTEMA DE CASA
// ==========================================

function goHome() {
  if (inCar) {
    exitCar();
  }

  const distance = player.position.distanceTo(
    new THREE.Vector3(-12, 0, -10)
  );

  if (distance > 2) {
    target = new THREE.Vector3(-12, 0, -10);
    stateMessage('A caminhar para casa…');
    return;
  }

  energy = Math.min(100, energy + 40);
  hunger = Math.max(0, hunger - 5);

  updateHUD();
  stateMessage('Descansaste em casa. Recuperaste energia.');
}

// ==========================================
// SISTEMA DE VEÍCULO
// ==========================================

function toggleCar() {
  if (!inCar) {
    const distance = player.position.distanceTo(car.position);

    if (distance > 3) {
      target = car.position.clone();
      stateMessage('A caminhar até ao veículo…');
      return;
    }

    inCar = true;
    player.visible = false;
    stateMessage('Entraste no veículo. Usa o joystick para conduzir.');
  } else {
    exitCar();
  }
}

function exitCar() {
  inCar = false;
  player.visible = true;

  player.position.set(
    car.position.x + 2,
    0,
    car.position.z
  );

  stateMessage('Saíste do veículo.');
}

// ==========================================
// BOTÕES DO JOGO
// ==========================================

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    if (action === 'work') work();
    if (action === 'eat') eat();
    if (action === 'home') goHome();
    if (action === 'car') toggleCar();
  });
});

// ==========================================
// TAMANHO DO ECRÃ
// ==========================================

function resize() {
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);

  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

if ('ResizeObserver' in window) {
  new ResizeObserver(resize).observe(host);
}

window.addEventListener('resize', resize);
resize();

// ==========================================
// ANIMAÇÃO E CÂMARA
// ==========================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  let moveX = joystickX;
  let moveZ = joystickY;

  if (keys.size) {
    moveX +=
      (keys.has('d') || keys.has('arrowright') ? 1 : 0) -
      (keys.has('a') || keys.has('arrowleft') ? 1 : 0);

    moveZ +=
      (keys.has('s') || keys.has('arrowdown') ? 1 : 0) -
      (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  }

  const length = Math.hypot(moveX, moveZ);
  let moving = false;

  const controlledObject = inCar ? car : player;

  if (length > 0.12) {
    moving = true;

    moveX /= Math.max(1, length);
    moveZ /= Math.max(1, length);

    const speed = (inCar ? 12 : 6) * delta;

    controlledObject.position.x += moveX * speed;
    controlledObject.position.z += moveZ * speed;

    controlledObject.rotation.y = Math.atan2(moveX, moveZ);
    target = null;
  } else if (target && !inCar) {
    const dx = target.x - player.position.x;
    const dz = target.z - player.position.z;
    const distance = Math.hypot(dx, dz);

    if (distance > 0.2) {
      moving = true;

      const step = Math.min(distance, 5.5 * delta);

      player.position.x += dx / distance * step;
      player.position.z += dz / distance * step;

      player.rotation.y = Math.atan2(dx, dz);
    } else {
      target = null;
    }
  }

  if (!inCar) {
    const parts = player.userData;

    if (moving) {
      walkTime += delta * 8;

      const swing = Math.sin(walkTime) * 0.65;

      parts.leftLeg.rotation.x = swing;
      parts.rightLeg.rotation.x = -swing;
      parts.leftArm.rotation.x = -swing * 0.8;
      parts.rightArm.rotation.x = swing * 0.8;
    } else {
      Object.values(parts).forEach(part => {
        part.rotation.x *= 0.82;
      });
    }
  }

  const focus = inCar ? car.position : player.position;

  camera.position.x += (focus.x - camera.position.x) * 0.08;
  camera.position.y += (focus.y + 7.5 - camera.position.y) * 0.08;
  camera.position.z += (focus.z + 11 - camera.position.z) * 0.08;

  camera.lookAt(focus.x, 1.2, focus.z);

  // Necessidades diminuem com o tempo.
  lastNeedUpdate += delta;

  if (lastNeedUpdate >= 10) {
    lastNeedUpdate = 0;

    hunger = Math.max(0, hunger - 1);
    energy = Math.max(0, energy - 0.5);

    updateHUD();
  }

  renderer.render(scene, camera);
}

animate();

// ==========================================
// AUTENTICAÇÃO SUPABASE
// ==========================================

async function authenticate(mode) {
  if (!supabase) {
    $('#authmsg').textContent =
      'Configura primeiro as variáveis do Supabase.';
    return;
  }

  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (!email || password.length < 6) {
    $('#authmsg').textContent =
      'Indica um email e uma palavra-passe com pelo menos 6 caracteres.';
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
    $('#authmsg').textContent =
      'Confirma o email enviado e depois inicia sessão.';
    return;
  }

  await afterAuth();
}

$('#signup').addEventListener('click', () => authenticate('signup'));
$('#login').addEventListener('click', () => authenticate('login'));

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

  if (!profile) {
    showPanel('profile');
    return;
  }

  money = Number(profile.money ?? 2500);

  $('#playername').textContent = profile.nickname;
  $('#playerprovince').textContent = profile.province;

  updateHUD();
  showPanel('gamepanel');

  await joinWorld();
}

// ==========================================
// CRIAR PERFIL
// ==========================================

$('#saveprofile').addEventListener('click', async () => {
  if (!supabase || !user) {
    $('#profilemsg').textContent = 'Inicia sessão primeiro.';
    return;
  }

  const nickname = $('#nickname').value.trim();

  if (nickname.length < 2 || nickname.length > 18) {
    $('#profilemsg').textContent =
      'O nome deve ter entre 2 e 18 caracteres.';
    return;
  }

  const row = {
    id: user.id,
    nickname,
    province: $('#province').value
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row)
    .select()
    .single();

  if (error) {
    $('#profilemsg').textContent = error.message;
    return;
  }

  profile = data;
  money = Number(profile.money ?? 2500);

  $('#playername').textContent = profile.nickname;
  $('#playerprovince').textContent = profile.province;

  updateHUD();
  showPanel('gamepanel');

  await joinWorld();
});

// ==========================================
// MULTIJOGADOR E PRESENÇA
// ==========================================

async function joinWorld() {
  if (!supabase || !user || !profile) return;

  if (channel) {
    await supabase.removeChannel(channel);
  }

  channel = supabase.channel('city-luanda', {
    config: {
      presence: { key: user.id },
      broadcast: { self: false }
    }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();

      const players = Object.values(state).flat();

      $('#count').textContent = String(players.length);

      $('#players').innerHTML = players
        .map(item => `<div class="player">🟢 ${escapeHTML(item.nickname)}</div>`)
        .join('');
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload?.nickname && payload?.message) {
        addChat(payload.nickname, payload.message);
      }
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          nickname: profile.nickname,
          province: profile.province,
          online_at: new Date().toISOString()
        });

        $('#online').textContent = 'Ligado ao mundo online';
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        $('#online').textContent = 'Ligação online indisponível';
      }
    });
}

// ==========================================
// CHAT
// ==========================================

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function addChat(nickname, message) {
  const log = $('#chatlog');

  if (log.querySelector('.muted')) {
    log.innerHTML = '';
  }

  const line = document.createElement('p');

  line.innerHTML =
    `<b>${escapeHTML(nickname)}:</b> ${escapeHTML(message)}`;

  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

$('#chatform').addEventListener('submit', async event => {
  event.preventDefault();

  const message = $('#chatinput').value.trim();

  if (!message || !channel || !profile) return;

  const { error } = await channel.send({
    type: 'broadcast',
    event: 'chat',
    payload: {
      nickname: profile.nickname,
      message
    }
  });

  if (error) {
    addChat('Sistema', 'Não foi possível enviar a mensagem.');
    return;
  }

  addChat(profile.nickname, message);
  $('#chatinput').value = '';
});

// ==========================================
// TERMINAR SESSÃO
// ==========================================

async function logout() {
  if (channel && supabase) {
    await supabase.removeChannel(channel);
  }

  channel = null;
  user = null;
  profile = null;

  if (supabase) {
    await supabase.auth.signOut();
  }

  showPanel('auth');
}

$('#logout').addEventListener('click', logout);
$('#logout2').addEventListener('click', logout);

// ==========================================
// RECUPERAR SESSÃO
// ==========================================

if (supabase) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      $('#authmsg').textContent = error.message;
      return;
    }

    if (data.session) {
      user = data.session.user;
      afterAuth();
    }
  });
}

updateHUD();
