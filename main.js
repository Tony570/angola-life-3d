
import * as THREE from 'three';
import { createClient } from '@supabase/supabase-js';
import './style.css';

const $ = (s) => document.querySelector(s);

const envReady = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const supabase = envReady
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  : null;

let user = null, profile = null, channel = null, myAvatar = null;
const remote = new Map();

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
    <span id="online">Modo demonstração</span>
  </div>
</div>

<main>
<section class="scene-wrap">
  <div id="scene"></div>
  <div class="scene-label">
    <b>LUANDA · CIDADE CENTRAL</b>
    <span>Explora o teu mundo</span>
  </div>
  <div class="hud">
    <div><small>DINHEIRO</small><b id="money">Kz 2.500</b></div>
    <div><small>ENERGIA</small><b>♥ 100%</b></div>
    <div><small>FOME</small><b>● 100%</b></div>
  </div>
  <div class="hint">Toca no chão para caminhar</div>
</section>

<aside class="panel">
  <div id="auth">
    <div class="eyebrow">BEM-VINDO AO MUNDO</div>
    <h1>Entra na tua<br><em>vida virtual.</em></h1>
    <p class="muted">Cria a tua conta para guardares o personagem e encontrares outros jogadores.</p>
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
    <h2 id="welcome">Olá, jogador</h2>
    <label>Nome no jogo</label>
    <input id="nickname" maxlength="18" placeholder="Escolhe o teu nome">
    <label>Província inicial</label>
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
      <option>Cuando Cubango</option>
      <option>Cunene</option>
      <option>Lunda Norte</option>
      <option>Lunda Sul</option>
      <option>Bengo</option>
    </select>
    <button id="saveprofile" class="primary">Entrar na cidade</button>
    <p id="profilemsg" class="message"></p>
    <button id="logout" class="secondary">Terminar sessão</button>
  </div>

  <div id="gamepanel" class="hidden">
    <div class="eyebrow">A TUA VIDA EM ANGOLA</div>
    <h2 id="playername">Jogador</h2>
    <p class="muted" id="playerprovince">Luanda</p>

    <div class="quickgrid">
      <button data-action="work">💼<span>Trabalhar</span></button>
      <button data-action="eat">🍲<span>Comer</span></button>
      <button data-action="home">🏠<span>Casa</span></button>
      <button data-action="car">🚘<span>Veículos</span></button>
    </div>

    <div class="section-title">
      JOGADORES NA CIDADE <span id="count">1</span>
    </div>
    <div id="players" class="players">
      <p class="muted">A aguardar outros jogadores…</p>
    </div>

    <div class="section-title">CHAT DA CIDADE</div>
    <div id="chatlog" class="chatlog">
      <p class="muted">Entra no mundo para conversar.</p>
    </div>

    <form id="chatform">
      <input id="chatinput" maxlength="180" placeholder="Escreve uma mensagem…">
      <button>➤</button>
    </form>
    <button id="logout2" class="secondary">Sair da conta</button>
  </div>

  <div class="footnote">
    Projeto inicial online · As funções multiplayer ficam activas depois de ligares o teu servidor.
  </div>
