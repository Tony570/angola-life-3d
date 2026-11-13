
import * as THREE from 'three';
import { createPeople } from './people.js';
// ============================================
// ANGOLA LIFE 3D — WORLD.JS
// Cidade procedural de Luanda
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

  // Materiais reutilizáveis
  const materials = {
    grass: new THREE.MeshStandardMaterial({ color: 0x718d45 }),
    grass2: new THREE.MeshStandardMaterial({ color: 0x819b50 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x292d32 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xbab4a5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf0e9d8 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf2c230 }),
    black: new THREE.MeshStandardMaterial({ color: 0x202124 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x83b7c8,
      roughness: 0.25,
      metalness: 0.15
    }),
    windowDark: new THREE.MeshStandardMaterial({ color: 0x344a56 }),
    green: new THREE.MeshStandardMaterial({ color: 0x347342 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x43834b }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x765035 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd9bd83 }),
    water: new THREE.MeshStandardMaterial({
      color: 0x2389a9,
      roughness: 0.3,
      metalness: 0.2
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958d })
  };

  const buildingColors = [
    0xe5c49a, 0xd8a77f, 0xf0dfbd,
    0xc9b7a0, 0xe2d3b9, 0xd4a18c,
    0xc8c4ad, 0xe9d7b5, 0xbfa58c
  ];

  const roofColors = [
    0x985e43, 0x6d5550, 0x9b927e, 0x514f4b
  ];

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
      new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        segments
      ),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addGround() {
    addBox(scene, 0, -1.2, 0, 260, 1, 260, materials.grass);

    // Zonas verdes espalhadas
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

    const sidewalkWidth = 2.2;

    for (const side of [-1, 1]) {
      const offset = width / 2 + sidewalkWidth / 2;

      const pavement = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? length : sidewalkWidth,
          0.25,
          horizontal ? sidewalkWidth : length
        ),
        materials.sidewalk
      );

      pavement.position.set(
        horizontal ? x : x + side * offset,
        0.05,
        horizontal ? z + side * offset : z
      );

      scene.add(pavement);

      // Lancil
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? length : 0.35,
          0.3,
          horizontal ? 0.35 : length
        ),
        materials.white
      );

      curb.position.set(
        horizontal ? x : x + side * (width / 2 + 0.2),
        0.12,
        horizontal ? z + side * (width / 2 + 0.2) : z
      );

      scene.add(curb);
    }

    // Linhas centrais
    if (width >= 12) {
      for (let p = -length / 2 + 5; p < length / 2 - 3; p += 11) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            horizontal ? 5 : 0.18,
            0.025,
            horizontal ? 0.18 : 5
          ),
          materials.yellow
        );

        line.position.set(
          horizontal ? x + p : x,
          0.025,
          horizontal ? z : z + p
        );

        scene.add(line);
      }
    }
  }

  function makeCrosswalk(x, z, horizontal = true) {
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(
          horizontal ? 1.2 : 0.35,
          0.035,
          horizontal ? 0.35 : 1.2
        ),
        materials.white
      );

      stripe.position.set(
        x + (horizontal ? i * 1.6 : 0),
        0.04,
        z + (horizontal ? 0 : i * 1.6)
      );

      scene.add(stripe);
    }
  }

  function buildRoadNetwork() {
    // Avenidas principais
    makeRoad(0, 0, 16, 230, false);
    makeRoad(0, 0, 16, 230, true);

    // Avenidas secundárias
    [-70, -35, 35, 70].forEach(position => {
      makeRoad(position, 0, 10, 220, false);
      makeRoad(0, position, 10, 220, true);
    });

    // Passadeiras nos cruzamentos
    [-70, -35, 0, 35, 70].forEach(position => {
      makeCrosswalk(position, 0, true);
      makeCrosswalk(0, position, false);
      makeCrosswalk(position, 35, true);
      makeCrosswalk(35, position, false);
    });
  }

  // ============================================
  // EDIFÍCIOS
  // ============================================

  function makeBuilding(x, z, width, depth, floors, type = 'house') {
    const group = new THREE.Group();

    const height = floors * 3.2;
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: buildingColors[
        Math.abs(Math.floor(x * 3 + z * 7)) % buildingColors.length
      ],
      roughness: 0.85
    });

    const roofMaterial = new THREE.MeshStandardMaterial({
      color: roofColors[
        Math.abs(Math.floor(x + z * 2)) % roofColors.length
      ]
    });

    // Corpo do edifício
    addBox(group, 0, 0, 0, width, height, depth, wallMaterial);

    // Base
    addBox(group, 0, 0, 0, width + 0.35, 0.35, depth + 0.35, materials.concrete);

    // Telhado
    addBox(group, 0, height, 0, width + 0.5, 0.35, depth + 0.5, roofMaterial);

    // Janelas da fachada da frente
    const columns = Math.max(2, Math.floor(width / 2.3));

    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < columns; col++) {
        const wx = -width / 2 + (col + 0.5) * width / columns;
        const wy = 0.8 + floor * 3.2;

        addBox(
          group,
          wx,
          wy,
          depth / 2 + 0.035,
          1.05,
          1.45,
          0.08,
          materials.windowDark
        );

        // Vidro
        addBox(
          group,
          wx,
          wy + 0.08,
          depth / 2 + 0.09,
          0.85,
          1.15,
          0.035,
          materials.glass
        );

        // Peitoril
        addBox(
          group,
          wx,
          wy - 0.78,
          depth / 2 + 0.12,
          1.2,
          0.12,
          0.25,
          materials.white
        );

        // Varandas em alguns edifícios
        if (type === 'apartment' && floor > 0 && col % 2 === 0) {
          addBox(
            group,
            wx,
            wy - 0.65,
            depth / 2 + 0.35,
            1.45,
            0.12,
            0.65,
            materials.concrete
          );
        }
      }
    }

    // Porta de entrada
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x69432e });

    addBox(
      group,
      0,
      0,
      depth / 2 + 0.06,
      1.15,
      2.3,
      0.15,
      doorMaterial
    );

    // Letreiro de loja
    if (type === 'shop') {
      addBox(
        group,
        0,
        2.45,
        depth / 2 + 0.12,
        width * 0.8,
        0.55,
        0.2,
        materials.yellow
      );
    }

    // Ar condicionado exterior
    if (type === 'apartment' || type === 'office') {
      for (let floor = 1; floor < floors; floor++) {
        addBox(
          group,
          width / 2 + 0.1,
          floor * 3.2 + 0.8,
          0,
          0.5,
          0.5,
          0.7,
          materials.white
        );
      }
    }

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
  }

  function buildCityBlocks() {
    const positions = [-88, -53, -18, 18, 53, 88];

    positions.forEach((x, xi) => {
      positions.forEach((z, zi) => {
        // Deixar a praça central livre
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return;

        // Espaço de segurança junto às estradas
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
      });
    });

    // Torres na zona central
    makeBuilding(-25, -25, 18, 18, 9, 'office');
    makeBuilding(25, -25, 18, 18, 11, 'office');
    makeBuilding(-25, 25, 18, 18, 7, 'apartment');
    makeBuilding(25, 25, 18, 18, 8, 'apartment');
    // Zona comercial
    makeBuilding(-55, -20, 18, 15, 3, 'shop');
    makeBuilding(-55, -43, 18, 15, 2, 'shop');
    makeBuilding(-55, -66, 18, 15, 3, 'shop');
// Bairro residencial
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
    // Fonte
    addCylinder(scene, 0, 0.2, 0, 3.4, 3.4, 0.5, materials.concrete, 24);
    addCylinder(scene, 0, 0.7, 0, 2.8, 2.8, 0.15, materials.water, 24);
    addCylinder(scene, 0, 0.85, 0, 0.45, 0.45, 2.1, materials.concrete, 12);
    // Bancos
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
    // Árvores no bairro
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
    const arm = addBox(
      group,
      0.35,
      4.8,
      0,
      0.9,
      0.1,
      0.12,
      materials.black
    );

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

    // Capô
    addBox(group, 0, 0.7, 1.25, 2, 0.2, 1.2, bodyMaterial);
    // Rodas
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
    // Faróis
    const headlight = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.25
    });

    addBox(group, -0.7, 0.55, 2.12, 0.4, 0.22, 0.08, headlight);
    addBox(group, 0.7, 0.55, 2.12, 0.4, 0.22, 0.08, headlight);

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
  // PESSOAS / NPCs
  // ============================================
  
