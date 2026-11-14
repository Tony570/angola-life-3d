
import * as THREE from 'three';
import { attachRealCar } from './vehicle-models.js';
import { createPeople } from './people.js';

export function createWorld(scene) {
  const world = {
    vehicles: [],
    trafficVehicles: [],
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

  const mat = (color, roughness = 0.85, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const M = {
    grass: mat(0x78845a),
    grassDark: mat(0x596d45),
    asphalt: mat(0x292e33, 0.98),
    roadLine: mat(0xf1d36c),
    whiteLine: mat(0xe8e7df),
    sidewalk: mat(0xbab6aa),
    curb: mat(0x77766f),
    concrete: mat(0xaaa69d),
    roof: mat(0x754333),
    white: mat(0xf1eee5),
    cream: mat(0xe8d7bd),
    sand: mat(0xd1b58b),
    dark: mat(0x20282c),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x9acbd4,
      roughness: 0.16,
      metalness: 0.12,
      transparent: true,
      opacity: 0.66
    }),
    window: mat(0x263c48, 0.3),
    metal: mat(0x596267, 0.35, 0.65),
    gold: mat(0xc99a3e, 0.35, 0.45),
    wood: mat(0x805538),
    woodLight: mat(0xb48655),
    green: mat(0x34784a),
    leaf: mat(0x47834b),
    leafDark: mat(0x28633c),
    trunk: mat(0x765038),
    red: mat(0xa8322d),
    blue: mat(0x285d82),
    yellow: mat(0xe0b333),
    water: mat(0x258ca7, 0.25)
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

  function cylinder(parent, x, y, z, radius, height, material, segments = 16) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, segments),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function textSign(parent, title, subtitle, color, width, depth) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#13242b';
    ctx.fillRect(0, 0, 1024, 256);

    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 25, 256);

    ctx.strokeStyle = '#e9c46a';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 1000, 232);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 75px Arial';
    ctx.fillText(title.toUpperCase(), 525, 103, 900);

    ctx.fillStyle = '#f1cf7b';
    ctx.font = 'bold 31px Arial';
    ctx.fillText(subtitle.toUpperCase(), 525, 190, 900);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(width * 0.84, 15), 1.45),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
      })
    );

    sign.position.set(0, 3.6, depth / 2 + 0.24);
    parent.add(sign);

    box(
      parent, 0, 2.75, depth / 2 + 0.3,
      Math.min(width * 0.9, 15.5), 0.16, 0.45,
      M.gold
    );
  }

  function addDoor(group, x, z, width = 2.1, height = 2.5) {
    box(group, x, 0.3, z, width + 0.35, height + 0.25, 0.18, M.dark);
    box(group, x, 0.38, z + 0.12, width, height - 0.15, 0.08, M.glass);
    box(group, x + width / 2 - 0.2, 1.2, z + 0.2, 0.07, 0.55, 0.08, M.gold);
    box(group, x, height + 0.55, z, width + 0.8, 0.14, 0.32, M.gold);
  }

  function addWindow(group, x, y, z, width = 2, height = 1.65) {
    box(group, x, y, z, width + 0.2, height + 0.2, 0.15, M.dark);
    box(group, x, y + 0.08, z + 0.1, width, height, 0.06, M.glass);
    box(group, x, y + height / 2, z + 0.16, 0.055, height, 0.06, M.metal);
    box(group, x, y + 0.05, z + 0.16, width, 0.055, 0.06, M.metal);
  }

  function makeBuilding(config) {
    const {
      x, z, width, depth, floors,
      name, subtitle, color, kind
    } = config;

    const group = new THREE.Group();
    const height = floors * 3.2;
    const front = depth / 2;
    const wall = mat(config.wallColor || 0xe5d3b7);

    box(group, 0, 0, 0, width, 0.32, depth, M.concrete);

    // Paredes laterais e traseira
    box(group, -width / 2 + 0.16, 0.32, 0, 0.32, height, depth, wall);
    box(group, width / 2 - 0.16, 0.32, 0, 0.32, height, depth, wall);
    box(group, 0, 0.32, -depth / 2 + 0.16, width, height, 0.32, wall);

    // Fachada com abertura central
    box(group, -width * 0.36, 0.32, front, width * 0.28, height, 0.32, wall);
    box(group, width * 0.36, 0.32, front, width * 0.28, height, 0.32, wall);
    box(group, 0, 3.0, front, width * 0.44, height - 2.75, 0.32, wall);

    // Janelas dos andares
    for (let floor = 0; floor < floors; floor++) {
      const y = floor * 3.2 + 1.05;

      for (let i = 0; i < 3; i++) {
        const wx = -width / 2 + (i + 1) * width / 4;

        if (floor === 0 && i === 1) continue;

        addWindow(group, wx, y, front + 0.19, 1.8, 1.55);

        box(group, wx, y - 0.83, front + 0.28, 2.05, 0.12, 0.28, M.concrete);
      }
    }

    // Cobertura e moldura
    box(group, 0, height + 0.32, 0, width + 0.65, 0.35, depth + 0.65, M.concrete);
    box(group, 0, 0.04, front + 1.0, 5.5, 0.16, 2.0, M.sidewalk);

    addDoor(group, 0, front + 0.22, 2.2, 2.45);

    if (kind === 'bank') {
      box(group, 0, 0.5, -2, 8, 0.9, 0.8, M.wood);
      box(group, 0, 1.42, -2, 8.1, 0.14, 0.9, M.gold);

      for (const px of [-3, 0, 3]) {
        box(group, px, 0.45, -4, 1.4, 1.1, 0.8, M.blue);
        box(group, px, 1.58, -4, 1.4, 0.1, 0.8, M.white);
      }

      for (const px of [-5, 5]) {
        cylinder(group, px, 0.35, front + 0.6, 0.22, 2.8, M.white);
      }
    }

    if (kind === 'boutique') {
      for (const px of [-4, 0, 4]) {
        box(group, px, 0.5, -1.5, 2.2, 2.1, 0.18, M.dark);

        const clothes = [M.red, M.blue, M.yellow, M.green];
        clothes.forEach((item, index) => {
          box(group, px - 0.7 + index * 0.45, 0.9, -1.35, 0.35, 1.0, 0.12, item);
        });
      }

      box(group, 0, 0.4, 2.0, 5.5, 0.9, 0.8, M.wood);
    }

    if (kind === 'car-dealer') {
      // Exposição com modelos 3D reais, sem carroçarias montadas com cubos.
      [-4.5, 0, 4.5].forEach((px, index) => {
        const displayCar = new THREE.Group();
        displayCar.position.set(px, 0.35, -1);
        displayCar.rotation.y = index === 1 ? Math.PI : 0;
        group.add(displayCar);
        attachRealCar(displayCar, {
          width: 2.25,
          length: 4.1,
          height: 1.55,
          paintColor: [0xc62828, 0xeeeeee, 0x2255aa][index]
        });
      });
    }

    if (kind === 'hotel') {
      for (const px of [-5, 5]) {
        cylinder(group, px, 0.3, front + 0.35, 0.28, 2.6, M.white);
      }

      box(group, 0, 0.4, 0, 8, 0.85, 0.8, M.wood);
      box(group, 0, 1.3, 0, 8.1, 0.14, 0.9, M.gold);

      for (const px of [-5, -2.5, 2.5, 5]) {
        addWindow(group, px, 4.2, front + 0.19, 1.8, 1.7);
      }
    }

    if (kind === 'police') {
      box(group, 0, 0.4, front + 0.3, 8, 0.35, 0.18, M.blue);
      box(group, 0, 0.85, front + 0.3, 8, 0.12, 0.18, M.white);
      box(group, 0, 1.02, front + 0.3, 8, 0.12, 0.18, M.blue);
    }

    if (kind === 'hospital') {
      box(group, 0, 4.4, front + 0.3, 2.0, 0.4, 0.2, M.red);
      box(group, 0, 3.7, front + 0.3, 0.4, 1.8, 0.2, M.red);
    }

    if (kind === 'boutique') {
      // Montra de vidro, toldo e moldura colorida própria da loja de roupa.
      box(group, 0, 1.55, front + 0.24, width * 0.72, 2.5, 0.12, M.glass);
      box(group, 0, 3.05, front + 0.55, width * 0.82, 0.28, 1.0, M.red);
      for (let stripe = -4; stripe <= 4; stripe++) {
        box(group, stripe * 1.55, 3.05, front + 1.08, 0.12, 0.28, 0.08, M.white);
      }
    } else if (kind === 'car-dealer') {
      box(group, 0, 1.7, front + 0.22, width * 0.82, 2.9, 0.12, M.glass);
      box(group, 0, 0.25, front + 1.0, width * 0.9, 0.18, 2.0, M.concrete);
    } else if (kind === 'hotel') {
      for (const px of [-width * 0.34, width * 0.34]) {
        box(group, px, 0.2, front + 0.9, 0.28, 2.8, 0.28, M.gold);
      }
      box(group, 0, 3.0, front + 0.75, width * 0.9, 0.2, 1.6, M.blue);
    } else if (kind === 'bank') {
      for (const px of [-width * 0.36, width * 0.36]) {
        box(group, px, 0.25, front + 0.65, 0.48, 3.1, 0.48, M.white);
      }
      box(group, 0, 0.2, front + 1.2, width * 0.82, 0.18, 2.3, M.gold);
    }

    textSign(group, name, subtitle, color, width, depth);

    group.position.set(x, 0, z);
    scene.add(group);

    world.buildings.push({
      group, x, z, width, depth, floors,
      type: 'shop',
      facility: name,
      kind,
      entranceX: x,
      entranceZ: z + depth / 2 + 1.5
    });

    return group;
  }

  function makeOrdinaryBuilding(x, z, width, depth, floors, type = 'house') {
    const group = new THREE.Group();
    const height = floors * 3.2;

    const colors = [
      0xe7d5b8, 0xd8b28d, 0xf0e3cd,
      0xc8b8a4, 0xe0c5a7, 0xd6a18c
    ];

    const index = Math.abs(Math.floor(x * 3 + z * 7)) % colors.length;
    const wall = mat(colors[index]);

    box(group, 0, 0, 0, width, 0.3, depth, M.concrete);

    // Paredes laterais e traseira; a fachada deixa vãos para portas e janelas.
    box(group, -width / 2 + 0.15, 0.3, 0, 0.3, height, depth, wall);
    box(group, width / 2 - 0.15, 0.3, 0, 0.3, height, depth, wall);
    box(group, 0, 0.3, -depth / 2 + 0.15, width, height, 0.3, wall);
    box(group, -width / 2 + 0.15, 0.3, depth / 2, 0.3, height, 0.3, wall);
    box(group, width / 2 - 0.15, 0.3, depth / 2, 0.3, height, 0.3, wall);
    box(group, 0, 2.5, depth / 2, width * 0.16, Math.max(0.2, height - 2.5), 0.3, wall);
    box(group, 0, 0.3, depth / 2, width * 0.16, 0.35, 0.3, wall);
    box(group, 0, height - 0.15, depth / 2, width, 0.3, 0.3, wall);

    for (let floor = 0; floor < floors; floor++) {
      for (let i = 0; i < 3; i++) {
        if (floor === 0 && i === 1) continue;
        const wx = -width / 2 + (i + 1) * width / 4;
        const wy = floor * 3.2 + 0.9;
        addWindow(group, wx, wy, depth / 2 + 0.18, 1.5, 1.55);
        box(group, wx, wy - 0.82, depth / 2 + 0.25, 1.7, 0.1, 0.22, M.concrete);
      }
    }

    // Porta principal de madeira com moldura e puxador metálico.
    box(group, 0, 0.35, depth / 2 + 0.2, 1.65, 2.25, 0.12, M.dark);
    box(group, 0, 0.42, depth / 2 + 0.29, 1.35, 2.0, 0.06, M.wood);
    cylinder(group, 0.48, 1.25, depth / 2 + 0.35, 0.055, 0.08, M.gold, 10);

    box(group, 0, height, 0, width + 0.5, 0.3, depth + 0.5, M.concrete);

    // Varandas e fachadas com acabamento próprio por tipo de edifício.
    if (floors >= 3) {
      for (let floor = 1; floor < floors; floor++) {
        box(group, 0, floor * 3.2 + 0.25, depth / 2 + 0.8, width * 0.75, 0.12, 1.2, M.concrete);
        box(group, 0, floor * 3.2 + 0.8, depth / 2 + 1.35, width * 0.75, 0.85, 0.08, M.metal);
      }
      box(group, -width / 2 + 0.45, 0.3, depth / 2 + 0.22, 0.28, height, 0.18, index % 2 ? M.gold : M.blue);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.5, 12), M.white);
      tank.position.set(width / 2 - 2, height + 1.05, -depth / 2 + 2);
      group.add(tank);
    } else if (type === 'house') {
      const roofColor = index % 2 ? M.roof : M.red;
      box(group, 0, height + 0.24, 0, width + 0.9, 0.28, depth + 0.9, roofColor);
      box(group, 0, 2.75, depth / 2 + 0.8, width * 0.55, 0.16, 1.5, M.white);
      for (const px of [-width * 0.25, width * 0.25]) {
        box(group, px, 0.2, depth / 2 + 0.8, 0.16, 2.55, 0.16, M.white);
      }
      box(group, -width / 2 - 1.0, 0.25, depth / 2 + 2.0, 0.16, 0.9, 2.4, M.white);
      box(group, width / 2 + 1.0, 0.25, depth / 2 + 2.0, 0.16, 0.9, 2.4, M.white);
      box(group, 0, 0.55, depth / 2 + 3.15, width * 0.45, 0.08, 0.08, M.metal);
    } else {
      // Escritórios com entrada envidraçada e friso de identificação.
      box(group, 0, 1.45, depth / 2 + 0.24, width * 0.68, 2.1, 0.1, M.glass);
      box(group, 0, height - 0.2, depth / 2 + 0.22, width * 0.9, 0.22, 0.18, M.blue);
    }

    group.position.set(x, 0, z);
    scene.add(group);

    world.buildings.push({
      group, x, z, width, depth, floors,
      type,
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

      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? length : 0.2,
          0.18,
          horizontal ? 0.2 : length
        ),
        M.curb
      );

      curb.position.set(
        horizontal ? x : x + side * (width / 2 + 2.65),
        0.12,
        horizontal ? z + side * (width / 2 + 2.65) : z
      );
      scene.add(curb);
    }

    if (width >= 12) {
      for (let i = -length / 2 + 8; i < length / 2 - 5; i += 14) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 4 : 0.15,
            0.025,
            horizontal ? 0.15 : 4
          ),
          M.roadLine
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
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.32, 3.5, 5),
          M.leafDark
        );

        leaf.position.set(
          Math.cos(angle) * 1.15,
          4.9,
          Math.sin(angle) * 1.15
        );

        leaf.rotation.z = Math.cos(angle) * 1.1;
        leaf.rotation.x = Math.sin(angle) * 1.1;
        group.add(leaf);
      }
    } else {
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 10, 8),
        M.leaf
      );
      crown.position.y = 3.2;
      crown.scale.set(1, 1.2, 1);
      crown.castShadow = true;
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

  function makeBench(x, z, rotation = 0) {
    const bench = new THREE.Group();

    box(bench, 0, 0.55, 0, 2.5, 0.16, 0.7, M.wood);
    box(bench, 0, 0.9, -0.27, 2.5, 0.65, 0.12, M.wood);

    for (const px of [-1, 1]) {
      box(bench, px, 0.05, 0, 0.12, 0.55, 0.12, M.metal);
    }

    bench.position.set(x, 0, z);
    bench.rotation.y = rotation;
    scene.add(bench);
  }

  function makePark() {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.25, 25),
      M.grassDark
    );
    park.position.set(0, 0.08, 0);
    scene.add(park);

    cylinder(scene, 0, 0.2, 0, 3.4, 0.5, M.concrete);
    cylinder(scene, 0, 0.7, 0, 2.8, 0.15, M.water);
    cylinder(scene, 0, 0.85, 0, 0.45, 2.1, M.concrete);

    makeBench(-8, 0);
    makeBench(8, 0, Math.PI);
    makeBench(0, -8, Math.PI / 2);
    makeBench(0, 8, -Math.PI / 2);
  }

  function makeMarket() {
    const group = new THREE.Group();

    box(group, 0, 0, 0, 18, 0.3, 14, M.concrete);
    box(group, 0, 4.2, 0, 18, 0.45, 14, M.green);

    for (const x of [-8, -4, 0, 4, 8]) {
      for (const z of [-5.5, 5.5]) {
        box(group, x, 0.3, z, 0.3, 3.9, 0.3, M.white);
      }
    }

    // Bancas e produtos
    const productColors = [M.red, M.yellow, M.green, M.white];

    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.8;

      box(group, x, 0.4, -1.5, 3, 1, 2.5, M.wood);
      box(group, x, 1.45, -1.5, 3.1, 0.15, 2.6, M.yellow);

      for (let j = 0; j < 5; j++) {
        const product = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.45, 0.35),
          productColors[j % productColors.length]
        );

        product.position.set(x - 1.1 + j * 0.55, 1.85, -1.5);
        product.castShadow = true;
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
    box(group, 0, 4.5, 0, 18, 0.45, 15, M.yellow);
    box(group, 0, 4.25, 0, 18, 0.12, 15, M.red);

    for (const x of [-7, 7]) {
      for (const z of [-5.5, 5.5]) {
        box(group, x, 0.3, z, 0.45, 4, 0.45, M.white);
      }
    }

    for (let i = -1; i <= 1; i++) {
      const x = i * 5;

      box(group, x, 0.3, 0, 1.3, 1.8, 1, M.white);
      box(group, x, 2.15, 0, 1, 0.45, 0.12, M.dark);
      box(group, x, 1.55, 0.55, 0.6, 0.12, 0.08, M.blue);

      const hose = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.045, 8, 16, Math.PI),
        M.dark
      );

      hose.position.set(x + 0.6, 1.2, 0.3);
      hose.rotation.z = Math.PI / 2;
      group.add(hose);

      box(group, x + 0.85, 0.65, 0.3, 0.12, 0.6, 0.12, M.dark);
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
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    attachRealCar(group, { width: 2.25, length: 4.4, height: 1.6, paintColor: color });
    const vehicle = { group, speed: 0, occupied: false, modelName: 'Ferrari 3D' };
    world.vehicles.push(vehicle);
    return group;
  }

  function makeTrafficCar(x, z, color, pathIndex = 0, route = null) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    attachRealCar(group, { width: 2.25, length: 4.4, height: 1.6, paintColor: color });
    const vehicle = {
      group, speed: 0, traffic: true, pathIndex,
      path: (route || [[-70, -35], [70, -35], [70, 35], [-70, 35]])
        .map(([px, pz]) => new THREE.Vector3(px, 0, pz))
    };
    world.trafficVehicles.push(vehicle);
  }

  function updateWorldTraffic(delta) {
    for (const vehicle of world.trafficVehicles) {
      const target = vehicle.path[vehicle.pathIndex];
      const dx = target.x - vehicle.group.position.x;
      const dz = target.z - vehicle.group.position.z;
      const distance = Math.hypot(dx, dz);
      const step = Math.min(distance, 7.5 * delta);
      if (distance < 0.8) {
        vehicle.pathIndex = (vehicle.pathIndex + 1) % vehicle.path.length;
        continue;
      }
      vehicle.group.position.x += (dx / distance) * step;
      vehicle.group.position.z += (dz / distance) * step;
      vehicle.group.rotation.y = Math.atan2(-dx, -dz);
    }
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

    // Nesta etapa, removemos todas as casas e apartamentos residenciais.

    facilities.forEach(makeBuilding);

    makeOrdinaryBuilding(-25, -25, 18, 18, 5, 'office');
    makeOrdinaryBuilding(25, -25, 18, 18, 5, 'office');
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
    const lampMaterial = new THREE.MeshStandardMaterial({
      color: 0xffedb1,
      emissive: 0xffc75a,
      emissiveIntensity: 0.55
    });

    for (let i = -100; i <= 100; i += 25) {
      for (const [x, z] of [
        [-10, i], [10, i], [i, -10], [i, 10]
      ]) {
        const lamp = new THREE.Group();

        cylinder(lamp, 0, 0, 0, 0.08, 5, M.dark);
        box(lamp, 0.35, 4.8, 0, 0.9, 0.1, 0.12, M.dark);
        box(lamp, 0.75, 4.75, 0, 0.65, 0.18, 0.35, lampMaterial);

        lamp.position.set(x, 0, z);
        scene.add(lamp);
      }
    }
  }

  // Base da cidade
  box(scene, 0, -1.2, 0, 260, 1, 260, M.grass);

  // Construção dos espaços
  makeCoast();
  buildRoads();
  buildCity();
  makePark();
  buildTrees();
  buildStreetLamps();

  // Áreas comerciais
  makeMarket();
  makeFuelStation();

  // Habitantes
  createPeople(scene, world);

  // Viaturas estacionadas para os jogadores conduzirem.
  makeCar(5, 25, 0xc62828, 0);
  makeCar(-42, 35, 0xeeeeee, Math.PI / 2);
  makeCar(55, -70, 0x2255aa, Math.PI / 2);
  makeCar(-72, 70, 0x252525, 0);

  // Trânsito autónomo distribuído pelos eixos que ligam os bairros de Luanda.
  const luandaTrafficRoute = [
    [-390, -20], [-285, 65], [-155, 190], [20, 320],
    [155, 195], [245, -115], [145, 55], [0, 0],
    [-125, 35], [-255, -105], [-285, 65]
  ];
  const trafficStarts = [
    [-390, -20], [-155, 190], [20, 320], [155, 195],
    [245, -115], [145, 55], [-125, 35], [-255, -105]
  ];
  const trafficColors = [0xc62828, 0xeeeeee, 0x2255aa, 0x202020, 0xd6a52c, 0x347a58, 0x777777, 0x8b3434];
  trafficStarts.forEach(([x, z], index) => {
    makeTrafficCar(x, z, trafficColors[index], (index + 1) % luandaTrafficRoute.length, luandaTrafficRoute);
  });

  world.updateTraffic = updateWorldTraffic;
  return world;
}
