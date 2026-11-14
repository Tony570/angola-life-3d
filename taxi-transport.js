import * as THREE from 'three';

const STOPS = [
  { name: 'Cacuaco', x: -300, z: -410 },
  { name: 'Mulenvos', x: -105, z: -390 },
  { name: 'Sambizanga', x: -115, z: -195 },
  { name: 'Ingombota', x: 0, z: 0 },
  { name: 'Rangel', x: 105, z: -125 },
  { name: 'Maianga', x: 155, z: 35 },
  { name: 'Cazenga', x: 265, z: -235 },
  { name: 'Hoji ya Henda', x: 355, z: -95 },
  { name: 'Viana', x: 390, z: 165 },
  { name: 'Kilamba Kiaxi', x: 225, z: 285 },
  { name: 'Camama', x: 405, z: 365 },
  { name: 'Talatona', x: -115, z: 350 },
  { name: 'Belas', x: -330, z: 385 },
  { name: 'Mussulo', x: -465, z: 185 },
  { name: 'Samba', x: 5, z: 235 },
  { name: 'Kilamba', x: -65, z: 515 }
];

const ARTERIAL = [
  [-300, -410, -115, -195], [-115, -195, 0, 0],
  [0, 0, 155, 35], [155, 35, 225, 285],
  [225, 285, 405, 365], [0, 0, 5, 235],
  [5, 235, -115, 350], [-115, 350, -330, 385],
  [-330, 385, -465, 185], [0, 0, 105, -125],
  [105, -125, 265, -235], [265, -235, 355, -95],
  [355, -95, 390, 165], [390, 165, 405, 365],
  [-105, -390, -300, -410], [-65, 515, -115, 350]
];

const money = value => `${Math.round(value).toLocaleString('pt-PT')} Kz`;

export function createTaxiTransport({ scene, world, player, services, game }) {
  const stops = STOPS.map((stop, index) => ({ ...stop, id: index }));
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
    const xs = [-430, -300, -100, 150, 390, 430];
    const zs = [-500, -300, -80, 150, 390, 530];

    for (const z of [-300, -80, 150, 390]) {
      const row = xs.map(x => addRoadNode(x, z));
      for (let i = 0; i < row.length - 1; i++) connect(row[i], row[i + 1]);
    }

    for (const x of [-300, -100, 150, 390]) {
      const column = zs.map(z => addRoadNode(x, z));
      for (let i = 0; i < column.length - 1; i++) connect(column[i], column[i + 1]);
    }

    for (const [x1, z1, x2, z2] of ARTERIAL) {
      connect(addRoadNode(x1, z1), addRoadNode(x2, z2));
    }

    for (const stop of stops) {
      const stopNode = addRoadNode(stop.x, stop.z);
      const nearest = roadNodes
        .filter(node => node.key !== stopNode.key)
        .map(node => ({ node, distance: Math.hypot(node.x - stop.x, node.z - stop.z) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      for (const candidate of nearest) connect(stopNode, candidate.node);
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
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.72, 4.4), bodyMaterial);
    body.position.y = 0.82;
    body.castShadow = true;
    group.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.88, 2.35), glassMaterial);
    cabin.position.set(0, 1.55, -0.28);
    group.add(cabin);

    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.28, 1.18), whiteMaterial);
    bonnet.position.set(0, 1.12, 1.38);
    group.add(bonnet);

    for (const x of [-1.12, 1.12]) {
      for (const z of [-1.45, 1.45]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 14), darkMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.48, z);
        group.add(wheel);
      }
    }

    const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.34), goldMaterial);
    roofSign.position.set(0, 2.08, -0.2);
    group.add(roofSign);

    group.position.set(stop.x + 5.2, 0, stop.z + 4.5);
    group.rotation.y = Math.atan2(-5.2, -4.5);
    scene.add(group);

    const taxi = {
      group,
      speed: 0,
      occupied: false,
      isTaxi: true,
      stop,
      stationId: stop.id
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

    group.position.set(stop.x - 5.2, 0, stop.z - 4.5);
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

    for (const destination of stops) {
      if (destination.id === taxi.stop.id) continue;
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
        distance,
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
