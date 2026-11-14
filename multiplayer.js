import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { supabase } from './online.js';

const MODEL_URLS = {
  male: 'https://models.codelove.in/models/male-adult-02.glb',
  female: 'https://models.codelove.in/models/female-adult-03.glb'
};
const HEIGHT = 2.5;
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const MAX_VISIBLE_PLAYERS = IS_MOBILE ? 8 : 12;
const SHOW_DISTANCE = IS_MOBILE ? 180 : 260;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
let assetsPromise = null;

function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      loader.loadAsync(MODEL_URLS.male),
      loader.loadAsync(MODEL_URLS.female)
    ]).then(([male, female]) => ({ male: male.scene, female: female.scene }));
  }
  return assetsPromise;
}

function hash(value) {
  let result = 0;
  for (const char of String(value)) result = (result * 31 + char.charCodeAt(0)) >>> 0;
  return result;
}

function normalizeModel(model) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height <= 0) throw new Error('Modelo de jogador inválido.');
  const root = new THREE.Group();
  root.scale.setScalar(HEIGHT / height);
  root.position.y = -bounds.min.y * (HEIGHT / height);
  root.add(model);
  return root;
}

function applyAppearance(model, appearance = {}) {
  const skin = new THREE.Color(appearance.skin || '#8d5524');
  const hair = new THREE.Color(appearance.hair || '#21160f');
  const eyes = new THREE.Color(appearance.eyes || '#3b2418');
  const clothing = appearance.clothing || {};
  const clothingPatterns = {
    top: /shirt|top|torso|upper|tshirt|outfit_top/,
    bottom: /pant|trouser|jean|short|skirt|bottom|outfit_bottom/,
    shoes: /shoe|boot|sneaker|footwear|feet|outfit_footwear/,
    outfit: /dress|vestido/,
    outer: /jacket|coat|blazer|outerwear/
  };
  const colorFor = (item, slot) => {
    const value = String(item || '').toLowerCase();
    if (/branc/.test(value)) return 0xf1eee7;
    if (/pret|negro/.test(value)) return 0x202020;
    if (/vermelh/.test(value)) return 0xb52e35;
    if (/azul|jeans/.test(value)) return 0x285d91;
    if (/verde/.test(value)) return 0x286344;
    if (/amarel|dourad/.test(value)) return 0xd6a52e;
    if (/african|estampad/.test(value)) return 0x9a3c32;
    return slot === 'bottom' ? 0x26344c : slot === 'shoes' ? 0x282828 : 0x2877a8;
  };

  model.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const name = [object.name, ...materials.map(item => item.name)].join(' ').toLowerCase();
    let color = null;
    if (/hair|cabelo|beard/.test(name)) color = hair;
    else if (/eye|iris|pupil/.test(name)) color = eyes;
    else if (/skin|face|head|body|arm|hand|leg|neck/.test(name)) color = skin;
    const slot = Object.keys(clothingPatterns).find(key => clothing[key] && clothingPatterns[key].test(name));
    const tint = slot ? colorFor(clothing[slot], slot) : null;
    if (!color && tint === null) return;
    const changed = materials.map(original => {
      const material = original.clone();
      if (color && material.color) material.color.copy(color);
      if (tint !== null && material.color) material.color.setHex(tint);
      return material;
    });
    object.material = Array.isArray(object.material) ? changed : changed[0];
  });
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
  let assets = null;
  let loadingAssets = null;

  const localPosition = () => player.currentVehicle
    ? player.currentVehicle.group.position
    : player.group.position;

  async function ensureAssets() {
    if (assets) return assets;
    if (!loadingAssets) loadingAssets = loadAssets();
    assets = await loadingAssets;
    return assets;
  }

  async function addRemote(id, data = {}) {
    if (!id || id === online.getUser()?.id || remotePlayers.has(id)) return;
    if (remotePlayers.size >= MAX_VISIBLE_PLAYERS) return;
    const initialPosition = data.position || { x: 0, z: 0 };
    const local = localPosition();
    if (Math.hypot((Number(initialPosition.x) || 0) - local.x, (Number(initialPosition.z) || 0) - local.z) > SHOW_DISTANCE) return;
    const assetsLoaded = await ensureAssets();
    if (!loaderState.channel || loaderState.userId === null) return;
    const currentPresence = loaderState.channel.presenceState();
    if (!currentPresence[id]) return;

    const gender = hash(id) % 2 === 0 ? 'male' : 'female';
    const model = clone(assetsLoaded[gender]);
    const normalized = normalizeModel(model);
    applyAppearance(normalized, data.appearance || {});
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

  async function connect() {
    const user = online?.getUser?.();
    if (!user?.id || !scene || !player) return false;
    if (loaderState.channel && loaderState.userId === user.id) return loaderState.ready;
    if (loaderState.channel) {
      await supabase.removeChannel(loaderState.channel).catch(() => {});
      loaderState.channel = null;
    }
    loaderState.userId = user.id;
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
    for (const [id, root] of remotePlayers) {
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
    loaderState.channel = null;
    loaderState.userId = null;
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