function makePerson(x, z, shirtColor, phase = 0) {
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({
    color: 0x8b5738,
    roughness: 0.85
  });
  const skinLight = new THREE.MeshStandardMaterial({
    color: 0xa96f50
  });
  const shirt = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.8
  });
  const trousers = new THREE.MeshStandardMaterial({
    color: 0x292d38
  });
  const shoes = new THREE.MeshStandardMaterial({
    color: 0x171717
  });
  const hair = new THREE.MeshStandardMaterial({
    color: 0x17120f
  });
  const white = new THREE.MeshStandardMaterial({
    color: 0xffffff
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x160f0b
  });
  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: 0x48251e
  });

  function sphere(geometry, material, px, py, pz) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  }

  // Tronco e roupa
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.29, 0.55, 5, 12),
    shirt
  );
  torso.position.y = 1.13;
  torso.scale.set(1, 1, 0.78);
  group.add(torso);

  // Pescoço
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.18, 12),
    skin
  );
  neck.position.y = 1.58;
  group.add(neck);

  // Cabeça
  sphere(
    new THREE.SphereGeometry(0.235, 24, 20),
    skin,
    0, 1.88, 0
  );

  // Orelhas
  for (const side of [-1, 1]) {
    sphere(
      new THREE.SphereGeometry(0.055, 12, 10),
      skinLight,
      side * 0.23, 1.88, 0
    );
  }

  // Cabelo
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2
    ),
    hair
  );
  hairCap.position.y = 1.97;
  group.add(hairCap);
  // Olhos, pupilas e sobrancelhas
  for (const side of [-1, 1]) {
    sphere(
      new THREE.SphereGeometry(0.035, 12, 10),
      white,
      side * 0.085, 1.91, 0.205
    );
    sphere(
      new THREE.SphereGeometry(0.019, 10, 8),
      dark,
      side * 0.085, 1.91, 0.235
    );
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.018, 0.018),
      hair
    );
    brow.position.set(side * 0.085, 1.965, 0.205);
    group.add(brow);
  }

  // Nariz
  sphere(
    new THREE.SphereGeometry(0.038, 12, 10),
    skinLight,
    0, 1.84, 0.23
  );

  // Boca
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.014, 0.012),
    mouthMaterial
  );
  mouth.position.set(0, 1.775, 0.218);
  group.add(mouth);

  // Pernas, braços e mãos
  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.13, 0.72, 0);

    const legMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.105, 0.48, 4, 10),
      trousers
    );
    legMesh.position.y = -0.23;
    leg.add(legMesh);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.11, 0.29),
      shoes
    );
    shoe.position.set(0, -0.52, 0.055);
    leg.add(shoe);

    group.add(leg);
    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.34, 1.37, 0);

    const upperArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.085, 0.34, 4, 9),
      shirt
    );
    upperArm.position.y = -0.18;
    arm.add(upperArm);

    const forearm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, 0.23, 4, 9),
      skin
    );
    forearm.position.y = -0.48;
    arm.add(forearm);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 12, 10),
      skin
    );
    hand.position.y = -0.64;
    arm.add(hand);

    group.add(arm);
    arms.push(arm);
  }

  group.position.set(x, 0, z);
  scene.add(group);

  world.npcs.push({
    group,
    originX: x,
    originZ: z,
    phase,
    legs,
    arms
  });
}
  function buildPeople() {
    const colors = [
      0xb52f2f, 0x2363a4, 0x27724a,
      0xd59b28, 0x683b8c, 0xe2e2e2
    ];
    for (let i = 0; i < 24; i++) {
      const x = -80 + (i * 31) % 160;
      const z = -80 + (i * 43) % 160;
      if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
      makePerson(
        x,
        z,
        colors[i % colors.length],
        i * 0.7
      );
    }
  }
  // ============================================
  // MERCADO E POSTO DE COMBUSTÍVEL
  // ============================================
  function makeMarket() {
    const group = new THREE.Group();
    // Barracas
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
    }
    group.position.set(-78, 0, -25);
    scene.add(group);
  }
  function makeFuelStation() {
    const group = new THREE.Group();
    addBox(group, 0, 0, 0, 15, 0.3, 12, materials.concrete);
    // Cobertura
    addBox(group, 0, 4, 0, 15, 0.45, 12, materials.yellow);
    // Pilares
    for (const x of [-6, 6]) {
      for (const z of [-4, 4]) {
        addBox(group, x, 0.3, z, 0.4, 3.7, 0.4, materials.white);
      }
    }

    // Bombas
    for (let i = -1; i <= 1; i++) {
      addBox(group, i * 4, 0.3, 0, 1.1, 1.6, 0.8, materials.white);
      addBox(group, i * 4, 1.9, 0, 0.8, 0.4, 0.12, materials.black);
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

    // Passeio da marginal
    addBox(scene, -108, 0, 0, 3, 0.25, 230, materials.sidewalk);

    // Palmeiras na marginal
    for (let z = -100; z <= 100; z += 18) {
      makeTree(-106, z, true);
    }
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
  buildPeople();

  // Carro inicial perto do jogador
  makeCar(5, 25, 0xc62828, 0);

  // Outros carros pela cidade
  makeCar(-42, 35, 0xeeeeee, Math.PI / 2);
  makeCar(55, -70, 0x2255aa, Math.PI / 2);
  makeCar(-72, 70, 0x252525, 0);

  return world;
}
