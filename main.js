
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const $ = (s) => document.querySelector(s);

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

$('#app').innerHTML = `
<header class="topbar">
  <div class="brand">
    <span class="flag">🇦🇴</span>
    <div>
      <b>ANGOLA LIFE <i>3D</i></b>
      <small>O teu mundo. A tua vida.</small>
    </div>
  </div>
  <div class="status"><span class="dot"></span><span id="online">Modo demonstração</span></div>
</header>

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

  <div class="hint">Toca no chão para caminhar</div>

  <button id="phone-open" class="phone-open hidden">
    📱 <span>TELEMÓVEL</span>
  </button>

  <div id="phone-screen" class="phone-screen hidden">
    <div class="phone-top">
      <span>🇦🇴 ANGOLA LIFE</span>
      <button id="phone-close">✕</button>
    </div>

    <div class="phone-heading">
      <small>O TEU TELEMÓVEL</small>
      <h2 id="phone-player">Olá, jogador!</h2>
      <p id="phone-location">Luanda · Angola</p>
    </div>

    <div class="phone-balance">
      <small>CARTEIRA</small>
      <strong id="phone-money">Kz 2.500</strong>
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
      <button data-app="definicoes">⚙️<span>Definições</span></button>
    </div>

    <div id="phone-app-content" class="phone-app-content">
      <b>Bem-vindo ao teu telemóvel!</b>
      <p>Escolhe uma aplicação para começar.</p>
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
    <h2>Cria o teu personagem</h2>
    <label>Nome no jogo</label>
    <input id="nickname" maxlength="18" placeholder="Escolhe o teu nome">
    <label>Província inicial</label>
    <select id="province">
      <option>Luanda</option>
      <option>Bengo</option>
      <option>Benguela</option>
      <option>Bié</option>
      <option>Cabinda</option>
      <option>Cuando</option>
      <option>Cuanza Norte</option>
      <option>Cuanza Sul</option>
      <option>Cubango</option>
      <option>Cunene</option>
      <option>Huambo</option>
      <option>Huíla</option>
      <option>Icolo e Bengo</option>
      <option>Luanda Norte</option>
      <option>Luanda Sul</option>
      <option>Malanje</option>
      <option>Moxico</option>
      <option>Moxico Leste</option>
      <option>Namibe</option>
      <option>Uíge</option>
      <option>Zaire</option>
    </select>
    <button id="saveprofile" class="primary">Entrar na cidade</button>
    <p id="profilemsg" class="message"></p>
  </div>

  <div id="gamepanel" class="hidden">
    <div class="eyebrow">A TUA VIDA EM ANGOLA</div>
    <h2 id="playername">Jogador</h2>
    <p class="muted" id="playerprovince">Luanda</p>

    <div class="section-title">JOGADORES NA CIDADE <span id="count">1</span></div>
    <div id="players" class="players">A aguardar jogadores…</div>

    <div class="section-title">CHAT DA CIDADE</div>
    <div id="chatlog" class="chatlog"></div>
    <form id="chatform">
      <input id="chatinput" maxlength="180" placeholder="Escreve uma mensagem…">
      <button>➤</button>
    </form>

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

function appMessage(title, message) {
  $('#phone-app-content').innerHTML =
    `<b>${title}</b><p>${message}</p>`;
}

const apps = {
  personagem: ['👤 Personagem', 'Aqui ficará a personalização do teu personagem, roupa, cabelo e aparência.'],
  empregos: ['💼 Empregos', 'Aqui ficará a lista de profissões e oportunidades de trabalho.'],
  banco: ['🏦 Banco', 'Aqui ficará a tua carteira, saldo e operações bancárias.'],
  casas: ['🏠 Casas', 'Aqui poderás consultar casas e propriedades disponíveis.'],
  veiculos: ['🚘 Veículos', 'Aqui ficará a garagem e os teus veículos.'],
  lojas: ['🛍️ Lojas', 'Aqui ficarão as lojas, roupas e produtos da cidade.'],
  inventario: ['🎒 Inventário', 'Aqui ficarão os objetos que recolheres ou comprares.'],
  mapa: ['🗺️ Mapa', 'Aqui ficará o mapa das cidades e províncias de Angola.'],
  mensagens: ['💬 Mensagens', 'Usa o chat da cidade para conversar com outros jogadores.'],
  definicoes: ['⚙️ Definições', 'Aqui ficarão as opções da tua conta e do jogo.']
};

document.querySelectorAll('[data-app]').forEach(button => {
  button.onclick = () => {
    const app = apps[button.dataset.app];
    appMessage(app[0], app[1]);
  };
});

// CIDADE 3D
const host = $('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d8e7');
scene.fog = new THREE.Fog('#b9d8e7', 35, 110);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
camera.position.set(0, 15, 22);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'low-power'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6b7b68, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-10, 20, 8);
scene.add(sun);

const material = color => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.88
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  material('#c9b991')
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 110),
  material('#41474c')
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.03;
scene.add(road);

for (let z = -50; z < 55; z += 7) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.025, 3),
    material('#f3df9a')
  );
  line.position.set(0, 0.05, z);
  scene.add(line);
}

function building(x, z, w, d, h, color) {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );
  body.position.set(x, h / 2, z);
  scene.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.12, 0.25, d + 0.12),
    material('#6c5142')
  );
  roof.position.set(x, h + 0.12, z);
  scene.add(roof);

  for (let y = 1.5; y < h - 1; y += 2.1) {
    for (let xx = -w / 2 + 1; xx < w / 2 - 0.4; xx += 1.7) {
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.85, 0.06),
        material('#a8d9df')
      );
      windowMesh.position.set(x + xx, y, z + d / 2 + 0.04);
      scene.add(windowMesh);
    }
  }
}

[
  [-11, -9, 7, 7, 10, '#e2a65e'],
  [-11, 3, 7, 8, 13, '#d87c52'],
  [-11, 17, 7, 7, 8, '#e7d6ad'],
  [11, -10, 7, 8, 12, '#d5a56c'],
  [11, 4, 7, 7, 9, '#c96e50'],
  [11, 18, 7, 8, 14, '#e3c88f'],
  [-20, 0, 7, 9, 8, '#dfc49b'],
  [20, 0, 7, 9, 11, '#d9a56d']
].forEach(args => building(...args));

for (let i = 0; i < 18; i++) {
  const x = (i % 2 ? 1 : -1) * (17 + Math.random() * 8);
  const z = -35 + i * 4.5;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.25, 2),
    material('#765039')
  );
  trunk.position.set(x, 1, z);
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 8, 7),
    material('#4e8152')
  );
  crown.position.set(x, 2.6, z);
  scene.add(crown);
}

// PERSONAGEM
function createAvatar() {
  const group = new THREE.Group();

  const skin = material('#d68b62');
  const shirt = material('#24734c');
  const pants = material('#263c58');
  const shoes = material('#292522');
  const hair = material('#211b19');

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

  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
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
    shoe.position.set(0, -0.75, 0.08);
    leg.add(shoe);
    legs.push(leg);

    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.7, 4, 8),
      side === -1 ? shirt : skin
    );
    arm.position.set(side * 0.52, 1.35, 0);
    group.add(arm);
    arms.push(arm);
  }

  group.userData = { legs, arms };
  return group;
}

const avatar = createAvatar();
avatar.position.set(0, 0, 5);
scene.add(avatar);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', event => {
  if (!$('#phone-screen').classList.contains('hidden')) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(ground)[0];

  if (hit) target = hit.point.clone();
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
      avatar.position.x += dx / distance * 0.09;
      avatar.position.z += dz / distance * 0.09;
      avatar.rotation.y = Math.atan2(dx, dz);
    } else {
      target = null;
    }
  }

  const parts = avatar.userData;

  if (moving) {
    walkTime += 0.18;
    const swing = Math.sin(walkTime) * 0.55;
    parts.legs[0].rotation.x = swing;
    parts.legs[1].rotation.x = -swing;
    parts.arms[0].rotation.x = -swing;
    parts.arms[1].rotation.x = swing;
  } else {
    [...parts.legs, ...parts.arms].forEach(part => {
      part.rotation.x *= 0.8;
    });
  }

  camera.position.x += (avatar.position.x - camera.position.x) * 0.025;
  camera.position.z += (avatar.position.z + 18 - camera.position.z) * 0.025;
  camera.lookAt(avatar.position.x, 0, avatar.position.z);

  renderer.render(scene, camera);
}

animate();

// AUTENTICAÇÃO
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
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    $('#authmsg').textContent = error.message;
    return;
  }

  profile = data;

  if (profile) {
    enterGame();
  } else {
    show('profile');
  }
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

// MULTIJOGADOR E CHAT
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function addChat(name, message) {
  const log = $('#chatlog');
  const p = document.createElement('p');
  p.innerHTML = `<b>${escapeHtml(name)}:</b> ${escapeHtml(message)}`;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

async function joinWorld() {
  if (!supabase || !user || channel) return;

  channel = supabase.channel('city-luanda', {
    config: {
      presence: { key: user.id },
      broadcast: { self: false }
    }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const names = Object.values(channel.presenceState())
        .flat()
        .map(player => player.nickname || 'Jogador');

      $('#count').textContent = names.length;
      $('#players').innerHTML = names
        .map(name => `<div class="player">🟢 ${escapeHtml(name)}</div>`)
        .join('');
    })
    .on('broadcast', { event: 'chat' }, ({ payload }) => {
      addChat(payload.nickname, payload.message);
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
    });
}

$('#chatform').onsubmit = async event => {
  event.preventDefault();

  const message = $('#chatinput').value.trim();
  if (!message || !channel) return;

  await channel.send({
    type: 'broadcast',
    event: 'chat',
    payload: {
      nickname: profile.nickname,
      message
    }
  });

  addChat(profile.nickname, message);
  $('#chatinput').value = '';
};

// AÇÕES BÁSICAS
$('#logout').onclick = async () => {
  if (channel) await supabase.removeChannel(channel);
  if (supabase) await supabase.auth.signOut();

  user = null;
  profile = null;
  channel = null;
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
