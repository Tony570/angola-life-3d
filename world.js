import * as THREE from 'three';
import { createPeople } from './people.js';

export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    buildings: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
      { name: 'Banco Nacional', x: -50, z: 58 },
      { name: 'Boutique Central', x: -50, z: 29 },
      { name: 'Concessionária de Automóveis', x: 50, z: 58 },
      { name: 'Hotel Central', x: 91, z: 29 },
      { name: 'Esquadra de Polícia', x: 50, z: -42 },
      { name: 'Hospital Municipal', x: 91, z: 101 },
      { name: 'Mercado', x: -78, z: -18 },
      { name: 'Posto de Combustível', x: 78, z: -28 },
      { name: 'Sabor de Luanda', x: -55, z: -12 },
      { name: 'Cantinho da Ilha', x: -55, z: -35 },
      { name: 'Paladar Angolano', x: -55, z: -58 },
      { name: 'Centro de Luanda', x: 35, z: -35 },
      { name: 'Zona Comercial', x: -40, z: -35 },
      { name: 'Bairro Residencial', x: 40, z: 40 },
      { name: 'Marginal', x: -35, z: 40 }
    ]
  };

  const M = {
    grass: new THREE.MeshStandardMaterial({ color: 0x777d45, roughness: 1 }),
    grass2: new THREE.MeshStandardMaterial({ color: 0x85865a, roughness: 1 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x303236, roughness: 1 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xaaa397, roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958d }),
    white: new THREE.MeshStandardMaterial({ color: 0xe9e4d8 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe4b72e }),
    black: new THREE.MeshStandardMaterial({ color: 0x202124 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x769eaa, roughness: 0.25, metalness: 0.15,
      transparent: true, opacity: 0.72
    }),
    window: new THREE.MeshStandardMaterial({ color: 0x263b43 }),
    green: new THREE.MeshStandardMaterial({ color: 0x347342 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x43834b }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x765035 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd0b17b }),
    water: new THREE.MeshStandardMaterial({ color: 0x2389a9, roughness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555b5d, metalness: 0.65 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x765037 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9c382b }),
    blue: new THREE.MeshStandardMaterial({ color: 0x315c75 })
  };

  function box(parent, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, radius, height, material) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 12),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addSign(group, title, subtitle, color, width, depth) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101b25';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 24, 256);
    ctx.strokeStyle = '#f4d37a';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 1000, 232);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px Arial';
    ctx.fillText(title.toUpperCase(), 530, 105, 900);
    ctx.fillStyle = '#f4d37a';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(subtitle.toUpperCase(), 530, 190, 900);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(width * 0.82, 14), 1.35),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      })
    );

    sign.position.set(0, 3.55, depth / 2 + 0.28);
    group.add(sign);

    box(
      group, 0, 2.55, depth / 2 + 0.48,
      Math.min(width * 0.9, 15), 0.22, 1.35,
      new THREE.MeshStandardMaterial({ color })
    );
  }

  function makeBuilding(config) {
    const {
      x, z, width, depth, floors,
      name, subtitle, color, kind
    } = config;

    const group = new THREE.Group();
    const height = floors * 3.2;

    const wall = new THREE.MeshStandardMaterial({
      color: config.wallColor || 0xe5c49a,
      roughness: 0.9
    });

    const front = depth / 2;

    box(group, 0, 0, 0, width, 0.3, depth, M.concrete);

    box(group, -width / 2 + 0.16, 0.3, 0, 0.32, height, depth, wall);
    box(group, width / 2 - 0.16, 0.3, 0, 0.32, height, depth, wall);
    box(group, 0, 0.3, -depth / 2 + 0.16, width, height, 0.32, wall);

    box(group, -width / 2 + 0.16, 0.3, front, width * 0.25, height, 0.32, wall);
    box(group, width / 2 - 0.16, 0.3, front, width * 0.25, height, 0.32, wall);
    box(group, 0, 2.8, front, width * 0.5, height - 2.5, 0.32, wall);

    for (let floor = 0; floor < floors; floor++) {
      const y = floor * 3.2 + 0.85;

      for (let i = 0; i < 3; i++) {
        const wx = -width / 2 + (i + 1) * width / 4;

        if (floor === 0 && Math.abs(wx) < 2.5) continue;

        box(group, wx, y, front + 0.18, 1.65, 1.65, 0.08, M.window);
        box(group, wx, y + 0.08, front + 0.23, 1.48, 1.42, 0.04, M.glass);
      }
    }

    box(group, 0, height, 0, width + 0.5, 0.35, depth + 0.5, M.concrete);

    box(group, 0, 0.02, front + 0.8, 4.5, 0.16, 1.5, M.concrete);

    if (kind === 'bank') {
      for (const px of [-4, 4]) {
        box(group, px, 0.35, -2, 0.25, 2.8, 0.25, M.concrete);
      }

      box(group, 0, 0.8, 0, 8, 1, 0.8, M.wood);
      box(group, 0, 1.85, 0, 8, 0.12, 0.9, M.yellow);

      for (const px of [-3, 0, 3]) {
        box(group, px, 0.35, -4, 1.4, 1.2, 0.8, M.blue);
      }
    }

    if (kind === 'boutique') {
      for (const px of [-4, 0, 4]) {
        box(group, px, 0.4, -1.5, 0.12, 2.2, 0.12, M.metal);
        box(group, px, 2.5, -1.5, 2.2, 0.12, 0.12, M.metal);

        const colors = [M.red, M.blue, M.yellow, M.green];

        for (let i = 0; i < 4; i++) {
          box(group, px - 0.7 + i * 0.45, 0.8, -1.4, 0.35, 1.1, 0.15, colors[i]);
        }
      }

      box(group, 0, 0.4, 2, 5.5, 0.9, 0.8, M.wood);
    }

    if (kind === 'car-dealer') {
      const paints = [0xc62828, 0xeeeeee, 0x2255aa];

      paints.forEach((paint, index) => {
        const px = (index - 1) * 4.5;
        const body = new THREE.MeshStandardMaterial({ color: paint });

        box(group, px, 0.4, -1, 2.1, 0.65, 3.6, body);
        box(group, px, 1.05, -1.2, 1.6, 0.65, 1.8, M.glass);

        for (const wx of [-0.9, 0.9]) {
          for (const wz of [-2, 0.1]) {
            const wheel = new THREE.Mesh(
              new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12),
              M.black
            );
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(px + wx, 0.4, -1 + wz);
            group.add(wheel);
          }
        }
      });
    }

    if (kind === 'hotel') {
      for (const px of [-5, 5]) {
        cylinder(group, px, 0.3, front + 0.3, 0.3, 2.5, M.white);
      }

      box(group, 0, 0.4, 0, 8, 1, 0.7, M.wood);
      box(group, 0, 1.5, 0, 8, 0.12, 0.8, M.yellow);
    }

    if (kind === 'police') {
      box(group, 0, 0.4, front + 0.3, 8, 0.3, 0.15, M.blue);
      box(group, 0, 0.75, front + 0.3, 8, 0.1, 0.15, M.white);
      box(group, 0, 0.9, front + 0.3, 8, 0.12, 0.15, M.blue);
    }

    if (kind === 'hospital') {
      box(group, 0, 4.4, front + 0.3, 1.8, 0.4, 0.2, M.red);
      box(group, 0, 3.7, front + 0.3, 0.4, 1.8, 0.2, M.red);
    }

    addSign(group, name, subtitle, color, width, depth);

    group.position.set(x, 0, z);
    scene.add(group);

    world.buildings.push({
      group,
      x,
      z,
      width,
      depth,
      floors,
      type: 'shop',
      facility: name,
      kind,
      entranceX: x,
      entranceZ: z + depth / 2 + 1.5
    });

    return group;
  }

  function makeOrdinaryBuilding(x, z, width, depth, floors, type) {
    const group = new THREE.Group();
    const height = floors * 3.2;

    const colors = [
      0xe5c49a, 0xd8a77f, 0xf0dfbd,
      0xc9b7a0, 0xe2d3b9, 0xd4a18c
    ];

    const wall = new THREE.MeshStandardMaterial({
      color: colors[Math.abs(Math.floor(x * 3 + z * 7)) % colors.length]
    });

    box(group, 0, 0, 0, width, 0.3, depth, M.concrete);
    box(group, -width / 2, 0.3, 0, 0.3, height, depth, wall);
    box(group, width / 2, 0.3, 0, 0.3, height, depth, wall);
    box(group, 0, 0.3, -depth / 2, width, height, 0.3, wall);
    box(group, 0, 0.3, depth / 2, width * 0.45, height, 0.3, wall);

    for (let floor = 0; floor < floors; floor++) {
      for (let i = 0; i < 3; i++) {
        const wx = -width / 2 + (i + 1) * width / 4;
        const wy = floor * 3.2 + 0.9;

        box(group, wx, wy, depth / 2 + 0.17, 1.5, 1.6, 0.08, M.window);
        box(group, wx, wy + 0.08, depth / 2 + 0.22, 1.32, 1.4, 0.04, M.glass);
      }
    }

    box(group, 0, height, 0, width + 0.4, 0.3, depth + 0.4, M.concrete);

    group.position.set(x, 0, z);
    scene.add(group);

    world.buildings.push({
      group, x, z, width, depth, floors,
      type: type || 'house',
      entranceX: x,
      entranceZ: z + depth / 2 + 1
    });

    return group;
  }

  function makeRoad(x, z, width, length, horizontal = true) {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(
        horizontal ? length : width,
        horizontal ? width : length
      ),
      M.asphalt
    );

    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.025, z);
    scene.add(road);

    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(
        new THREE.PlaneGeometry(
          horizontal ? length : 2.6,
          horizontal ? 2.6 : length
        ),
        M.sidewalk
      );

      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(
        horizontal ? x : x + side * (width / 2 + 1.4),
        0.052,
        horizontal ? z + side * (width / 2 + 1.4) : z
      );

      scene.add(sidewalk);
    }

    if (width >= 12) {
      for (let i = -length / 2 + 8; i < length / 2 - 5; i += 14) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 4 : 0.15,
            0.025,
            horizontal ? 0.15 : 4
          ),
          M.yellow
        );

        line.position.set(
          horizontal ? x + i : x,
          0.05,
          horizontal ? z : z + i
        );

        scene.add(line);
      }
    }
  }

  function buildRoads() {
    makeRoad(0, 0, 16, 230, false);
    makeRoad(0, 0, 16, 230, true);

    [-70, -35, 35, 70].forEach(position => {
      makeRoad(position, 0, 10, 220, false);
      makeRoad(0, position, 10, 220, true);
    });
  }

  function makeTree(x, z, palm = false) {
    const group = new THREE.Group();

    cylinder(group, 0, 0, 0, palm ? 0.2 : 0.3, palm ? 5 : 2.5, M.trunk);

    if (palm) {
      const leaves = new THREE.MeshStandardMaterial({ color: 0x287443 });

      for (let i = 0; i < 8; i++) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 3.5, 5),
          leaves
        );

        leaf.position.set(
          Math.cos(i * Math.PI / 4) * 1.15,
          4.9,
          Math.sin(i * Math.PI / 4) * 1.15
        );

        leaf.rotation.z = Math.cos(i * Math.PI / 4) * 1.1;
        leaf.rotation.x = Math.sin(i * Math.PI / 4) * 1.1;
        group.add(leaf);
      }
    } else {
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 8, 7),
        M.leaf
      );

      crown.position.y = 3.2;
      crown.scale.set(1, 1.2, 1);
      group.add(crown);
    }

    group.position.set(x, 0, z);
    scene.add(group);
  }

  function buildTrees() {
    for (let i = -100; i <= 100; i += 20) {
      makeTree(i, -12, i % 40 === 0);
      makeTree(i, 12, false);
      makeTree(-12, i, true);
      makeTree(12, i, false);
    }

    for (let i = 0; i < 22; i++) {
      const x = -95 + (i * 29) % 190;
      const z = -95 + (i * 47) % 190;

      if (Math.abs(x) < 20 || Math.abs(z) < 20) continue;

      makeTree(x, z, i % 3 === 0);
    }
  }

  function makeMarket() {
    const group = new THREE.Group();

    box(group, 0, 0, 0, 18, 0.3, 14, M.concrete);

    const roof = new THREE.MeshStandardMaterial({
      color: 0x23633d,
      roughness: 0.8
    });

    box(group, 0, 4.2, 0, 18, 0.45, 14, roof);

    for (const x of [-8, -4, 0, 4, 8]) {
      for (const z of [-5.5, 5.5]) {
        box(group, x, 0.3, z, 0.3, 3.9, 0.3, M.white);
      }
    }

    const productColors = [
      M.red, M.yellow, M.green, M.white
    ];

    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.8;

      box(group, x, 0.4, -1.5, 3, 1, 2.5, M.wood);
      box(group, x, 1.45, -1.5, 3.1, 0.15, 2.6, M.yellow);

      for (let j = 0; j < 5; j++) {
        const product = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.45, 0.35),
          productColors[j % productColors.length]
        );

        product.position.set(
          x - 1.1 + j * 0.55,
          1.85,
          -1.5
        );

        group.add(product);
      }

      box(group, x, 2.2, 3, 3, 0.15, 2, M.white);
    }

    box(group, 0, 0.35, 5, 12, 0.5, 1, M.wood);

    group.position.set(-78, 0, -25);
    scene.add(group);

    addGroundSign('MERCADO', '#23633d', -78, 5, -17);
  }

  function makeFuelStation() {
    const group = new THREE.Group();

    box(group, 0, 0, 0, 18, 0.3, 15, M.concrete);

    box(
      group, 0, 4.5, 0, 18, 0.45, 15,
      new THREE.MeshStandardMaterial({ color: 0xd8a323 })
    );

    box(group, 0, 4.25, 0, 18, 0.12, 15, M.red);

    for (const x of [-7, 7]) {
      for (const z of [-5.5, 5.5]) {
        box(group, x, 0.3, z, 0.45, 4, 0.45, M.white);
      }
    }

    for (let i = -1; i <= 1; i++) {
      const x = i * 5;

      box(group, x, 0.3, 0, 1.3, 1.8, 1, M.white);
      box(group, x, 2.15, 0, 1, 0.45, 0.12, M.black);

      box(group, x, 1.55, 0.55, 0.6, 0.12, 0.08, M.blue);

      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.045, 8, 16, Math.PI),
        M.black
      );

      hose.position.set(x + 0.6, 1.2, 0.3);
      hose.rotation.z = Math.PI / 2;
      group.add(hose);

      box(group, x + 0.85, 0.65, 0.3, 0.12, 0.6, 0.12, M.black);
    }

    box(group, -5, 0.3, -8, 8, 0.15, 3, M.blue);

    group.position.set(78, 0, -35);
    scene.add(group);

    addGroundSign('POSTO DE COMBUSTÍVEL', '#d8a323', 78, 5.5, -27);
  }

  function addGroundSign(title, color, x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 768, 192);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 752, 176);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 384, 96, 720);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2.6),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      })
    );

    sign.position.set(x, y, z);
    scene.add(sign);
  }

  function makeCar(x, z, color, rotation = 0) {
    const group = new THREE.Group();

    const body = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.45
    });

    box(group, 0, 0.35, 0, 2.2, 0.65, 4.2, body);
    box(group, 0, 1, -0.25, 1.8, 0.75, 2.1, M.glass);
    box(group, 0, 0.7, 1.25, 2, 0.2, 1.2, body);

    for (const wx of [-1.05, 1.05]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.25, 12),
          M.black
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.4, wz);
        group.add(wheel);
      }
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);

    world.vehicles.push({
      group,
      speed: 0,
      occupied: false
    });

    return group;
  }

  function buildCity() {
    const facilities = [
      {
        x: -50, z: 50, name: 'Banco Nacional',
        subtitle: 'Serviços bancários',
        width: 18, depth: 14, floors: 3,
        color: 0x245b83, kind: 'bank'
      },
      {
        x: -50, z: 21, name: 'Boutique Central',
        subtitle: 'Moda e vestuário',
        width: 16, depth: 14, floors: 2,
        color: 0x8d315c, kind: 'boutique'
      },
      {
        x: 50, z: 50, name: 'Concessionária',
        subtitle: 'Venda de viaturas',
        width: 20, depth: 16, floors: 2,
        color: 0x315f83, kind: 'car-dealer'
      },
      {
        x: 91, z: 21, name: 'Hotel Central',
        subtitle: 'Alojamento e recepção',
        width: 18, depth: 16, floors: 4,
        color: 0x9b762d, kind: 'hotel'
      },
      {
        x: 50, z: -50, name: 'Esquadra de Polícia',
        subtitle: 'Polícia Nacional',
        width: 16, depth: 14, floors: 2,
        color: 0x24466f, kind: 'police'
      },
      {
        x: 91, z: 91, name: 'Hospital Municipal',
        subtitle: 'Urgência e consultas',
        width: 20, depth: 18, floors: 3,
        color: 0x9d3030, kind: 'hospital'
      }
    ];

    const positions = [-88, -53, -18, 18, 53, 88];

    positions.forEach((x, xi) => {
      positions.forEach((z, zi) => {
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return;

        const bx = x + (xi % 2 ? 3 : -3);
        const bz = z + (zi % 2 ? 3 : -3);

        const nearFacility = facilities.some(item =>
          Math.abs(item.x - bx) < 16 &&
          Math.abs(item.z - bz) < 16
        );

        if (nearFacility) return;

        const floors = 1 + ((xi * 3 + zi * 5) % 5);
        const type = floors >= 4 ? 'apartment' : 'house';

        makeOrdinaryBuilding(bx, bz, 14, 12, floors, type);
      });
    });

    facilities.forEach(makeBuilding);

    makeOrdinaryBuilding(-25, -25, 18, 18, 5, 'office');
    makeOrdinaryBuilding(25, -25, 18, 18, 5, 'office');
    makeOrdinaryBuilding(-25, 25, 18, 18, 4, 'apartment');
    makeOrdinaryBuilding(25, 25, 18, 18, 4, 'apartment');
  }

  function makePark() {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.25, 25),
      M.grass2
    );

    park.position.set(0, 0.08, 0);
    scene.add(park);

    cylinder(scene, 0, 0.2, 0, 3.4, 0.5, M.concrete);
    cylinder(scene, 0, 0.7, 0, 2.8, 0.15, M.water);
    cylinder(scene, 0, 0.85, 0, 0.45, 2.1, M.concrete);

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const bench = new THREE.Group();

      box(bench, 0, 0.65, 0, 3, 0.2, 0.8, M.wood);
      box(bench, 0, 0.9, -0.3, 3, 0.9, 0.15, M.wood);

      bench.position.set(
        Math.cos(angle) * 8,
        0,
        Math.sin(angle) * 8
      );

      bench.rotation.y = -angle;
      scene.add(bench);
    }
  }

  function makeCoast() {
    box(scene, -116, -0.3, 0, 12, 0.25, 230, M.sand);
    box(scene, -128, -0.4, 0, 14, 0.25, 260, M.water);
    box(scene, -108, 0, 0, 3, 0.25, 230, M.sidewalk);

    for (let z = -100; z <= 100; z += 18) {
      makeTree(-106, z, true);
    }
  }

  function buildStreetLamps() {
    for (let i = -100; i <= 100; i += 25) {
      for (const [x, z] of [
        [-10, i], [10, i], [i, -10], [i, 10]
      ]) {
        const lamp = new THREE.Group();

        cylinder(lamp, 0, 0, 0, 0.08, 5, M.black);
        box(lamp, 0.35, 4.8, 0, 0.9, 0.1, 0.12, M.black);

        box(
          lamp, 0.75, 4.75, 0,
          0.65, 0.18, 0.35,
          new THREE.MeshStandardMaterial({
            color: 0xffedb1,
            emissive: 0xffc75a,
            emissiveIntensity: 0.45
          })
        );

        lamp.position.set(x, 0, z);
        scene.add(lamp);
      }
    }
  }

  // Construção da cidade
  box(scene, 0, -1.2, 0, 260, 1, 260, M.grass);

  makeCoast();
  buildRoads();
  buildCity();
  makePark();
  buildTrees();
  buildStreetLamps();

  // Estabelecimentos comerciais
  makeMarket();
  makeFuelStation();

  // Habitantes
  createPeople(scene, world);

  // Viaturas da cidade
  makeCar(5, 25, 0xc62828, 0);
  makeCar(-42, 35, 0xeeeeee, Math.PI / 2);
  makeCar(55, -70, 0x2255aa, Math.PI / 2);
  makeCar(-72, 70, 0x252525, 0);

  return world;
}
