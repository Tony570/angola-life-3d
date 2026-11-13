import * as THREE from 'three';
import { createPeople } from './people.js';

// ============================================
// ANGOLA LIFE 3D — CIDADE DE LUANDA
// ============================================

export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
      { name: 'Centro de Luanda', x: 35, z: -35 },
      { name: 'Zona Comercial', x: -40, z: -35 },
      { name: 'Bairro Residencial', x: 40, z: 40 },
      { name: 'Marginal', x: -35, z: 40 }
    ]
  };

  const materials = {
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
      color: 0x769eaa,
      roughness: 0.3,
      metalness: 0.12
    }),
    windowDark: new THREE.MeshStandardMaterial({ color: 0x263b43 }),
    green: new THREE.MeshStandardMaterial({ color: 0x347342 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x43834b }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x765035 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd0b17b }),
    water: new THREE.MeshStandardMaterial({
      color: 0x2389a9,
      roughness: 0.3,
      metalness: 0.2
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958d }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555b5d, metalness: 0.65, roughness: 0.5 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x80533b }),
    wood: new THREE.MeshStandardMaterial({ color: 0x765037 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9c382b }),
    blue: new THREE.MeshStandardMaterial({ color: 0x315c75 })
  };

  const buildingColors = [
    0xe5c49a, 0xd8a77f, 0xf0dfbd,
    0xc9b7a0, 0xe2d3b9, 0xd4a18c,
    0xc8c4ad, 0xe9d7b5, 0xbfa58c,
    0xd5c6a8, 0xc5a68d, 0xe2cdb0
  ];

  const roofColors = [
    0x985e43, 0x6d5550, 0x9b927e, 0x514f4b
  ];

  const signColors = [0xd9a52d, 0x285b75, 0x9c382b, 0x347342];

  function addBox(parent, x, y, z, w, h, d, material) {
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

  function addCylinder(parent, x, y, z, radiusTop, radiusBottom, height, material, segments = 8) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function variation(x, z, seed = 1) {
    const value = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  // TERRENO
  function addGround() {
    addBox(scene, 0, -1.2, 0, 260, 1, 260, materials.grass);

    for (let i = 0; i < 28; i++) {
      const x = -115 + (i * 37) % 230;
      const z = -110 + (i * 61) % 220;
      addBox(scene, x, -0.12, z, 12, 0.12, 12, materials.grass2);
    }
  }

  // ============================================
  // ESTRADAS E PASSEIOS
  // ============================================

  function makeRoad(x, z, width, length, horizontal = true) {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(
        horizontal ? length : width,
        0.12,
        horizontal ? width : length
      ),
      materials.asphalt
    );

    road.position.set(x, -0.05, z);
    road.receiveShadow = true;
    scene.add(road);

    const sidewalkWidth = 2.4;
    const roadLength = length;
    const roadWidth = width;

    for (const side of [-1, 1]) {
      const offset = roadWidth / 2 + sidewalkWidth / 2;

      const pavement = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? roadLength : sidewalkWidth,
          0.22,
          horizontal ? sidewalkWidth : roadLength
        ),
        materials.sidewalk
      );

      pavement.position.set(
        horizontal ? x : x + side * offset,
        0.045,
        horizontal ? z + side * offset : z
      );

      pavement.receiveShadow = true;
      scene.add(pavement);

      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? roadLength : 0.32,
          0.22,
          horizontal ? 0.32 : roadLength
        ),
        materials.sidewalkDark
      );

      curb.position.set(
        horizontal ? x : x + side * (roadWidth / 2 + 0.16),
        0.12,
        horizontal ? z + side * (roadWidth / 2 + 0.16) : z
      );

      scene.add(curb);

      for (let p = -roadLength / 2 + 6; p < roadLength / 2; p += 6) {
        const joint = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 0.055 : sidewalkWidth,
            0.012,
            horizontal ? sidewalkWidth : 0.055
          ),
          materials.sidewalkDark
        );

        joint.position.set(
          horizontal ? x + p : x + side * offset,
          0.16,
          horizontal ? z + side * offset : z + p
        );

        scene.add(joint);
      }

      const gutter = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? roadLength : 0.22,
          0.018,
          horizontal ? 0.22 : roadLength
        ),
        materials.asphaltOld
      );

      gutter.position.set(
        horizontal ? x : x + side * (roadWidth / 2 + 0.34),
        0.018,
        horizontal ? z + side * (roadWidth / 2 + 0.34) : z
      );

      scene.add(gutter);
    }

    if (width >= 12) {
      for (const side of [-1, 1]) {
        const edge = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? roadLength : 0.10,
            0.018,
            horizontal ? 0.10 : roadLength
          ),
          materials.white
        );

        edge.position.set(
          horizontal ? x : x + side * (roadWidth / 2 - 0.8),
          0.018,
          horizontal ? z + side * (roadWidth / 2 - 0.8) : z
        );

        scene.add(edge);
      }

      for (let p = -roadLength / 2 + 5; p < roadLength / 2 - 3; p += 12) {
        const dash = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 4.2 : 0.14,
            0.022,
            horizontal ? 0.14 : 4.2
          ),
          materials.yellow
        );

        dash.position.set(
          horizontal ? x + p : x,
          0.022,
          horizontal ? z : z + p
        );

        scene.add(dash);
      }
    }

    // Remendos de asfalto
    for (let i = 0; i < 5; i++) {
      const p = -roadLength / 2 + 16 + i * (roadLength / 5.5);
      const lateral = (variation(x + i * 7, z, 13) - 0.5) * roadWidth * 0.42;

      const patch = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? 2.2 + (i % 2) * 1.1 : 1.5,
          0.012,
          horizontal ? 1.2 : 2.2 + (i % 2) * 1.1
        ),
        materials.asphaltOld
      );

      patch.position.set(
        horizontal ? x + p : x + lateral,
        0.016,
        horizontal ? z + lateral : z + p
      );

      patch.rotation.y = (variation(x, z + i, 9) - 0.5) * 0.12;
      scene.add(patch);
    }

    // Fissuras no pavimento
    for (let i = 0; i < 7; i++) {
      const p = -roadLength / 2 + 12 + i * (roadLength / 7.5);
      const lateral = (variation(x + i * 3, z + 5, 21) - 0.5) * roadWidth * 0.65;

      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? 0.75 + (i % 3) * 0.25 : 0.035,
          0.009,
          horizontal ? 0.035 : 0.75 + (i % 3) * 0.25
        ),
        materials.black
      );

      crack.position.set(
        horizontal ? x + p : x + lateral,
        0.018,
        horizontal ? z + lateral : z + p
      );

      scene.add(crack);
    }

    // Grelhas de drenagem
    for (const side of [-1, 1]) {
      for (let p = -roadLength / 2 + 14; p < roadLength / 2 - 8; p += 34) {
        const drain = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 0.9 : 0.42,
            0.025,
            horizontal ? 0.42 : 0.9
          ),
          materials.metal
        );

        drain.position.set(
          horizontal ? x + p : x + side * (roadWidth / 2 - 0.45),
          0.025,
          horizontal ? z + side * (roadWidth / 2 - 0.45) : z + p
        );

        scene.add(drain);
      }
    }
  }

  function makeCrosswalk(x, z, horizontal = true) {
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? 1.35 : 0.42,
          0.035,
          horizontal ? 0.42 : 1.35
        ),
        materials.white
      );

      stripe.position.set(
        x + (horizontal ? i * 1.65 : 0),
        0.045,
        z + (horizontal ? 0 : i * 1.65)
      );

      scene.add(stripe);
    }

    const stopLine = new THREE.Mesh(
      new THREE.BoxGeometry(
        horizontal ? 0.22 : 12,
        0.025,
        horizontal ? 12 : 0.22
      ),
      materials.white
    );

    stopLine.position.set(
      x,
      0.035,
      z + (horizontal ? -5.8 : 0)
    );

    scene.add(stopLine);
  }

  function buildRoadNetwork() {
    makeRoad(0, 0, 16, 230, false);
    makeRoad(0, 0, 16, 230, true);

    [-70, -35, 35, 70].forEach(position => {
      makeRoad(position, 0, 10, 220, false);
      makeRoad(0, position, 10, 220, true);
    });

    [-70, -35, 0, 35, 70].forEach(position => {
      makeCrosswalk(position, 0, true);
      makeCrosswalk(0, position, false);
      makeCrosswalk(position, 35, true);
      makeCrosswalk(35, position, false);
    });

    for (const position of [-70, -35, 35, 70]) {
      for (const side of [-1, 1]) {
        const cover = new THREE.Mesh(
          new THREE.CylinderGeometry(0.38, 0.38, 0.035, 16),
          materials.metal
        );

        cover.position.set(side * 4.8, 0.025, position + 12);
        scene.add(cover);
      }
    }
  }

  // ============================================
  // DETALHES DE FACHADAS
  // ============================================

  function addWindowFrame(group, x, y, z, width, height) {
    const frame = new THREE.MeshStandardMaterial({ color: 0xd8d0bd });

    addBox(group, x, y, z, width + 0.18, 0.1, 0.12, frame);
    addBox(group, x, y + height - 0.08, z, width + 0.18, 0.1, 0.12, frame);
    addBox(group, x - width / 2, y, z, 0.09, height, 0.12, frame);
    addBox(group, x + width / 2, y, z, 0.09, height, 0.12, frame);
  }

  function addBalcony(group, x, y, z, width) {
    const balconyFloor = new THREE.MeshStandardMaterial({ color: 0xaaa69c });
    const railing = new THREE.MeshStandardMaterial({
      color: 0x555b5d,
      metalness: 0.6,
      roughness: 0.55
    });

    addBox(group, x, y, z + 0.75, width + 0.35, 0.15, 1.3, balconyFloor);
    addBox(group, x, y + 0.85, z + 1.35, width + 0.35, 0.08, 0.08, railing);
    addBox(group, x - width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);
    addBox(group, x + width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);

    const bars = Math.max(3, Math.floor(width / 0.45));

    for (let i = 0; i <= bars; i++) {
      const bx = x - width / 2 + (i / bars) * width;
      addBox(group, bx, y + 0.08, z + 1.35, 0.045, 0.75, 0.045, railing);
    }
  }

  function addAirConditioner(group, x, y, z) {
    const casing = new THREE.MeshStandardMaterial({ color: 0xe2e0d8 });
    addBox(group, x, y, z, 0.85, 0.42, 0.38, casing);
    addBox(group, x, y + 0.1, z + 0.2, 0.55, 0.16, 0.035, materials.metal);
  }

  function addWaterTank(group, x, y, z) {
    const tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x343c42,
      roughness: 0.7
    });

    addCylinder(group, x, y, z, 0.9, 0.9, 1.5, tankMaterial, 12);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.12, 12),
      materials.black
    );

    lid.position.set(x, y + 1.55, z);
    group.add(lid);

    addCylinder(group, x, y - 0.6, z, 0.07, 0.07, 0.65, materials.metal, 6);
  }

  function addRoofDetails(group, width, depth, height, seed) {
    const parapet = new THREE.MeshStandardMaterial({ color: 0xb8ad9a });

    addBox(group, 0, height + 0.35, depth / 2 - 0.12, width, 0.55, 0.2, parapet);
    addBox(group, 0, height + 0.35, -depth / 2 + 0.12, width, 0.55, 0.2, parapet);
    addBox(group, width / 2 - 0.12, height + 0.35, 0, 0.2, 0.55, depth, parapet);
    addBox(group, -width / 2 + 0.12, height + 0.35, 0, 0.2, 0.55, depth, parapet);

    if (seed % 3 !== 0) {
      addWaterTank(group, width * 0.22, height + 0.9, -depth * 0.18);
    }

    if (seed % 4 === 0) {
      const smallRoom = new THREE.MeshStandardMaterial({ color: 0xc6bca9 });
      addBox(group, -width * 0.22, height + 0.4, -depth * 0.15, 2.8, 2.1, 2.6, smallRoom);
    }
  }

  // ============================================
  // CONSTRUÇÃO DOS EDIFÍCIOS
  // ============================================

  function makeBuilding(x, z, width, depth, floors, type = 'house') {
    const group = new THREE.Group();
    const height = floors * 3.2;
    const seed = Math.abs(Math.floor(x * 3 + z * 7));

    const wallColor = buildingColors[seed % buildingColors.length];
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.9
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColors[Math.abs(Math.floor(x + z * 2)) % roofColors.length],
      roughness: 0.95
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: seed % 2 === 0 ? 0xe5ddcb : 0xb8a993
    });

    addBox(group, 0, 0, 0, width, height, depth, wallMaterial);
    addBox(group, 0, 0, 0, width + 0.35, 0.35, depth + 0.35, materials.concrete);
    addBox(group, 0, height, 0, width + 0.5, 0.35, depth + 0.5, roofMaterial);

    for (let floor = 1; floor < floors; floor++) {
      addBox(group, 0, floor * 3.2 - 0.08, depth / 2 + 0.08, width, 0.12, 0.12, trimMaterial);
    }

    const columns = Math.max(2, Math.floor(width / 2.7));

    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < columns; col++) {
        const wx = -width / 2 + (col + 0.5) * width / columns;
        const wy = 0.8 + floor * 3.2;
        const windowWidth = Math.min(1.15, width / columns * 0.55);

        addBox(group, wx, wy, depth / 2 + 0.035, windowWidth + 0.2, 1.55, 0.1, materials.windowDark);
        addBox(group, wx, wy + 0.1, depth / 2 + 0.1, windowWidth, 1.25, 0.035, materials.glass);

        addWindowFrame(group, wx, wy - 0.05, depth / 2 + 0.13, windowWidth, 1.45);

        if ((seed + floor + col) % 3 === 0) {
          for (let bar = -1; bar <= 1; bar++) {
            addBox(group, wx + bar * 0.27, wy, depth / 2 + 0.19, 0.035, 1.4, 0.035, materials.metal);
          }
        }

        if (
          (type === 'apartment' || type === 'office') &&
          floor > 0 &&
          col % 2 === 0 &&
          seed % 2 === 0
        ) {
          addBalcony(
            group,
            wx,
            wy - 0.55,
            depth / 2 + 0.12,
            Math.min(1.5, width / columns * 0.75)
          );
        }

        if ((seed + floor * 2 + col) % 5 === 0) {
          addAirConditioner(group, wx + 0.85, wy + 0.25, depth / 2 + 0.18);
        }
      }
    }

    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x69432e });

    addBox(group, 0, 0, depth / 2 + 0.12, 1.15, 2.3, 0.18, doorMaterial);
    addBox(group, 0, 0, depth / 2 + 0.5, 1.7, 0.16, 0.55, materials.concrete);

    if (type === 'shop') {
      const signMaterial = new THREE.MeshStandardMaterial({
        color: signColors[seed % signColors.length],
        roughness: 0.7
      });

      addBox(group, 0, 0.45, depth / 2 + 0.15, width * 0.72, 1.6, 0.12, materials.glass);
      addBox(group, 0, 2.25, depth / 2 + 0.2, width * 0.9, 0.55, 0.22, signMaterial);
      addBox(group, 0, 2.05, depth / 2 + 0.55, width * 0.85, 0.12, 1, materials.yellow);
      addBox(group, -width * 0.38, 0, depth / 2 + 0.17, 0.65, 2.25, 0.12, materials.metal);
    }

    if (type === 'apartment' || type === 'office') {
      for (let floor = 1; floor < floors; floor++) {
        addBox(group, width / 2 + 0.1, floor * 3.2 + 0.8, 0, 0.5, 0.5, 0.7, materials.white);
      }
    }

    if (type === 'office' || seed % 4 === 0) {
      for (const side of [-1, 1]) {
        addBox(group, side * (width / 2 - 0.35), 0, depth / 2 + 0.25, 0.35, 2.7, 0.35, trimMaterial);
      }
    }

    addRoofDetails(group, width, depth, height, seed);

    group.position.set(x, 0, z);
    scene.add(group);
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

    addBox(group, -width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    addBox(group, width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    addBox(group, 0, 0, 0, width * 0.2, 1.7, 0.2, gate);

    for (let i = -3; i <= 3; i++) {
      addBox(group, i * 0.3, 0, 0, 0.045, 1.65, 0.08, materials.metal);
    }

    addBox(group, 0, 1.7, 0, width, 0.15, 0.4, wall);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  function buildCityBlocks() {
    const positions = [-88, -53, -18, 18, 53, 88];

    positions.forEach((x, xi) => {
      positions.forEach((z, zi) => {
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return;

        const buildingX = x + ((xi % 2) ? 3 : -3);
        const buildingZ = z + ((zi % 2) ? 3 : -3);

        const floors = 1 + ((xi * 3 + zi * 5) % 5);
        const type =
          floors >= 4 ? 'apartment' :
          (xi + zi) % 3 === 0 ? 'shop' : 'house';

        makeBuilding(
          buildingX,
          buildingZ,
          type === 'shop' ? 12 : 14,
          12,
          floors,
          type
        );

        if ((xi + zi) % 3 === 0) {
          makeWallAndGate(buildingX + 10, buildingZ + 5, 7, Math.PI / 2);
        }
      });
    });

    makeBuilding(-25, -25, 18, 18, 9, 'office');
    makeBuilding(25, -25, 18, 18, 11, 'office');
    makeBuilding(-25, 25, 18, 18, 7, 'apartment');
    makeBuilding(25, 25, 18, 18, 8, 'apartment');

    makeBuilding(-55, -20, 18, 15, 3, 'shop');
    makeBuilding(-55, -43, 18, 15, 2, 'shop');
    makeBuilding(-55, -66, 18, 15, 3, 'shop');
  }

  // ============================================
  // PRAÇA CENTRAL
  // ============================================

  function makePark() {
    const park = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.25, 25),
      materials.grass2
    );

    park.position.set(0, 0.08, 0);
    scene.add(park);

    addCylinder(scene, 0, 0.2, 0, 3.4, 3.4, 0.5, materials.concrete, 24);
    addCylinder(scene, 0, 0.7, 0, 2.8, 2.8, 0.15, materials.water, 24);
    addCylinder(scene, 0, 0.85, 0, 0.45, 0.45, 2.1, materials.concrete, 12);

    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const x = Math.cos(angle) * 8;
      const z = Math.sin(angle) * 8;
      const bench = new THREE.Group();

      addBox(bench, 0, 0.65, 0, 3, 0.2, 0.8, materials.trunk);
      addBox(bench, 0, 0.9, -0.3, 3, 0.9, 0.15, materials.trunk);

      bench.position.set(x, 0, z);
      bench.rotation.y = -angle;
      scene.add(bench);
    }

    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const path = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.06, 8),
        materials.sidewalk
      );

      path.position.set(
        Math.cos(angle) * 8,
        0.23,
        Math.sin(angle) * 8
      );

      path.rotation.y = -angle;
      scene.add(path);
    }
  }

  // ============================================
  // ÁRVORES E PALMEIRAS
  // ============================================

  function makeTree(x, z, palm = false) {
    const group = new THREE.Group();

    addCylinder(
      group,
      0,
      0,
      0,
      palm ? 0.2 : 0.3,
      palm ? 0.35 : 0.4,
      palm ? 5 : 2.5,
      materials.trunk
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
        materials.leaf
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

    addCylinder(group, 0, 0, 0, 0.08, 0.13, 5, materials.black, 8);

    const arm = addBox(group, 0.35, 4.8, 0, 0.9, 0.1, 0.12, materials.black);
    arm.rotation.z = -0.15;

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

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.25,
      roughness: 0.45
    });

    addBox(group, 0, 0.35, 0, 2.2, 0.65, 4.2, bodyMaterial);
    addBox(group, 0, 1, -0.25, 1.8, 0.75, 2.1, materials.glass);
    addBox(group, 0, 0.7, 1.25, 2, 0.2, 1.2, bodyMaterial);

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x151515 });

    for (const wx of [-1.05, 1.05]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.25, 12),
          wheelMaterial
        );

        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.4, wz);
        group.add(wheel);
      }
    }

    const headlight = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.25
    });

    addBox(group, -0.7, 0.55, 2.12, 0.4, 0.22, 0.08, headlight);
    addBox(group, 0.7, 0.55, 2.12, 0.4, 0.22, 0.08, headlight);

    for (const side of [-1, 1]) {
      addBox(group, side * 1.12, 1.05, 0.55, 0.18, 0.15, 0.35, materials.black);
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

  // ============================================
  // MERCADO
  // ============================================

  function makeMarket() {
    const group = new THREE.Group();

    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.5;

      addBox(group, x, 0, 0, 3, 2.4, 2.8, materials.yellow);
      addBox(group, x, 2.4, 0, 3.4, 0.2, 3.2, materials.white);

      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.1, 1.1, 4),
        new THREE.MeshStandardMaterial({ color: 0xb33d2c })
      );

      roof.position.set(x, 3.05, 0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);

      addBox(group, x, 0.8, 1.5, 2.6, 0.12, 0.3, materials.wood);
    }

    group.position.set(-78, 0, -25);
    scene.add(group);
  }

  // ============================================
  // POSTO DE COMBUSTÍVEL
  // ============================================

  function makeFuelStation() {
    const group = new THREE.Group();

    addBox(group, 0, 0, 0, 15, 0.3, 12, materials.concrete);
    addBox(group, 0, 4, 0, 15, 0.45, 12, materials.yellow);

    for (const x of [-6, 6]) {
      for (const z of [-4, 4]) {
        addBox(group, x, 0.3, z, 0.4, 3.7, 0.4, materials.white);
      }
    }

    for (let i = -1; i <= 1; i++) {
      addBox(group, i * 4, 0.3, 0, 1.1, 1.6, 0.8, materials.white);
      addBox(group, i * 4, 1.9, 0, 0.8, 0.4, 0.12, materials.black);
      addCylinder(group, i * 4 + 0.5, 0.8, 0.5, 0.035, 0.035, 0.8, materials.black, 6);
    }

    group.position.set(78, 0, -35);
    scene.add(group);
  }

  // ============================================
  // MARGINAL E MAR
  // ============================================

  function makeCoast() {
    addBox(scene, -116, -0.3, 0, 12, 0.25, 230, materials.sand);
    addBox(scene, -128, -0.4, 0, 14, 0.25, 260, materials.water);
    addBox(scene, -108, 0, 0, 3, 0.25, 230, materials.sidewalk);

    for (let z = -100; z <= 100; z += 18) {
      makeTree(-106, z, true);
    }

    for (let z = -105; z <= 105; z += 5) {
      addBox(scene, -110, 0.4, z, 0.12, 0.8, 0.12, materials.metal);
    }

    addBox(scene, -110, 0.8, 0, 0.15, 0.12, 220, materials.metal);
  }

  // ============================================
  // CONSTRUÇÃO DO MUNDO
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
