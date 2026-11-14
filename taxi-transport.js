import * as THREE from 'three';
import { attachRealCar } from './vehicle-models.js';

const DISTRICTS = [
  { name: 'Ingombota', x: 0, z: 0 },
  { name: 'Maianga', x: 145, z: 55 },
  { name: 'Maculusso', x: -125, z: 35 },
  { name: 'Miramar', x: -255, z: -105 },
  { name: 'Alvalade', x: 245, z: -115 },
  { name: 'Prenda', x: 155, z: 195 },
  { name: 'Samba', x: 20, z: 320 },
  { name: 'Bairro Azul', x: -155, z: 190 },
  { name: 'Cruzeiro', x: -285, z: 65 },
  { name: 'Sambizanga', x: -105, z: -220 },
  { name: 'Ilha de Luanda', x: -390, z: -20 },
  { name: 'Rua da Direita', x: 0, z: -32 }
];
const STOPS = DISTRICTS.flatMap((district, index) => [
  {
    name: `${district.name} · Centro`,
    districtName: district.name,
    x: district.x - 7,
    z: district.z - 4,
    id: index * 2
  },
  {
    name: `${district.name} · Bairro`,
    districtName: district.name,
    x: district.x + 17,
    z: district.z + 16,
    id: index * 2 + 1
  }
]);

const ARTERIAL = [
  [0, 0, -125, 35], [0, 0, 145, 55], [0, 0, -105, -220],
  [0, 0, 245, -115], [0, 0, 155, 195], [0, 0, 20, 320],
  [-125, 35, -255, -105], [-125, 35, -155, 190],
  [-255, -105, -285, 65], [-105, -220, -255, -105],
  [145, 55, 245, -115], [145, 55, 155, 195],
  [155, 195, 20, 320], [-155, 190, -285, 65],
  [-285, 65, -390, -20], [-390, -20, -125, 35]
];

const money = value => `${Math.round(value).toLocaleString('pt-PT')} Kz`;

