
import * as THREE from 'three';
import { createPeople } from './people.js';

// ============================================
// ANGOLA LIFE 3D — CIDADE DE LUANDA
// ============================================

export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    buildings: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
      { name: 'Centro de Luanda', x: 35, z: -35 },
      { name: 'Zona Comercial', x: -40, z: -35 },
      { name: 'Bairro Residencial', x: 40, z: 40 },
      { name: 'Marginal', x: -35, z: 40 }
    ]
  };

  const mat = {
    grass: new THREE.MeshStandardMaterial({ color: 0x777d45, roughness: 1 }),
    grass2: new THREE.MeshStandardMaterial({ color: 0x85865a, roughness: 1 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x303236, roughness: 1 }),
    asphaltOld: new THREE.MeshStandardMaterial({ color: 0x41413d, roughness: 1 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xaaa397, roughness: 1 }),
    sidewalkDark: new THREE.MeshStandardMaterial({ color: 0x817e75, roughness: 1 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe9e4d8 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe4b72e }),
    black: new THREE.MeshStandardMaterial({ color: 0x202124 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x769eaa, roughness: 0.25, metalness: 0.15,
      transparent: true, opacity: 0.72
    }),
    windowDark: new THREE.MeshStandardMaterial({ color: 0x263b43 }),
    green: new THREE.MeshStandardMaterial({ color: 0x347342 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x43834b }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x765035 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd0b17b }),
    water: new THREE.MeshStandardMaterial({ color: 0x2389a9, roughness: 0.3 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958d }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555b5d, metalness: 0.65 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x80533b }),
    wood: new THREE.MeshStandardMaterial({ color: 0x765037 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9c382b }),
    blue: new THREE.MeshStandardMaterial({ color: 0x315c75 })
  };

  const buildingColors = [
    0xe5c49a, 0xd8a77f, 0xf0dfbd, 0xc9b7a0,
    0xe2d3b9, 0xd4a18c, 0xc8c4ad, 0xe9d7b5,
    0xbfa58c, 0xd5c6a8, 0xc5a68d, 0xe2cdb0
  ];

  const roofColors = [0x985e43, 0x6d5550, 0x9b927e, 0x514f4b];
  const signColors = [0xd9a52d, 0x285b75, 0x9c382b, 0x347342];

  function box(parent, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, rt, rb, h, material, segments = 10) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, segments), material
    );
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function variation(x, z, seed = 1) {
    const value = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  // ============================================
  // TEXTURAS DAS RUAS E DOS PASSEIOS
  // ============================================

  function makeSurfaceTexture(base, seed = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);

    let state = seed >>> 0;

    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };

    for (let i = 0; i < 11000; i++) {
      const shade = Math.floor(random() * 42) + 75;

      ctx.fillStyle =
        'rgba(' + shade + ',' + shade + ',' + shade + ',' +
        (0.035 + random() * 0.12) + ')';

      const size = 0.4 + random() * 2.2;

      ctx.fillRect(
        random() * 256,
        random() * 256,
        size,
        size
      );
    }

    if (base === '#303236') {
      ctx.strokeStyle = 'rgba(12,13,14,0.22)';
      ctx.lineWidth = 1.2;

      for (let i = 0; i < 9; i++) {
        const x = random() * 256;
        const y = random() * 256;

        ctx.beginPath();
        ctx.moveTo(x, y);

        ctx.lineTo(
          x + (random() - 0.5) * 24,
          y + 4 + random() * 18
        );

        ctx.lineTo(
          x + (random() - 0.5) * 35,
          y + 20 + random() * 22
        );

        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 14);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;

    return texture;
  }

  const asphaltSurface = new THREE.MeshStandardMaterial({
    map: makeSurfaceTexture('#303236', 17),
    roughness: 0.98,
    metalness: 0
  });

  const sidewalkSurface = new THREE.MeshStandardMaterial({
    map: makeSurfaceTexture('#aaa397', 31),
    roughness: 1
  });

  function makeRoadPlane(x, z, width, length, horizontal, material, y) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        horizontal ? length : width,
        horizontal ? width : length
      ),
      material
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = false;

    scene.add(mesh);
  }

  function makeRoadMarks(x, z, width, length, horizontal) {
    const dashCount = Math.max(1, Math.floor((length - 12) / 12));

    const dash = new THREE.InstancedMesh(
      new THREE.BoxGeometry(
        horizontal ? 4.2 : 0.14,
        0.018,
        horizontal ? 0.14 : 4.2
      ),
      mat.yellow,
      dashCount
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < dashCount; i++) {
      const p = -length / 2 + 7 + i * 12;

      dummy.position.set(
        horizontal ? x + p : x,
        0.025,
        horizontal ? z : z + p
      );

      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      dash.setMatrixAt(i, dummy.matrix);
    }

    dash.instanceMatrix.needsUpdate = true;
    dash.castShadow = false;
    dash.receiveShadow = false;

    scene.add(dash);

    if (width >= 12) {
      const edges = new THREE.InstancedMesh(
        new THREE.BoxGeometry(
          horizontal ? length : 0.1,
          0.014,
          horizontal ? 0.1 : length
        ),
        mat.white,
        2
      );

      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;

        dummy.position.set(
          horizontal ? x : x + side * (width / 2 - 0.8),
          0.022,
          horizontal ? z + side * (width / 2 - 0.8) : z
        );

        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();

        edges.setMatrixAt(i, dummy.matrix);
      }

      edges.instanceMatrix.needsUpdate = true;
      edges.castShadow = false;
      edges.receiveShadow = false;

      scene.add(edges);
    }
  }

  // ============================================
  // TERRENO
  // ============================================

  function addGround() {
    box(scene, 0, -1.2, 0, 260, 1, 260, mat.grass);

    for (let i = 0; i < 28; i++) {
      const x = -115 + (i * 37) % 230;
      const z = -110 + (i * 61) % 220;

      box(scene, x, -0.12, z, 12, 0.12, 12, mat.grass2);
    }
  }

  // ============================================
  // ESTRADAS
  // ============================================

  function makeRoad(x, z, width, length, horizontal = true) {
    makeRoadPlane(
      x, z, width, length, horizontal,
      asphaltSurface, 0.018
    );

    const sidewalkWidth = 2.4;
    const offset = width / 2 + sidewalkWidth / 2;
    const curbOffset = width / 2 + 0.16;

    for (const side of [-1, 1]) {
      makeRoadPlane(
        horizontal ? x : x + side * offset,
        horizontal ? z + side * offset : z,
        horizontal ? length : sidewalkWidth,
        horizontal ? sidewalkWidth : length,
        horizontal,
        sidewalkSurface,
        0.042
      );

      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? length : 0.22,
          0.16,
          horizontal ? 0.22 : length
        ),
        mat.sidewalkDark
      );

      curb.position.set(
        horizontal ? x : x + side * curbOffset,
        0.08,
        horizontal ? z + side * curbOffset : z
      );

      curb.castShadow = false;
      curb.receiveShadow = false;

      scene.add(curb);
    }

    if (width >= 12) {
      makeRoadMarks(x, z, width, length, horizontal);
    }
  }

  function makeCrosswalk(x, z, horizontal = true) {
    const stripes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(
        horizontal ? 1.35 : 0.42,
        0.025,
        horizontal ? 0.42 : 1.35
      ),
      mat.white,
      7
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < 7; i++) {
      const offset = (i - 3) * 1.65;

      dummy.position.set(
        x + (horizontal ? offset : 0),
        0.045,
        z + (horizontal ? 0 : offset)
      );

      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      stripes.setMatrixAt(i, dummy.matrix);
    }

    stripes.instanceMatrix.needsUpdate = true;
    stripes.castShadow = false;
    stripes.receiveShadow = false;

    scene.add(stripes);
  }

  function buildRoadNetwork() {
    makeRoad(0, 0, 16, 230, false);
    makeRoad(0, 0, 16, 230, true);

    [-70, -35, 35, 70].forEach(p => {
      makeRoad(p, 0, 10, 220, false);
      makeRoad(0, p, 10, 220, true);
    });

    [-70, -35, 0, 35, 70].forEach(p => {
      makeCrosswalk(p, 0, true);
      makeCrosswalk(0, p, false);
      makeCrosswalk(p, 35, true);
      makeCrosswalk(35, p, false);
    });
  }

  // ============================================
  // JANELAS E VARANDAS
  // ============================================

  function addWindow(group, x, y, z, width, height) {
    const frame = new THREE.MeshStandardMaterial({ color: 0xd8d0bd });

    box(group, x, y, z, width, height, 0.09, mat.windowDark);
    box(group, x, y + 0.08, z + 0.06, width - 0.16, height - 0.16, 0.035, mat.glass);

    box(group, x, y, z - 0.07, width + 0.16, 0.09, 0.12, frame);
    box(group, x, y + height - 0.09, z - 0.07, width + 0.16, 0.09, 0.12, frame);
    box(group, x - width / 2 + 0.04, y, z - 0.07, 0.08, height, 0.12, frame);
    box(group, x + width / 2 - 0.04, y, z - 0.07, 0.08, height, 0.12, frame);
  }

  function addBalcony(group, x, y, z, width) {
    const railing = new THREE.MeshStandardMaterial({
      color: 0x555b5d,
      metalness: 0.6,
      roughness: 0.55
    });

    box(group, x, y, z + 0.75, width + 0.35, 0.15, 1.3, mat.concrete);
    box(group, x, y + 0.85, z + 1.35, width + 0.35, 0.08, 0.08, railing);
    box(group, x - width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);
    box(group, x + width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);

    const bars = Math.max(3, Math.floor(width / 0.45));

    for (let i = 0; i <= bars; i++) {
      const bx = x - width / 2 + (i / bars) * width;
      box(group, bx, y + 0.08, z + 1.35, 0.045, 0.75, 0.045, railing);
    }
  }

  function addAirConditioner(group, x, y, z) {
    box(group, x, y, z, 0.85, 0.42, 0.38, mat.white);
    box(group, x, y + 0.1, z + 0.2, 0.55, 0.16, 0.035, mat.metal);
  }

  function addRoofDetails(group, width, depth, height, seed) {
    const parapet = new THREE.MeshStandardMaterial({ color: 0xb8ad9a });

    box(group, 0, height, depth / 2 - 0.12, width, 0.55, 0.2, parapet);
    box(group, 0, height, -depth / 2 + 0.12, width, 0.55, 0.2, parapet);
    box(group, width / 2 - 0.12, height, 0, 0.2, 0.55, depth, parapet);
    box(group, -width / 2 + 0.12, height, 0, 0.2, 0.55, depth, parapet);

    if (seed % 3 !== 0) {
      cylinder(group, width * 0.22, height + 0.5, -depth * 0.18, 0.9, 0.9, 1.5, mat.black, 12);
    }
  }

  // ============================================
  // EDIFÍCIOS
  // ============================================

  function makeBuilding(x, z, width, depth, floors, type = 'house') {
    const group = new THREE.Group();
    const height = floors * 3.2;
    const seed = Math.abs(Math.floor(x * 3 + z * 7));

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: buildingColors[seed % buildingColors.length],
      roughness: 0.9
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColors[Math.abs(Math.floor(x + z * 2)) % roofColors.length],
      roughness: 0.95
    });

    const trim = new THREE.MeshStandardMaterial({
      color: seed % 2 === 0 ? 0xe5ddcb : 0xb8a993
    });

    const wall = 0.32;
    const doorWidth = type === 'shop' ? 2.8 : 1.9;
    const doorHeight = 2.5;
    const frontZ = depth / 2;

    box(group, 0, 0, 0, width, 0.28, depth, mat.concrete);

    box(group, -width / 2 + wall / 2, 0.28, 0, wall, height - 0.28, depth, wallMaterial);
    box(group, width / 2 - wall / 2, 0.28, 0, wall, height - 0.28, depth, wallMaterial);
    box(group, 0, 0.28, -depth / 2 + wall / 2, width, height - 0.28, wall, wallMaterial);

    const sideWidth = (width - doorWidth) / 2;

    box(group, -width / 2 + sideWidth / 2, 0.28, frontZ, sideWidth, height - 0.28, wall, wallMaterial);
    box(group, width / 2 - sideWidth / 2, 0.28, frontZ, sideWidth, height - 0.28, wall, wallMaterial);

    box(group, 0, doorHeight + 0.28, frontZ, doorWidth, height - doorHeight - 0.28, wall, wallMaterial);

    for (let floor = 1; floor < floors; floor++) {
      const y = floor * 3.2;

      box(group, 0, y - 0.16, 0, width, 0.28, depth, mat.concrete);
      box(group, 0, y + 0.08, 0, width - 0.7, 0.08, depth - 0.7, wallMaterial);
      box(group, 0, y - 0.1, frontZ + 0.08, width, 0.12, 0.12, trim);
    }

    for (const side of [-1, 1]) {
      box(group, side * (width / 2 - 0.25), 0.28, frontZ + 0.03, 0.28, height - 0.28, 0.35, trim);
    }

    const columns = Math.max(2, Math.floor(width / 3));

    for (let floor = 0; floor < floors; floor++) {
      const y = floor * 3.2 + 0.85;

      for (let col = 0; col < columns; col++) {
        const wx = -width / 2 + (col + 0.5) * width / columns;
        const ww = Math.min(1.3, width / columns * 0.55);

        if (floor === 0 && Math.abs(wx) < doorWidth / 2 + ww / 2 + 0.4) continue;

        box(group, wx, y, frontZ + 0.19, ww + 0.15, 1.55, 0.07, mat.windowDark);
        box(group, wx, y + 0.08, frontZ + 0.24, ww, 1.35, 0.035, mat.glass);

        box(group, wx, y - 0.78, frontZ + 0.27, ww + 0.18, 0.09, 0.1, trim);
        box(group, wx, y + 0.78, frontZ + 0.27, ww + 0.18, 0.09, 0.1, trim);

        if (type === 'apartment' && floor > 0 && col % 2 === 0) {
          addBalcony(group, wx, y - 0.7, frontZ + 0.2, Math.min(1.5, ww + 0.2));
        }

        if ((seed + floor + col) % 5 === 0) {
          addAirConditioner(group, wx + 0.85, y + 0.25, frontZ + 0.25);
        }
      }
    }

    const doorFrame = new THREE.MeshStandardMaterial({ color: 0x69432e });

    box(group, -doorWidth / 2 - 0.08, 0.28, frontZ + 0.08, 0.12, doorHeight, 0.18, doorFrame);
    box(group, doorWidth / 2 + 0.08, 0.28, frontZ + 0.08, 0.12, doorHeight, 0.18, doorFrame);
    box(group, 0, doorHeight + 0.2, frontZ + 0.08, doorWidth + 0.28, 0.16, 0.18, doorFrame);

    box(group, 0, 0.02, frontZ + 0.65, doorWidth + 1.2, 0.16, 1.1, mat.concrete);

    if (type === 'shop') {
      const sign = new THREE.MeshStandardMaterial({
        color: signColors[seed % signColors.length],
        roughness: 0.7
      });

      box(group, 0, 2.75, frontZ + 0.22, width * 0.78, 0.65, 0.2, sign);
      box(group, 0, 2.38, frontZ + 0.25, width * 0.8, 0.08, 0.22, mat.yellow);

      for (const side of [-1, 1]) {
        const sx = side * (doorWidth / 2 + sideWidth / 4);
        box(group, sx, 0.65, frontZ + 0.19, sideWidth * 0.72, 1.6, 0.08, mat.glass);
      }
    }

    const interiorFloor = new THREE.MeshStandardMaterial({ color: 0xb8a991 });

    box(group, 0, 0.29, 0, width - 0.8, 0.04, depth - 0.8, interiorFloor);

    if (type === 'house') {
      box(group, -width * 0.22, 0.3, -depth * 0.12, 0.16, 2.4, depth * 0.55, wallMaterial);
      box(group, width * 0.18, 0.3, -depth * 0.2, width * 0.36, 2.4, 0.16, wallMaterial);
    }

    box(group, 0, height, 0, width + 0.5, 0.35, depth + 0.5, roofMaterial);
    addRoofDetails(group, width, depth, height + 0.35, seed);

    group.position.set(x, 0, z);
    scene.add(group);

    world.buildings.push({
      group, x, z, width, depth, floors, type,
      entranceX: x,
      entranceZ: z + depth / 2 + 1
    });

    return group;
  }

  // ============================================
  // MUROS E PORTÕES
  // ============================================

  function makeWallAndGate(x, z, width, rotation = 0) {
    const group = new THREE.Group();
    const wall = new THREE.MeshStandardMaterial({ color: 0xbcae98 });

    const gate = new THREE.MeshStandardMaterial({
      color: 0x42494b,
      metalness: 0.55,
      roughness: 0.65
    });

    box(group, -width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    box(group, width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    box(group, 0, 0, 0, width * 0.2, 1.7, 0.2, gate);

    for (let i = -3; i <= 3; i++) {
      box(group, i * 0.3, 0, 0, 0.045, 1.65, 0.08, mat.metal);
    }

    box(group, 0, 1.7, 0, width, 0.15, 0.4, wall);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    scene.add(group);
  }

  function buildCityBlocks() {
    const positions = [-88, -53, -18, 18, 53, 88];

    positions.forEach((x, xi) => {
      positions.forEach((z, zi) => {
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return;

        const bx = x + (xi % 2 ? 3 : -3);
        const bz = z + (zi % 2 ? 3 : -3);
        const floors = 1 + ((xi * 3 + zi * 5) % 5);

        const type = floors >= 4
          ? 'apartment'
          : (xi + zi) % 3 === 0 ? 'shop' : 'house';

        makeBuilding(
          bx,
          bz,
          type === 'shop' ? 12 : 14,
          12,
          floors,
          type
        );

        if ((xi + zi) % 3 === 0) {
          makeWallAndGate(bx + 10, bz + 5, 7, Math.PI / 2);
        }
      });
    });

    makeBuilding(-25, -25, 18, 18, 9, 'office');
    makeBuilding(25, -25, 18, 18, 11, 'office');
    makeBuilding(-25, 25, 18, 18, 7, 'apartment');
    makeBuilding(25, 25, 18, 18, 8, 'apartment');
  }

  // ============================================
  // PRAÇA CENTRAL
  // ============================================

  function makePark() {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.25, 25),
      mat.grass2
    );

    park.position.set(0, 0.08, 0);
    scene.add(park);

    cylinder(scene, 0, 0.2, 0, 3.4, 3.4, 0.5, mat.concrete, 24);
    cylinder(scene, 0, 0.7, 0, 2.8, 2.8, 0.15, mat.water, 24);
    cylinder(scene, 0, 0.85, 0, 0.45, 0.45, 2.1, mat.concrete, 12);

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const bench = new THREE.Group();

      box(bench, 0, 0.65, 0, 3, 0.2, 0.8, mat.trunk);
      box(bench, 0, 0.9, -0.3, 3, 0.9, 0.15, mat.trunk);

      bench.position.set(
        Math.cos(angle) * 8,
        0,
        Math.sin(angle) * 8
      );

      bench.rotation.y = -angle;
      scene.add(bench);
    }
  }

  // ============================================
  // ÁRVORES
  // ============================================

  function makeTree(x, z, palm = false) {
    const group = new THREE.Group();

    cylinder(
      group,
      0, 0, 0,
      palm ? 0.2 : 0.3,
      palm ? 0.35 : 0.4,
      palm ? 5 : 2.5,
      mat.trunk
    );

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
        mat.leaf
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

  // ============================================
  // ILUMINAÇÃO PÚBLICA
  // ============================================

  function makeStreetLamp(x, z) {
    const group = new THREE.Group();

    cylinder(group, 0, 0, 0, 0.08, 0.13, 5, mat.black, 8);
    box(group, 0.35, 4.8, 0, 0.9, 0.1, 0.12, mat.black);

    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0xffedb1,
        emissive: 0xffc75a,
        emissiveIntensity: 0.45
      })
    );

    lamp.position.set(0.75, 4.75, 0);
    group.add(lamp);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  function buildStreetLamps() {
    for (let i = -100; i <= 100; i += 25) {
      makeStreetLamp(-10, i);
      makeStreetLamp(10, i);
      makeStreetLamp(i, -10);
      makeStreetLamp(i, 10);
    }
  }

  // ============================================
  // CARROS
  // ============================================

  function makeCar(x, z, color, rotation = 0) {
    const group = new THREE.Group();

    const body = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.45
    });

    box(group, 0, 0.35, 0, 2.2, 0.65, 4.2, body);
    box(group, 0, 1, -0.25, 1.8, 0.75, 2.1, mat.glass);
    box(group, 0, 0.7, 1.25, 2, 0.2, 1.2, body);

    const wheels = new THREE.MeshStandardMaterial({ color: 0x151515 });

    for (const wx of [-1.05, 1.05]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.25, 12),
          wheels
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.4, wz);

        group.add(wheel);
      }
    }

    const light = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.25
    });

    box(group, -0.7, 0.55, 2.12, 0.4, 0.22, 0.08, light);
    box(group, 0.7, 0.55, 2.12, 0.4, 0.22, 0.08, light);

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

  // ============================================
  // MERCADO
  // ============================================

  function makeMarket() {
    const group = new THREE.Group();

    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.5;

      box(group, x, 0, 0, 3, 2.4, 2.8, mat.yellow);
      box(group, x, 2.4, 0, 3.4, 0.2, 3.2, mat.white);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 1.1, 4),
        new THREE.MeshStandardMaterial({ color: 0xb33d2c })
      );

      roof.position.set(x, 3.05, 0);
      roof.rotation.y = Math.PI / 4;

      group.add(roof);

      box(group, x, 0.8, 1.5, 2.6, 0.12, 0.3, mat.wood);
    }

    group.position.set(-78, 0, -25);
    scene.add(group);
  }

  // ============================================
  // POSTO DE COMBUSTÍVEL
  // ============================================

  function makeFuelStation() {
    const group = new THREE.Group();

    box(group, 0, 0, 0, 15, 0.3, 12, mat.concrete);
    box(group, 0, 4, 0, 15, 0.45, 12, mat.yellow);

    for (const x of [-6, 6]) {
      for (const z of [-4, 4]) {
        box(group, x, 0.3, z, 0.4, 3.7, 0.4, mat.white);
      }
    }

    for (let i = -1; i <= 1; i++) {
      box(group, i * 4, 0.3, 0, 1.1, 1.6, 0.8, mat.white);
      box(group, i * 4, 1.9, 0, 0.8, 0.4, 0.12, mat.black);

      cylinder(
        group,
        i * 4 + 0.5,
        0.8,
        0.5,
        0.035,
        0.035,
        0.8,
        mat.black,
        6
      );
    }

    group.position.set(78, 0, -35);
    scene.add(group);
  }

  // ============================================
  // MARGINAL E MAR
  // ============================================

  function makeCoast() {
    box(scene, -116, -0.3, 0, 12, 0.25, 230, mat.sand);
    box(scene, -128, -0.4, 0, 14, 0.25, 260, mat.water);
    box(scene, -108, 0, 0, 3, 0.25, 230, mat.sidewalk);

    for (let z = -100; z <= 100; z += 18) {
      makeTree(-106, z, true);
    }

    for (let z = -105; z <= 105; z += 5) {
      box(scene, -110, 0.4, z, 0.12, 0.8, 0.12, mat.metal);
    }

    box(scene, -110, 0.8, 0, 0.15, 0.12, 220, mat.metal);
  }

  // ============================================
  // CRIAR A CIDADE
  // ============================================

  addGround();
  makeCoast();
  buildRoadNetwork();
  buildCityBlocks();
  makePark();
  buildTrees();
  buildStreetLamps();
  makeMarket();
  makeFuelStation();

  createPeople(scene, world);

  makeCar(5, 25, 0xc62828, 0);
  makeCar(-42, 35, 0xeeeeee, Math.PI / 2);
  makeCar(55, -70, 0x2255aa, Math.PI / 2);
  makeCar(-72, 70, 0x252525, 0);

  return world;
}