</aside>
</main>
`;

// CIDADE 3D
const host = $('#scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9d8e7');
scene.fog = new THREE.Fog('#b9d8e7', 35, 110);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 180);
camera.position.set(0, 15, 22);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'low-power'
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = false;
host.appendChild(renderer.domElement);

scene.add(
  new THREE.HemisphereLight(0xffffff, 0x6b7b68, 2)
);

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-10, 20, 8);
scene.add(sun);

const mat = (c) => new THREE.MeshStandardMaterial({
  color: c,
  roughness: 0.88
});

// CHÃO
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120),
  mat('#c9b991')
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ESTRADA
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 100),
  mat('#41474c')
);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
scene.add(road);

for (let z = -45; z < 50; z += 7) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.025, 3),
    mat('#f3df9a')
  );
  line.position.set(0, 0.05, z);
  scene.add(line);
}

// EDIFÍCIOS
function building(x, z, w, d, h, color) {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat(color)
  );

  b.position.set(x, h / 2, z);
  scene.add(b);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.12, 0.25, d + 0.12),
    mat('#6c5142')
  );

  roof.position.set(x, h + 0.12, z);
  scene.add(roof);

  for (let yy = 1.5; yy < h - 1; yy += 2.1) {
    for (let xx = -w / 2 + 1; xx < w / 2 - 0.4; xx += 1.7) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.85, 0.06),
        mat('#a8d9df')
      );

      win.position.set(x + xx, yy, z + d / 2 + 0.04);
      scene.add(win);
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
].forEach(a => building(...a));

// ÁRVORES
for (let i = 0; i < 16; i++) {
  const x = (i % 2 ? 1 : -1) * (17 + Math.random() * 8);
  const z = -35 + i * 4.5;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.25, 2),
    mat('#765039')
  );

  trunk.position.set(x, 1, z);
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.35, 8, 7),
    mat('#4e8152')
  );

  crown.position.set(x, 2.6, z);
  scene.add(crown);
}

// PERSONAGEM HUMANO 3D
function avatar(color = 0xd68b62) {
  const g = new THREE.Group();

  const skin = mat(color);
  const shirt = mat('#24734c');
  const pants = mat('#263c58');
  const shoes = mat('#292522');
  const hair = mat('#211b19');

  // Tronco
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 0.65, 5, 10),
    shirt
  );
  torso.position.y = 1.48;
  g.add(torso);

  // Cintura
  const waist = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.25, 0.38),
    pants
  );
  waist.position.y = 0.91;
  g.add(waist);

  // Cabeça
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 20, 16),
    skin
  );
  head.position.y = 2.25;
  g.add(head);

  // Cabelo
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55
    ),
    hair
  );
  hairCap.position.y = 2.39;
  g.add(hairCap);

  // Olhos
  for (const x of [-0.13, 0.13]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      mat('#ffffff')
    );
    eye.position.set(x, 2.28, 0.325);
    g.add(eye);
  }

  // Braços
  const arms = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.52, 1.72, 0);
    g.add(arm);

    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.42, 4, 8),
      shirt
    );
    upper.position.y = -0.27;
    arm.add(upper);

    const forearm = new THREE.Group();
    forearm.position.y = -0.49;
    arm.add(forearm);

    const lower = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.105, 0.38, 4, 8),
      skin
    );
    lower.position.y = -0.22;
    forearm.add(lower);

    arms.push({ arm, forearm });
  }

  // Pernas e sapatos
  const legs = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.22, 0.85, 0);
    g.add(leg);

    const thigh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.48, 4, 8),
      pants
    );
    thigh.position.y = -0.29;
    leg.add(thigh);

    const shin = new THREE.Group();
    shin.position.y = -0.57;
    leg.add(shin);

    const calf = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.42, 4, 8),
      pants
    );
    calf.position.y = -0.23;
    shin.add(calf);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.15, 0.42),
      shoes
    );
    shoe.position.set(0, -0.49, 0.08);
    shin.add(shoe);

    legs.push({ leg, shin });
  }

  g.userData = {
    leftArm: arms[0].arm,
    rightArm: arms[1].arm,
    leftForearm: arms[0].forearm,
    rightForearm: arms[1].forearm,
    leftLeg: legs[0].leg,
    rightLeg: legs[1].leg,
    leftShin: legs[0].shin,
    rightShin: legs[1].shin
  };

  return g;
}

myAvatar = avatar();
myAvatar.position.set(0, 0, 5);
scene.add(myAvatar);

// MOVIMENTO POR TOQUE
let target = null;
let walkTime = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

renderer.domElement.addEventListener('pointerdown', e => {
  const r = renderer.domElement.getBoundingClientRect();

  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObject(ground)[0];

  if (hit) {
    target = hit.point.clone();
  }
});

// AJUSTAR ECRÃ
function resize() {
  const w = host.clientWidth;
  const h = host.clientHeight;

  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(host);
resize();

// ANIMAÇÃO DO JOGO
function loop() {
  requestAnimationFrame(loop);

  let moving = false;

  if (target) {
    const dx = target.x - myAvatar.position.x;
    const dz = target.z - myAvatar.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.2) {
      moving = true;

      myAvatar.position.x += dx / dist * 0.09;
      myAvatar.position.z += dz / dist * 0.09;

      myAvatar.rotation.y = Math.atan2(dx, dz);
    } else {
      target = null;
    }
  }

  const p = myAvatar.userData;

  if (moving) {
    walkTime += 0.18;

    const swing = Math.sin(walkTime) * 0.65;

    p.leftLeg.rotation.x = swing;
    p.rightLeg.rotation.x = -swing;

    p.leftArm.rotation.x = -swing * 0.8;
    p.rightArm.rotation.x = swing * 0.8;

    p.leftShin.rotation.x = Math.max(0, -swing) * 0.7;
    p.rightShin.rotation.x = Math.max(0, swing) * 0.7;

    p.leftForearm.rotation.x = 0.15;
    p.rightForearm.rotation.x = 0.15;
  } else {
    for (const key of [
      'leftLeg',
      'rightLeg',
      'leftArm',
      'rightArm',
      'leftShin',
      'rightShin',
      'leftForearm',
      'rightForearm'
    ]) {
      p[key].rotation.x *= 0.8;
    }
  }

  camera.position.x +=
    (myAvatar.position.x - camera.position.x) * 0.025;

  camera.position.z +=
    (myAvatar.position.z + 18 - camera.position.z) * 0.025;

  camera.lookAt(
    myAvatar.position.x,
    0,
    myAvatar.position.z
  );

  renderer.render(scene, camera);
}

loop();

// SISTEMA DE CONTAS
function show(id) {
  ['auth', 'profile', 'gamepanel'].forEach(x => {
    $('#' + x).classList.toggle('hidden', x !== id);
  });
}

async function auth(mode) {
  if (!supabase) {
    $('#authmsg').textContent =
      'Servidor ainda não configurado. Consulta o guia de instalação.';
    return;
  }

  const email = $('#email').value.trim();
  const password = $('#password').value;

  if (!email || password.length < 6) {
    $('#authmsg').textContent =
      'Indica um email e uma palavra-passe com pelo menos 6 caracteres.';
    return;
  }

  const fn = mode === 'signup'
    ? supabase.auth.signUp({ email, password })
    : supabase.auth.signInWithPassword({ email, password });

  const { data, error } = await fn;

  if (error) {
    $('#authmsg').textContent = error.message;
    return;
  }

  user = data.user;

  if (mode === 'signup' && !data.session) {
    $('#authmsg').textContent =
      'Confirma o email enviado e depois inicia sessão.';
    return;
  }

  await afterAuth();
}

async function afterAuth() {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  profile = data;

  if (profile) {
    $('#playername').textContent = profile.nickname;
    $('#playerprovince').textContent = profile.province;
    show('gamepanel');
    await joinWorld();
  } else {
    $('#welcome').textContent = 'Bem-vindo!';
    show('profile');
  }
}

$('#signup').onclick = () => auth('signup');
$('#login').onclick = () => auth('login');

$('#saveprofile').onclick = async () => {
  const nickname = $('#nickname').value.trim();

  if (!nickname) {
    $('#profilemsg').textContent =
      'Escolhe um nome para o teu personagem.';
    return;
  }

  const row = {
    id: user.id,
    nickname,
    province: $('#province').value
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(row);

  if (error) {
    $('#profilemsg').textContent = error.message;
    return;
  }

  profile = row;

  $('#playername').textContent = nickname;
  $('#playerprovince').textContent = row.province;

  show('gamepanel');
  await joinWorld();
};

// MULTIJOGADOR
async function joinWorld() {
  if (!supabase || !user) return;

  channel = supabase.channel('city-luanda', {
    config: {
      presence: { key: user.id },
      broadcast: { self: false }
    }
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();

      const names = Object.values(state)
        .flat()
        .map(p => p.nickname || 'Jogador');

      $('#count').textContent = names.length;

      $('#players').innerHTML = names
        .map(n => `<div class="player">🟢 ${escapeHtml(n)}</div>`)
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

// SEGURANÇA DO CHAT
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function addChat(n, m) {
  const log = $('#chatlog');

  if (log.querySelector('.muted')) {
    log.innerHTML = '';
  }

  const p = document.createElement('p');
  p.innerHTML = `<b>${escapeHtml(n)}:</b> ${escapeHtml(m)}`;

  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// ENVIAR MENSAGENS
$('#chatform').onsubmit = async e => {
  e.preventDefault();

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

// TERMINAR SESSÃO
async function logout() {
  if (channel) await supabase.removeChannel(channel);
  if (supabase) await supabase.auth.signOut();

  user = null;
  profile = null;
  channel = null;

  show('auth');
}

$('#logout').onclick = logout;
$('#logout2').onclick = logout;

// ACÇÕES DO JOGO
document.querySelectorAll('[data-action]').forEach(b => {
  b.onclick = () => {
    const a = b.dataset.action;

    const msgs = {
      work: 'Sistema de empregos: será ligado à economia do servidor.',
      eat: 'Restaurantes e consumo serão guardados na tua conta.',
      home: 'Sistema de casas e propriedades em desenvolvimento.',
      car: 'Garagem e condução serão ligadas ao inventário.'
    };

    alert(msgs[a]);
  };
});

// RECUPERAR SESSÃO
if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      user = data.session.user;
      afterAuth();
    }
  });
}
