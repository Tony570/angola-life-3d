import * as THREE from 'three';
import { createStylizedAvatar } from './stylized-avatar.js';
import { supabase } from './online.js';

const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const MAX_VISIBLE_PLAYERS = IS_MOBILE ? 8 : 12;
const SHOW_DISTANCE = IS_MOBILE ? 180 : 260;

function hash(value) {
  let result = 0;
  for (const char of String(value)) result = (result * 31 + char.charCodeAt(0)) >>> 0;
  return result;
}

function makeNameLabel(nickname) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14231e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e5ad35';
  ctx.lineWidth = 8;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(nickname || 'Jogador').slice(0, 22), 256, 64, 470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(2.25, 0.56, 1);
  sprite.position.y = 3.05;
  return sprite;
}

export function createMultiplayer({ scene, player, online } = {}) {
  const loaderState = { channel: null, ready: false, userId: null };
  const remotePlayers = new Map();
  const remoteTargets = new Map();
  let sendTimer = 0;
  let pruneTimer = 0;
  let lastSent = null;
  let lastAppearanceSignature = '';
  let chatChannel = null;
  let chatChannelReady = null;

  const localPosition = () => player.currentVehicle
    ? player.currentVehicle.group.position
    : player.group.position;

  function showChatBubble(root, message) {
    if (!root || !message) return;
    const previous = root.userData.chatBubble;
    if (previous) {
      root.remove(previous);
      previous.material?.map?.dispose();
      previous.material?.dispose();
    }
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(250,248,239,0.97)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 136, 28);
    ctx.fill();
    ctx.fillStyle = '#1d292b';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = String(message).slice(0, 95).split(/\s+/);
    let line = '';
    let y = words.length > 7 ? 54 : 78;
    const lines = [];
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > 450 && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    const visibleLines = lines.slice(0, 2);
    y = visibleLines.length === 1 ? 78 : 52;
    visibleLines.forEach(value => {
      ctx.fillText(value, 256, y, 450);
      y += 48;
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(3.3, 1.05, 1);
    sprite.position.set(0, 3.8, 0);
    root.add(sprite);
    root.userData.chatBubble = sprite;
    root.userData.chatBubbleExpires = performance.now() + 5000;
  }

  const pendingChatBubbles = new Map();
  const onLocalChatBubble = event => {
    const message = event.detail?.text;
    if (message) showChatBubble(player.group, message);
  };
  window.addEventListener('angolaLife3D:chatBubble', onLocalChatBubble);

  async function addRemote(id, data = {}) {
    if (!id || id === online.getUser()?.id || remotePlayers.has(id)) return;
    if (remotePlayers.size >= MAX_VISIBLE_PLAYERS) return;
    const initialPosition = data.position || { x: 0, z: 0 };
    const local = localPosition();
    if (Math.hypot((Number(initialPosition.x) || 0) - local.x, (Number(initialPosition.z) || 0) - local.z) > SHOW_DISTANCE) return;
    if (!loaderState.channel || loaderState.userId === null) return;
    const currentPresence = loaderState.channel.presenceState();
    if (!currentPresence[id]) return;

    const normalized = createStylizedAvatar(data.appearance || {});
    const root = new THREE.Group();
    root.add(normalized);
    root.add(makeNameLabel(data.nickname || 'Jogador'));
    root.userData.playerId = id;
    root.userData.nickname = data.nickname || 'Jogador';
    root.visible = false;
    scene.add(root);

    const position = data.position || { x: 0, y: 0, z: 0 };
    root.position.set(Number(position.x) || 0, Number(position.y) || 0, Number(position.z) || 0);
    root.rotation.y = Number(data.rotationY) || 0;
    remotePlayers.set(id, root);
    if (pendingChatBubbles.has(id)) {
      showChatBubble(root, pendingChatBubbles.get(id));
      pendingChatBubbles.delete(id);
    }
    remoteTargets.set(id, {
      position: new THREE.Vector3(root.position.x, root.position.y, root.position.z),
      rotationY: root.rotation.y,
      lastSeen: performance.now()
    });
  }

  function removeRemote(id) {
    const root = remotePlayers.get(id);
    if (!root) return;
    scene.remove(root);
    root.traverse(object => {
      if (object.isSprite && object.material?.map) object.material.map.dispose();
    });
    remotePlayers.delete(id);
    remoteTargets.delete(id);
  }

  function syncPresence() {
    if (!loaderState.channel) return;
    const state = loaderState.channel.presenceState();
    const active = new Set(Object.keys(state));
    for (const id of remotePlayers.keys()) if (!active.has(id)) removeRemote(id);
    for (const [id, entries] of Object.entries(state)) {
      if (id === loaderState.userId || !entries?.length) continue;
      addRemote(id, entries[0]).catch(error => console.warn('Não foi possível carregar um jogador online:', error));
    }
  }

  function receivePosition(payload) {
    if (!payload?.id || payload.id === loaderState.userId) return;
    const position = payload.position || {};
    const local = localPosition();
    const distance = Math.hypot((Number(position.x) || 0) - local.x, (Number(position.z) || 0) - local.z);
    if (distance > SHOW_DISTANCE) {
      if (remotePlayers.has(payload.id)) removeRemote(payload.id);
      return;
    }
    if (!remotePlayers.has(payload.id)) {
      addRemote(payload.id, payload).catch(error => console.warn('Erro ao criar jogador online:', error));
    }
    const target = remoteTargets.get(payload.id);
    if (target) {
      target.position.set(Number(position.x) || 0, Number(position.y) || 0, Number(position.z) || 0);
      target.rotationY = Number(payload.rotationY) || 0;
      target.lastSeen = performance.now();
    }
  }

  async function connectChatChannel() {
    if (chatChannel) return chatChannelReady;
    chatChannel = supabase.channel('angola-life-3d-luanda-live', {
      config: { broadcast: { self: false } }
    });
    chatChannel.on('broadcast', { event: 'public-chat' }, ({ payload }) => {
      if (!payload?.from || payload.from === loaderState.userId) return;
      const root = remotePlayers.get(payload.from);
      if (root) showChatBubble(root, payload.text);
      else pendingChatBubbles.set(payload.from, payload.text);
    });
    chatChannelReady = new Promise(resolve => {
      chatChannel.subscribe(status => {
        if (status === 'SUBSCRIBED') resolve(true);
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve(false);
      });
    });
    return chatChannelReady;
  }

  async function connect() {
    const user = online?.getUser?.();
    if (!user?.id || !scene || !player) return false;
    if (loaderState.channel && loaderState.userId === user.id) return loaderState.ready;
    if (loaderState.channel) {
      await supabase.removeChannel(loaderState.channel).catch(() => {});
      loaderState.channel = null;
    }
    loaderState.userId = user.id;
    connectChatChannel().catch(() => {});
    const channel = supabase.channel('angola-life-3d-luanda-players', {
      config: { presence: { key: user.id }, broadcast: { self: false } }
    });
    loaderState.channel = channel;
    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('broadcast', { event: 'player-position' }, ({ payload }) => receivePosition(payload));
    loaderState.ready = await new Promise(resolve => {
      channel.subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          const profile = online.getProfile() || {};
          const appearance = profile.appearance || player.appearance || {};
          await channel.track({
            nickname: profile.nickname || user.user_metadata?.nickname || 'Jogador',
            appearance,
            position: { x: localPosition().x, y: localPosition().y, z: localPosition().z },
            rotationY: player.group.rotation.y
          });
          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          resolve(false);
        }
      });
    });
    if (loaderState.ready) syncPresence();
    return loaderState.ready;
  }

  async function sendPosition() {
    if (!loaderState.ready || !loaderState.channel || !loaderState.userId) return;
    const position = localPosition();
    const current = {
      x: Number(position.x.toFixed(2)),
      y: Number(position.y.toFixed(2)),
      z: Number(position.z.toFixed(2)),
      rotationY: Number((player.currentVehicle?.group.rotation.y ?? player.group.rotation.y).toFixed(2))
    };
    const profile = online.getProfile() || {};
    const appearance = profile.appearance || player.appearance || {};
    const appearanceSignature = JSON.stringify(appearance);
    const appearanceChanged = appearanceSignature !== lastAppearanceSignature;
    if (!appearanceChanged && lastSent &&
      Math.abs(current.x - lastSent.x) < 0.08 &&
      Math.abs(current.z - lastSent.z) < 0.08 &&
      Math.abs(current.rotationY - lastSent.rotationY) < 0.08) return;
    lastSent = current;
    lastAppearanceSignature = appearanceSignature;
    await loaderState.channel.send({
      type: 'broadcast',
      event: 'player-position',
      payload: {
        id: loaderState.userId,
        nickname: profile.nickname || 'Jogador',
        appearance: profile.appearance || player.appearance || {},
        position: { x: current.x, y: current.y, z: current.z },
        rotationY: current.rotationY
      }
    });
  }

  function update(delta) {
    if (!loaderState.ready) return;
    sendTimer += delta;
    pruneTimer += delta;
    if (sendTimer >= 0.18) {
      sendTimer = 0;
      sendPosition().catch(() => {});
    }
    const local = localPosition();
    if (player.group.userData.chatBubble && performance.now() > player.group.userData.chatBubbleExpires) {
      const bubble = player.group.userData.chatBubble;
      player.group.remove(bubble);
      bubble.material?.map?.dispose();
      bubble.material?.dispose();
      delete player.group.userData.chatBubble;
    }
    for (const [id, root] of remotePlayers) {
      if (root.userData.chatBubble && performance.now() > root.userData.chatBubbleExpires) {
        const bubble = root.userData.chatBubble;
        root.remove(bubble);
        bubble.material?.map?.dispose();
        bubble.material?.dispose();
        delete root.userData.chatBubble;
      }
      const target = remoteTargets.get(id);
      if (!target) continue;
      const distance = Math.hypot(target.position.x - local.x, target.position.z - local.z);
      if (distance > SHOW_DISTANCE + 30) {
        removeRemote(id);
        continue;
      }
      root.visible = distance <= SHOW_DISTANCE;
      root.position.lerp(target.position, Math.min(1, delta * 10));
      let difference = target.rotationY - root.rotation.y;
      difference = Math.atan2(Math.sin(difference), Math.cos(difference));
      root.rotation.y += difference * Math.min(1, delta * 8);
    }
    if (pruneTimer >= 2.5) {
      pruneTimer = 0;
      syncPresence();
      for (const [id, target] of remoteTargets) {
        if (performance.now() - target.lastSeen > 12000) removeRemote(id);
      }
    }
  }

  async function disconnect() {
    loaderState.ready = false;
    if (loaderState.channel) await supabase.removeChannel(loaderState.channel).catch(() => {});
    if (chatChannel) await supabase.removeChannel(chatChannel).catch(() => {});
    loaderState.channel = null;
    chatChannel = null;
    chatChannelReady = null;
    loaderState.userId = null;
    pendingChatBubbles.clear();
    for (const id of [...remotePlayers.keys()]) removeRemote(id);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) connect().catch(() => {});
    else disconnect();
  });
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user?.id) connect().catch(() => {});
  });

  return { connect, disconnect, update, getVisiblePlayers: () => remotePlayers.size };
}