export function createTaxiTransport({ scene, world, player, services, game }) {
  const stops = STOPS.map(stop => ({ ...stop }));
  const taxis = [];
  const roadNodes = [];
  const edges = new Map();
  let activeTaxi = null;
  let activeRoute = null;
  let menuOpen = false;

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1b9b70, roughness: 0.42, metalness: 0.12 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: 0.8 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x8fc4d1, roughness: 0.22, metalness: 0.08 });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf1eee4, roughness: 0.72 });
  const signMaterial = new THREE.MeshStandardMaterial({ color: 0x173d38, roughness: 0.7 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xe4b84f, roughness: 0.55 });

  function addRoadNode(x, z) {
    const key = `${Math.round(x * 10) / 10},${Math.round(z * 10) / 10}`;
    let node = roadNodes.find(item => item.key === key);
    if (!node) {
      node = { key, x, z };
      roadNodes.push(node);
      edges.set(key, []);
    }
    return node;
  }

  function connect(a, b) {
    if (!a || !b || a.key === b.key) return;
    const distance = Math.hypot(a.x - b.x, a.z - b.z);
    edges.get(a.key).push({ key: b.key, distance });
    edges.get(b.key).push({ key: a.key, distance });
  }

  function buildRoadGraph() {
    const xs = [-420, -285, -155, 0, 155, 245, 300];
    const zs = [-270, -220, -105, 35, 190, 320, 360];

    for (const z of [-220, -105, 35, 190, 320]) {
      const row = xs.map(x => addRoadNode(x, z));
      for (let i = 0; i < row.length - 1; i++) connect(row[i], row[i + 1]);
    }

    for (const x of [-285, -155, 0, 155, 245]) {
      const column = zs.map(z => addRoadNode(x, z));
      for (let i = 0; i < column.length - 1; i++) connect(column[i], column[i + 1]);
    }

    for (const [x1, z1, x2, z2] of ARTERIAL) {
      connect(addRoadNode(x1, z1), addRoadNode(x2, z2));
    }

    const accessPoints = [
      ...stops,
      ...DISTRICTS.map((district, index) => ({ ...district, id: 1000 + index }))
    ];

    for (const point of accessPoints) {
      const pointNode = addRoadNode(point.x, point.z);
      const nearest = roadNodes
        .filter(node => node.key !== pointNode.key)
        .map(node => ({ node, distance: Math.hypot(node.x - point.x, node.z - point.z) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      for (const candidate of nearest) connect(pointNode, candidate.node);
    }
  }

  function shortestRoute(start, end) {
    const startKey = `${start.x},${start.z}`;
    const endKey = `${end.x},${end.z}`;
    const distances = new Map([[startKey, 0]]);
    const previous = new Map();
    const pending = new Set(roadNodes.map(node => node.key));

    while (pending.size) {
      let currentKey = null;
      let best = Infinity;
      for (const key of pending) {
        const distance = distances.get(key) ?? Infinity;
        if (distance < best) { best = distance; currentKey = key; }
      }
      if (currentKey === null || currentKey === endKey) break;
      pending.delete(currentKey);

      for (const edge of edges.get(currentKey) || []) {
        if (!pending.has(edge.key)) continue;
        const candidate = best + edge.distance;
        if (candidate < (distances.get(edge.key) ?? Infinity)) {
          distances.set(edge.key, candidate);
          previous.set(edge.key, currentKey);
        }
      }
    }

    if (!distances.has(endKey)) return [new THREE.Vector3(start.x, 0, start.z), new THREE.Vector3(end.x, 0, end.z)];
    const path = [];
    let key = endKey;
    while (key) {
      const node = roadNodes.find(item => item.key === key);
      if (node) path.push(new THREE.Vector3(node.x, 0, node.z));
      key = previous.get(key);
    }
    path.reverse();
    if (!path.length || path[0].distanceTo(new THREE.Vector3(start.x, 0, start.z)) > 0.1) {
      path.unshift(new THREE.Vector3(start.x, 0, start.z));
    }
    if (path[path.length - 1].distanceTo(new THREE.Vector3(end.x, 0, end.z)) > 0.1) {
      path.push(new THREE.Vector3(end.x, 0, end.z));
    }
    return path;
  }

  function routeDistance(path) {
    let total = 0;
    for (let i = 1; i < path.length; i++) total += path[i - 1].distanceTo(path[i]);
    return total;
  }

  function createTaxi(stop) {
    const group = new THREE.Group();
    group.position.set(stop.x + 4.2, 0, stop.z + 3.2);
    group.rotation.y = Math.atan2(-4.2, -3.2);
    scene.add(group);

    const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.34), goldMaterial);
    roofSign.position.set(0, 1.9, -0.2);
    group.add(roofSign);
    attachRealCar(group, { width: 2.3, length: 4.5, height: 1.65, paintColor: 0x15945f });

    const taxi = {
      group,
      speed: 0,
      occupied: false,
      isTaxi: true,
      stop,
      stationId: stop.id,
      modelName: 'Táxi 3D'
    };
    taxis.push(taxi);
    world.vehicles.push(taxi);
  }

  function createStop(stop) {
    const group = new THREE.Group();
    const concrete = new THREE.MeshStandardMaterial({ color: 0xb8b7ad, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x34434a, metalness: 0.45, roughness: 0.55 });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 2.5), signMaterial);
    roof.position.set(0, 2.9, 0);
    group.add(roof);

    for (const x of [-2.65, 2.65]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.8, 0.14), metal);
      post.position.set(x, 1.4, 0);
      group.add(post);
    }

    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.16, 0.55), concrete);
    bench.position.set(0, 0.55, -0.35);
    group.add(bench);

    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.12), signMaterial);
    board.position.set(0, 2.0, 1.24);
    group.add(board);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#173d38';
    ctx.fillRect(0, 0, 512, 180);
    ctx.fillStyle = '#f2c65d';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PARAGEM DE TÁXI', 256, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 43px Arial';
    ctx.fillText(stop.name.toUpperCase(), 256, 132);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 0.75), new THREE.MeshBasicMaterial({ map: texture }));
    label.position.set(0, 2.0, 1.31);
    group.add(label);

    group.position.set(stop.x - 2.0, 0, stop.z + 3.2);
    scene.add(group);
  }

  buildRoadGraph();
  for (const stop of stops) {
    createStop(stop);
    createTaxi(stop);
  }

  const panel = document.createElement('section');
  panel.id = 'taxi-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <div class="taxi-head">
      <div><small>ANGOLA LIFE 3D · TRANSPORTE</small><h2>Táxi de Luanda</h2></div>
      <button type="button" id="taxi-close" aria-label="Fechar">✕</button>
    </div>
    <p class="taxi-origin"></p>
    <p class="taxi-subtitle">Escolhe a paragem ou o município onde queres chegar. O preço aparece antes de confirmares.</p>
    <div class="taxi-balance"></div>
    <div class="taxi-destinations"></div>
    <p class="taxi-message" role="status"></p>
  `;
  game.appendChild(panel);

  const style = document.createElement('style');
  style.id = 'taxi-transport-styles';
  style.textContent = `
    #taxi-panel{position:absolute;z-index:65;left:50%;top:50%;transform:translate(-50%,-50%);width:min(94vw,460px);max-height:86vh;overflow:auto;display:none;padding:17px;color:#fff;background:#14231ef7;border:1px solid #ffffff35;border-radius:17px;box-shadow:0 16px 50px #000b;font-family:Arial,sans-serif;touch-action:pan-y}
    #taxi-panel.visible{display:block}
    .taxi-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .taxi-head small{color:#e5ad35;font-size:10px;font-weight:900;letter-spacing:1.2px}
    .taxi-head h2{margin:5px 0;font-size:22px}
    #taxi-close{width:38px;height:38px;border-radius:9px;background:#803e32;color:#fff}
    .taxi-origin{margin:10px 0 5px;padding:10px;border-radius:9px;background:#20382f;color:#f2c65d;font-weight:800}
    .taxi-subtitle{color:#d3ddd8;font-size:13px;line-height:1.45}
    .taxi-balance{margin:10px 0;padding:10px;border-radius:9px;background:#20382f;color:#fff;font-size:13px}
    .taxi-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid #ffffff20}
    .taxi-row strong{display:block;font-size:13px}
    .taxi-row span{display:block;margin-top:4px;color:#e5bd6b;font-size:11px}
    .taxi-select{flex-shrink:0;padding:9px 11px;border-radius:8px;background:#d59b32;color:#17221e;font-size:12px;font-weight:900}
    .taxi-select:disabled{opacity:.45}
    .taxi-message{min-height:20px;margin:10px 0 0;color:#bce7c6;font-size:12px;line-height:1.45}
  `;
  document.head.appendChild(style);

  const originLabel = panel.querySelector('.taxi-origin');
  const balanceLabel = panel.querySelector('.taxi-balance');
  const list = panel.querySelector('.taxi-destinations');
  const message = panel.querySelector('.taxi-message');

  function openPanel(taxi) {
    if (!taxi || taxi.occupied || activeRoute) return false;
    activeTaxi = taxi;
    menuOpen = true;
    originLabel.textContent = `Origem: Paragem de ${taxi.stop.name}`;
    balanceLabel.textContent = `Carteira disponível: ${money(services.getBalance())}`;
    message.textContent = '';
    list.innerHTML = '';

    for (const destination of DISTRICTS) {
      if (destination.name === taxi.stop.districtName) continue;
      const path = shortestRoute(taxi.stop, destination);
      const distance = routeDistance(path);
      const fare = Math.max(1000, Math.ceil((600 + distance * 7.2) / 100) * 100);
      const row = document.createElement('div');
      row.className = 'taxi-row';
      const info = document.createElement('div');
      const title = document.createElement('strong');
      const detail = document.createElement('span');
      title.textContent = destination.name;
      detail.textContent = `${(distance / 1000).toFixed(1)} km · ${money(fare)}`;
      info.append(title, detail);
      const button = document.createElement('button');
      button.className = 'taxi-select';
      button.type = 'button';
      button.textContent = 'VIAJAR';
      button.addEventListener('click', () => startTrip(taxi, destination, path, fare, button));
      row.append(info, button);
      list.appendChild(row);
    }

    panel.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
    return true;
  }

  async function startTrip(taxi, destination, path, fare, button) {
    if (activeRoute || taxi !== activeTaxi) return;
    button.disabled = true;
    message.textContent = 'A confirmar o pagamento...';
    try {
      const paid = await services.charge(fare);
      if (!paid) {
        message.textContent = 'Saldo insuficiente para esta viagem.';
        button.disabled = false;
        return;
      }
      player.keys = {};
      player.moveTarget = null;
      player.enterVehicle(taxi);
      taxi.occupied = true;
      taxi.speed = 0;
      activeRoute = {
        taxi,
        destination,
        path,
        segment: 0,
        progress: 0,
        speed: 23
      };
      close();
    } catch (error) {
      message.textContent = error?.message || 'Não foi possível pagar a viagem.';
      button.disabled = false;
    }
  }

  function close() {
    menuOpen = false;
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
    activeTaxi = null;
  }

  panel.querySelector('#taxi-close').addEventListener('click', close);
  panel.addEventListener('click', event => {
    if (event.target === panel) close();
  });

  function findNearestTaxi() {
    if (player.currentVehicle || player.sitting) return null;
    let nearest = null;
    let best = 9;
    for (const taxi of taxis) {
      if (taxi.occupied) continue;
      const distance = Math.hypot(
        player.group.position.x - taxi.group.position.x,
        player.group.position.z - taxi.group.position.z
      );
      if (distance < best) { best = distance; nearest = taxi; }
    }
    return nearest;
  }

  function update(delta) {
    if (!activeRoute) return;
    const route = activeRoute;
    const taxi = route.taxi;
    let remaining = route.speed * delta;

    while (remaining > 0 && route.segment < route.path.length - 1) {
      const from = route.path[route.segment];
      const to = route.path[route.segment + 1];
      const length = from.distanceTo(to);
      if (length < 0.001) { route.segment++; route.progress = 0; continue; }
      const available = length - route.progress;
      const step = Math.min(remaining, available);
      route.progress += step;
      remaining -= step;
      const t = route.progress / length;
      taxi.group.position.lerpVectors(from, to, t);
      taxi.group.position.y = 0;
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      taxi.group.rotation.y = Math.atan2(-dx, -dz);
      if (route.progress >= length - 0.001) {
        route.segment++;
        route.progress = 0;
      }
    }

    if (route.segment >= route.path.length - 1) {
      taxi.group.position.set(route.destination.x, 0, route.destination.z);
      player.exitVehicle();
      taxi.occupied = false;
      taxi.speed = 0;
      activeRoute = null;
    }
  }

  function isOpen() { return menuOpen; }

  return {
    findNearestTaxi,
    open: openPanel,
    close,
    isOpen,
    update,
    isTravelling: () => Boolean(activeRoute),
    isTaxi: vehicle => Boolean(vehicle?.isTaxi)
  };
}
