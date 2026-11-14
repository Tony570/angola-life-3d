// ANGOLA LIFE 3D — GUIA DE INICIAÇÃO E 20 MISSÕES
export function createLifeGuide({ game, player, world } = {}) {
  if (!game || !player || !world) return { start() {}, update() {}, isOpen: () => false };
  const KEY = 'angolaLife3D_missions_v1';
  const missions = [
    ['Primeiros passos','Caminha pela cidade e aprende a controlar o teu personagem.',0,0,'walk'],
    ['Conhece o mapa','Abre o mapa de Luanda e observa os bairros e serviços.',0,0,'map'],
    ['Visita a praça','Chega à Praça da Cidade.',0,0,'visit'],
    ['Explora o comércio','Visita a Boutique Central.',-50,29,'visit'],
    ['Conhece o banco','Encontra o Banco Nacional.',-50,58,'visit'],
    ['Descobre o mercado','Visita o Mercado de Luanda.',-78,-18,'visit'],
    ['Visita a concessionária','Encontra a Concessionária de Automóveis.',50,58,'visit'],
    ['Conhece o hospital','Visita o Hospital Municipal.',91,101,'visit'],
    ['Encontra a esquadra','Visita a Esquadra de Polícia.',50,-42,'visit'],
    ['Visita o posto','Encontra o Posto de Combustível.',78,-28,'visit'],
    ['Explora a Marginal','Passeia pela zona da Marginal.',-35,40,'visit'],
    ['Conhece a zona comercial','Visita o Centro de Luanda.',35,-35,'visit'],
    ['Entra num restaurante','Visita a zona dos restaurantes.',-55,-20,'visit'],
    ['Descobre a Ilha','Explora a zona costeira e os seus serviços.',-55,-66,'visit'],
    ['Conhece o bairro','Visita a zona residencial.',40,40,'visit'],
    ['Visita o hotel','Encontra o Hotel Central.',91,29,'visit'],
    ['Experimenta o telemóvel','Abre o telemóvel virtual no jogo.',0,0,'phone'],
    ['Explora outro destino','Escolhe um destino no mapa e segue a orientação.',-40,-35,'visit'],
    ['Passeia pela cidade','Chega à zona de serviços e explora a pé.',-50,-43,'visit'],
    ['A tua vida em Luanda','Regressa à praça e prepara-te para viver a cidade.',0,0,'visit']
  ];
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { state = {}; }
  const completed = new Set(Array.isArray(state.completed) ? state.completed : []);
  let opened = false;
  let walking = 0;
  let lastPosition = player.group.position.clone();
  const panel = document.createElement('section');
  panel.id = 'life-guide-panel';
  panel.innerHTML = `
    <div class="life-guide-card">
      <header><div><small>ANGOLA LIFE 3D · TUTORIAL</small><h2>As tuas primeiras missões</h2><p>Aprende a viver em Luanda, passo a passo.</p></div><button type="button" id="life-guide-close" aria-label="Fechar">×</button></header>
      <div class="life-guide-progress"><span id="life-guide-count">0 / 20 concluídas</span><div><i id="life-guide-bar"></i></div></div>
      <p class="life-guide-hint" id="life-guide-hint">Segue a primeira missão. Aproxima-te do destino para concluir.</p>
      <div id="life-guide-list"></div>
    </div>`;
  game.appendChild(panel);
  const button = document.createElement('button');
  button.id = 'life-guide-button';
  button.type = 'button';
  button.textContent = '🎯 MISSÕES 0/20';
  game.appendChild(button);
  const css = document.createElement('style');
  css.textContent = `
    #life-guide-button{position:absolute;z-index:8;right:16px;top:132px;padding:11px 13px;border:1px solid #e9b94e88;border-radius:11px;background:#173e32;color:#ffe4a0;font-size:11px;font-weight:900;box-shadow:0 4px 15px #0006}
    #life-guide-panel{position:absolute;z-index:95;inset:0;display:none;align-items:center;justify-content:center;padding:12px;background:#030b0ddd}
    #life-guide-panel.visible{display:flex}
    .life-guide-card{width:min(94vw,470px);max-height:90vh;overflow:auto;padding:17px;border:1px solid #e9b94e55;border-radius:18px;background:linear-gradient(155deg,#17372e,#0d191d);color:#fff;font-family:Arial,sans-serif;box-shadow:0 18px 60px #000b}
    .life-guide-card header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .life-guide-card header small{color:#e9b94e;font-size:9px;font-weight:900;letter-spacing:1.3px}
    .life-guide-card h2{font-size:21px;margin:5px 0}
    .life-guide-card header p{color:#bdcec5;font-size:12px}
    #life-guide-close{width:36px;height:36px;border-radius:9px;background:#803e32;color:#fff;font-size:22px}
    .life-guide-progress{margin:15px 0 8px;color:#f0d28c;font-size:11px;font-weight:900}
    .life-guide-progress>div{height:7px;margin-top:7px;border-radius:8px;background:#ffffff20;overflow:hidden}
    .life-guide-progress i{display:block;width:0;height:100%;background:#e9b94e;transition:width .2s}
    .life-guide-hint{margin:10px 0;padding:10px;border-radius:9px;background:#ffffff10;color:#d9e4dc;font-size:12px;line-height:1.45}
    #life-guide-list{display:grid;gap:7px}
    .life-mission{display:flex;align-items:center;gap:10px;padding:9px;border:1px solid #ffffff18;border-radius:9px;background:#ffffff08}
    .life-mission.done{border-color:#6ca77c66;background:#214431}
    .life-mission b{display:grid;place-items:center;flex:0 0 27px;width:27px;height:27px;border-radius:50%;background:#314b40;color:#f2d58c;font-size:11px}
    .life-mission.done b{background:#36734a;color:#fff}
    .life-mission span{display:grid;gap:3px;font-size:12px;font-weight:800}
    .life-mission small{color:#b8c9bf;font-size:10px;font-weight:400}
    @media(max-width:520px){#life-guide-button{top:auto;bottom:18px;right:15px}.life-guide-card{max-height:86vh}}
  `;
  document.head.appendChild(css);
  const list = panel.querySelector('#life-guide-list');
  const count = panel.querySelector('#life-guide-count');
  const bar = panel.querySelector('#life-guide-bar');
  const hint = panel.querySelector('#life-guide-hint');
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ completed: [...completed] })); } catch {}
  }
  function render() {
    const total = completed.size;
    count.textContent = total + ' / 20 concluídas';
    bar.style.width = (total / missions.length * 100) + '%';
    button.textContent = '🎯 MISSÕES ' + total + '/20';
    list.innerHTML = '';
    missions.forEach((mission, index) => {
      const done = completed.has(index);
      const row = document.createElement('div');
      row.className = 'life-mission' + (done ? ' done' : '');
      const mark = document.createElement('b');
      mark.textContent = done ? '✓' : String(index + 1);
      const text = document.createElement('span');
      text.append(document.createTextNode(mission[0]));
      const small = document.createElement('small');
      small.textContent = mission[1];
      text.append(small);
      row.append(mark, text);
      list.append(row);
    });
    const next = missions.findIndex((_, index) => !completed.has(index));
    hint.textContent = next < 0
      ? 'Parabéns! Concluíste as 20 missões de iniciação. A cidade está pronta para explorares.'
      : 'Próxima missão: ' + missions[next][0] + ' — ' + missions[next][1];
  }
  function complete(index) {
    if (completed.has(index)) return;
    completed.add(index);
    save();
    render();
    window.dispatchEvent(new CustomEvent('angolaLife3D:missionCompleted', { detail: { index, title: missions[index][0] } }));
  }
  function start() { opened = true; panel.classList.add('visible'); render(); }
  function close() { opened = false; panel.classList.remove('visible'); }
  button.addEventListener('click', () => opened ? close() : start());
  panel.querySelector('#life-guide-close').addEventListener('click', close);
  window.addEventListener('angolaLife3D:mapOpened', () => complete(1));
  window.addEventListener('angolaLife3D:phoneOpened', () => complete(16));
  function update() {
    const pos = player.currentVehicle ? player.currentVehicle.group.position : player.group.position;
    const moved = Math.hypot(pos.x - lastPosition.x, pos.z - lastPosition.z);
    walking += moved;
    lastPosition.copy(pos);
    if (walking > 7) complete(0);
    missions.forEach((mission, index) => {
      if (mission[4] !== 'visit' || completed.has(index)) return;
      if (Math.hypot(pos.x - mission[2], pos.z - mission[3]) < 7) complete(index);
    });
  }
  render();
  return { start, close, update, isOpen: () => opened, completed: () => completed.size };
}
