import { supabase } from './online.js';

const CHANNEL_NAME = 'angola-life-3d-luanda-live';
const FINE_AMOUNT = 5000;
export function createPlayerPhone({ game, online, services, player } = {}) {
  const topbar = game?.querySelector('#topbar');
  if (!topbar || !online) return { open() {}, close() {} };

  const button = document.createElement('button');
  button.id = 'player-phone-button';
  button.type = 'button';
  button.textContent = '📱 TELEMÓVEL';
  topbar.appendChild(button);

  const panel = document.createElement('section');
  panel.id = 'player-phone-panel';
  panel.innerHTML = `
    <div class="player-phone-card">
      <header>
        <div><small>ANGOLA LIFE 3D</small><h2>Meu telemóvel</h2></div>
        <button type="button" id="player-phone-close">✕</button>
      </header>
      <nav>
        <button type="button" data-tab="personal" class="active">Pessoal</button>
        <button type="button" data-tab="calls">Ligações</button>
        <button type="button" data-tab="chat">Chat público</button>
      </nav>
      <div id="phone-personal" class="phone-section">
        <div id="phone-profile" class="phone-info">A carregar perfil...</div>
        <h3>O meu guarda-roupa</h3><div id="phone-clothes" class="phone-info"></div>
        <h3>Os meus objetos</h3><div id="phone-inventory" class="phone-info"></div>
      </div>
      <div id="phone-calls" class="phone-section" hidden>
        <p class="phone-hint">Jogadores ligados agora. Escolhe um para iniciar uma chamada de voz.</p>
        <div id="phone-online-players" class="phone-info">A ligar ao servidor...</div>
        <div id="phone-call-status" role="status" class="phone-status">Sem chamada ativa.</div>
        <button type="button" id="phone-hangup" hidden>TERMINAR CHAMADA</button>
        <div id="phone-incoming" hidden>
          <p id="phone-incoming-text"></p>
          <button type="button" id="phone-answer">ATENDER</button>
          <button type="button" id="phone-decline">RECUSAR</button>
        </div>
        <audio id="phone-remote-audio" autoplay playsinline></audio>
      </div>
      <div id="phone-chat" class="phone-section" hidden>
        <p class="phone-hint">Chat público de Luanda. Respeita os outros jogadores. Dez palavras ofensivas acumuladas geram uma multa de 5.000 Kz.</p>
        <div id="phone-chat-messages" aria-live="polite"></div>
        <form id="phone-chat-form">
          <input id="phone-chat-input" maxlength="240" placeholder="Escreve uma mensagem..." autocomplete="off">
          <button type="submit">ENVIAR</button>
        </form>
      </div>
      <p id="phone-message" role="status"></p>
    </div>`;
  game.appendChild(panel);

  const style = document.createElement('style');
  style.id = 'player-phone-styles';
  style.textContent = `
    #player-phone-button{margin-left:7px;padding:8px 10px;border:1px solid #ffffff35;border-radius:9px;background:#20382f;color:#fff;font-size:10px;font-weight:900;white-space:nowrap;pointer-events:auto;position:relative;z-index:7}
    #player-phone-panel{position:absolute;z-index:90;inset:0;display:none;align-items:center;justify-content:center;padding:12px;background:#050b10d9}
    #player-phone-panel.visible{display:flex}
    .player-phone-card{width:min(94vw,440px);max-height:91vh;overflow:auto;padding:16px;border:1px solid #ffffff35;border-radius:17px;background:#14231efc;color:#fff;font-family:Arial,sans-serif;box-shadow:0 18px 55px #000b}
    .player-phone-card header{display:flex;align-items:center;justify-content:space-between}
    .player-phone-card header small{color:#e5ad35;font-size:10px;font-weight:900;letter-spacing:1px}
    .player-phone-card h2{margin:4px 0 12px;font-size:21px}
    .player-phone-card header button{width:36px;height:36px;border-radius:9px;background:#803e32;color:#fff}
    .player-phone-card nav{display:flex;gap:6px;margin-bottom:12px}
    .player-phone-card nav button{flex:1;padding:10px 4px;border-radius:8px;background:#29483c;color:#fff;font-size:11px;font-weight:800}
    .player-phone-card nav button.active{background:#d59b32;color:#17221e}
    .player-phone-card h3{margin:14px 0 7px;color:#e5bd6b;font-size:13px}
    .phone-info{padding:10px;border-radius:9px;background:#20382f;font-size:12px;line-height:1.7;overflow-wrap:anywhere}
    .phone-hint{color:#d3ddd8;font-size:12px;line-height:1.5}
    .phone-status,#phone-message{min-height:22px;margin:10px 0;color:#f0c66a;font-size:12px;line-height:1.5}
    #phone-online-players .phone-player{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #ffffff20}
    .phone-player button,#phone-hangup,#phone-answer,#phone-decline,#phone-chat-form button{padding:9px 11px;border-radius:8px;background:#d59b32;color:#17221e;font-size:11px;font-weight:900}
    #phone-hangup,#phone-decline{background:#803e32;color:#fff}
    #phone-incoming{padding:10px;margin-top:10px;border-radius:9px;background:#293d34}
    #phone-incoming button{margin-right:6px}
    #phone-chat-messages{height:190px;overflow:auto;padding:9px;border-radius:9px;background:#0c1712;font-size:12px;line-height:1.5}
    .phone-chat-line{padding:5px 0;border-bottom:1px solid #ffffff16;overflow-wrap:anywhere}
    .phone-chat-line strong{color:#e5bd6b}
    #phone-chat-form{display:flex;gap:6px;margin-top:8px}
    #phone-chat-input{min-width:0;flex:1;padding:11px;border:1px solid #ffffff30;border-radius:8px;background:#0e1915;color:#fff}
    #phone-remote-audio{display:none}
    @media(max-width:420px){#player-phone-button{font-size:9px;padding:7px 6px;margin-left:2px}}
  `;
  document.head.appendChild(style);

  const $ = selector => panel.querySelector(selector);
  const message = $('#phone-message');
  const sections = {
    personal: $('#phone-personal'),
    calls: $('#phone-calls'),
    chat: $('#phone-chat')
  };
  let channel = null;
  let liveReady = Promise.resolve(false);
  let connectedUserId = null;
  let presence = [];
  let peerConnection = null;
  let localStream = null;
  let activePeer = null;
  let activePeerName = '';
  let pendingOffer = null;
  let queuedCandidates = [];

  function showMessage(text) { message.textContent = text || ''; }
  function open() {
    panel.classList.add('visible');
    refreshPersonal();
    connectLive();
  }
  function close() {
    panel.classList.remove('visible');
  }
  function setTab(name) {
    Object.entries(sections).forEach(([key, section]) => { section.hidden = key !== name; });
    panel.querySelectorAll('nav button').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === name));
    if (name === 'personal') refreshPersonal();
    if (name === 'calls') renderPlayers();
  }

  async function refreshPersonal() {
    if (!online.isAuthenticated()) {
      $('#phone-profile').textContent = 'Entra na tua conta para consultar os teus dados pessoais.';
      $('#phone-clothes').textContent = 'Sem sessão iniciada.';
      $('#phone-inventory').textContent = 'Sem sessão iniciada.';
      return;
    }
    try {
      const data = await online.loadPlayerData();
      const profile = data.profile || {};
      $('#phone-profile').textContent =
        'Jogador: ' + (profile.nickname || 'Sem nome') +
        '\\nCarteira: ' + Number(profile.money || 0).toLocaleString('pt-PT') + ' Kz' +
        '\\nBanco: ' + Number(data.bankBalance || 0).toLocaleString('pt-PT') + ' Kz';
      const clothes = profile.appearance?.clothing || {};
      const clothesLines = Object.entries(clothes).map(([slot, item]) => slot + ': ' + item);
      $('#phone-clothes').textContent = clothesLines.length ? clothesLines.join('\\n') : 'Ainda não tens roupa equipada.';
      const inventory = data.inventory || services?.getInventory?.() || [];
      $('#phone-inventory').textContent = inventory.length
        ? inventory.map(item => item.name + ' × ' + item.quantity).join('\\n')
        : 'O teu inventário está vazio.';
    } catch (error) {
      showMessage(error.message || 'Não foi possível carregar os dados pessoais.');
    }
  }

  function currentUser() { return online.getUser(); }

  async function connectLive() {
    const user = currentUser();
    if (!user?.id) {
      $('#phone-online-players').textContent = 'Entra na tua conta para ver jogadores online.';
      return;
    }
    if (channel && connectedUserId === user.id) return liveReady;
    if (channel) {
      try { await supabase.removeChannel(channel); } catch {}
      channel = null;
    }
    connectedUserId = user.id;
    const nickname = online.getProfile()?.nickname || user.user_metadata?.nickname || 'Jogador';
    channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: user.id }, broadcast: { self: false } }
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        presence = Object.entries(state).flatMap(([id, entries]) =>
          (entries || []).map(entry => ({ id, nickname: entry.nickname || 'Jogador' }))
        );
        renderPlayers();
      })
      .on('broadcast', { event: 'voice-signal' }, ({ payload }) => handleSignal(payload))
      .on('broadcast', { event: 'public-chat' }, ({ payload }) => renderChatMessage(payload));
    liveReady = new Promise(resolve => {
      channel.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ nickname, online_at: new Date().toISOString() });
          renderPlayers();
          showMessage('Telemóvel ligado à rede de Luanda.');
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          showMessage('A ligação online foi interrompida. Tenta abrir novamente o telemóvel.');
          resolve(false);
        }
      });
    });
    return liveReady;
  }

  function renderPlayers() {
    const host = $('#phone-online-players');
    const me = currentUser()?.id;
    const others = presence.filter(person => person.id !== me);
    host.innerHTML = '';
    if (!channel) {
      host.textContent = 'A ligar ao servidor...';
      return;
    }
    if (!others.length) {
      host.textContent = 'Ainda não há outros jogadores ligados.';
      return;
    }
    others.forEach(person => {
      const row = document.createElement('div');
      row.className = 'phone-player';
      const name = document.createElement('span');
      name.textContent = '🟢 ' + person.nickname;
      const call = document.createElement('button');
      call.type = 'button';
      call.textContent = 'LIGAR';
      call.disabled = Boolean(activePeer);
      call.addEventListener('click', () => startCall(person.id, person.nickname));
      row.append(name, call);
      host.appendChild(row);
    });
  }

  async function sendSignal(to, signal) {
    if (!channel || !currentUser()?.id) return;
    await channel.send({
      type: 'broadcast',
      event: 'voice-signal',
      payload: {
        to,
        from: currentUser().id,
        fromName: online.getProfile()?.nickname || 'Jogador',
        signal
      }
    });
  }

  async function preparePeer(peerId, peerName) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('O teu navegador não permite chamadas de voz neste dispositivo.');
    }
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    activePeer = peerId;
    activePeerName = peerName;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.onicecandidate = event => {
      if (event.candidate) sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON() });
    };
    peerConnection.ontrack = event => {
      const audio = $('#phone-remote-audio');
      audio.srcObject = event.streams[0];
      audio.play().catch(() => showMessage('Toca no ecrã para permitir o áudio da chamada.'));
    };
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection?.connectionState;
      if (state === 'connected') $('#phone-call-status').textContent = 'Em chamada com ' + activePeerName + '.';
      if (state === 'failed' || state === 'disconnected') $('#phone-call-status').textContent = 'A ligação de voz foi interrompida.';
    };
    $('#phone-hangup').hidden = false;
    $('#phone-call-status').textContent = 'A chamar ' + peerName + '...';
    renderPlayers();
  }

  async function startCall(peerId, peerName) {
    if (activePeer) return;
    try {
      if (!(await connectLive())) throw new Error('Não foi possível ligar à rede de jogadores.');
      queuedCandidates = [];
      await preparePeer(peerId, peerName);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      await sendSignal(peerId, { type: 'offer', description: peerConnection.localDescription });
    } catch (error) {
      showMessage(error.message || 'Não foi possível iniciar a chamada.');
      endCall(false);
    }
  }

  async function handleSignal(payload) {
    if (!payload || payload.to !== currentUser()?.id || payload.from === currentUser()?.id) return;
    const signal = payload.signal || {};
    if (signal.type === 'offer') {
      if (activePeer) {
        await sendSignal(payload.from, { type: 'busy' });
        return;
      }
      pendingOffer = payload;
      queuedCandidates = [];
      $('#phone-incoming').hidden = false;
      $('#phone-incoming-text').textContent = payload.fromName + ' está a ligar-te.';
      $('#phone-call-status').textContent = 'Chamada recebida.';
      setTab('calls');
      panel.classList.add('visible');
      return;
    }
    if (signal.type === 'busy') {
      showMessage(payload.fromName + ' já está numa chamada.');
      return;
    }
    if (signal.type === 'hangup') {
      if (activePeer === payload.from) endCall(false);
      return;
    }
    if (signal.type === 'answer' && activePeer === payload.from && peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.description));
      for (const candidate of queuedCandidates) await peerConnection.addIceCandidate(candidate);
      queuedCandidates = [];
      return;
    }
    if (signal.type === 'candidate') {
      const candidate = new RTCIceCandidate(signal.candidate);
      if (activePeer === payload.from && peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate);
      } else if (activePeer === payload.from || pendingOffer?.from === payload.from) {
        queuedCandidates.push(candidate);
      }
    }
  }

  async function answerCall() {
    if (!pendingOffer) return;
    const incoming = pendingOffer;
    pendingOffer = null;
    $('#phone-incoming').hidden = true;
    try {
      await preparePeer(incoming.from, incoming.fromName || 'Jogador');
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incoming.signal.description));
      for (const candidate of queuedCandidates) await peerConnection.addIceCandidate(candidate);
      queuedCandidates = [];
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await sendSignal(incoming.from, { type: 'answer', description: peerConnection.localDescription });
      $('#phone-call-status').textContent = 'Em chamada com ' + activePeerName + '.';
    } catch (error) {
      showMessage(error.message || 'Não foi possível atender a chamada.');
      endCall(false);
    }
  }

  async function endCall(notify = true) {
    const peer = activePeer;
    if (notify && peer) await sendSignal(peer, { type: 'hangup' }).catch(() => {});
    if (peerConnection) {
      peerConnection.onicecandidate = null;
      peerConnection.ontrack = null;
      peerConnection.close();
    }
    peerConnection = null;
    if (localStream) localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    activePeer = null;
    activePeerName = '';
    queuedCandidates = [];
    $('#phone-remote-audio').srcObject = null;
    $('#phone-hangup').hidden = true;
    $('#phone-call-status').textContent = 'Sem chamada ativa.';
    renderPlayers();
  }

  function renderChatMessage(payload) {
    if (!payload?.text) return;
    const host = $('#phone-chat-messages');
    const line = document.createElement('div');
    line.className = 'phone-chat-line';
    const name = document.createElement('strong');
    name.textContent = (payload.nickname || 'Jogador') + ': ';
    const text = document.createElement('span');
    text.textContent = payload.text;
    line.append(name, text);
    host.appendChild(line);
    while (host.children.length > 60) host.firstElementChild.remove();
    host.scrollTop = host.scrollHeight;
  }

  async function sendChat(text) {
    if (!online.isAuthenticated()) {
      showMessage('Entra na tua conta para escrever no chat público.');
      return;
    }
    if (!(await connectLive()) || !channel) {
      showMessage('O chat ainda não está ligado ao servidor.');
      return;
    }
    const nickname = online.getProfile()?.nickname || 'Jogador';
    const moderation = await online.registerPublicChatMessage(text);
    const payload = { nickname, text, from: currentUser().id, sentAt: Date.now() };
    renderChatMessage(payload);
    window.dispatchEvent(new CustomEvent('angolaLife3D:chatBubble', { detail: { text, playerId: currentUser().id } }));
    await channel.send({ type: 'broadcast', event: 'public-chat', payload });

    if (Number(moderation?.fines_applied) > 0) {
      showMessage('A Polícia aplicou ' + moderation.fines_applied + ' multa(s) de 5.000 Kz por linguagem ofensiva.');
    } else if (Number(moderation?.offensive_words) > 0) {
      showMessage('Aviso policial: ' + moderation.total_count + ' de 10 palavras ofensivas acumuladas.');
    }
  }

  $('#phone-chat-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#phone-chat-input');
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    sendChat(value).catch(error => showMessage(error.message || 'Não foi possível enviar a mensagem.'));
  });
  $('#phone-answer').addEventListener('click', answerCall);
  $('#phone-decline').addEventListener('click', async () => {
    if (pendingOffer) await sendSignal(pendingOffer.from, { type: 'hangup' });
    pendingOffer = null;
    $('#phone-incoming').hidden = true;
    $('#phone-call-status').textContent = 'Chamada recusada.';
  });
  $('#phone-hangup').addEventListener('click', () => endCall(true));
  $('#player-phone-close').addEventListener('click', close);
  button.addEventListener('click', () => {
    const opening = !panel.classList.contains('visible');
    if (opening) open();
    else close();
  });
  panel.querySelectorAll('nav button').forEach(tab => tab.addEventListener('click', () => setTab(tab.dataset.tab)));

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) connectLive();
    else {
      endCall(false);
      if (channel) supabase.removeChannel(channel).catch(() => {});
      channel = null;
      connectedUserId = null;
      presence = [];
      renderPlayers();
    }
  });
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user?.id) connectLive();
  });

  return { open, close, refreshPersonal, connectLive };
}
