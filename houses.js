
import * as THREE from 'three';

// ANGOLA LIFE 3D — CASAS E INTERIORES

export function createHouseSystem(scene, world = { buildings: [] }) {
  const houses = [];

  const material = (color, roughness = 0.85, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const mat = {
    wall: material(0xe9dfce),
    wallAlt: material(0xd4bda0),
    plaster: material(0xf5eee2),
    roof: material(0x754333),
    roofDark: material(0x49352e),
    wood: material(0x70452e),
    woodLight: material(0xa9794f),
    tile: material(0xcbd3d2),
    floor: material(0xb18a65),
    white: material(0xf2eee5),
    sofa: material(0x426779),
    fabric: material(0xd9c9ad),
    red: material(0x984a3c),
    dark: material(0x25292b),
    metal: material(0x929a9b, 0.4, 0.5),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x75b9d0,
      transparent: true,
      opacity: 0.48,
      roughness: 0.2
    }),
    green: material(0x397343),
    leaf: material(0x64954d),
    concrete: material(0xaaa69d),
    black: material(0x17191b),
    gold: material(0xc59a50, 0.35, 0.4)
  };

  function box(parent, x, y, z, w, h, d, matRef, shadows = true) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      matRef
    );

    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  function cylinder(parent, x, y, z, radius, height, matRef) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      matRef
    );

    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);

    return mesh;
  }

  function addWindow(group, x, y, z, width, height, front = true) {
    const frameZ = z + (front ? 0.09 : -0.09);

    box(group, x, y, z, width, height, 0.07, mat.glass, false);

    box(group, x, y - 0.06, frameZ, width + 0.18, 0.12, 0.12, mat.white);
    box(group, x, y + height - 0.04, frameZ, width + 0.18, 0.12, 0.12, mat.white);
    box(group, x - width / 2 - 0.04, y, frameZ, 0.1, height, 0.12, mat.white);
    box(group, x + width / 2 + 0.04, y, frameZ, 0.1, height, 0.12, mat.white);
    box(group, x, y, frameZ + (front ? 0.04 : -0.04), 0.055, height, 0.07, mat.white);

    box(group, x, y - height / 2 - 0.18, frameZ, width + 0.45, 0.12, 0.35, mat.concrete);
  }

  function addTree(group, x, z) {
    cylinder(group, x, 0, z, 0.18, 1.7, mat.wood);

    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 12, 10),
      mat.leaf
    );

    crown.position.set(x, 2.25, z);
    crown.castShadow = true;
    group.add(crown);
  }

  function createExterior(location, variant) {
    const group = new THREE.Group();
    const facade = variant === 1
      ? mat.plaster
      : variant === 2
        ? mat.wallAlt
        : mat.wall;

    const frontZ = 6;

    // Base e paredes
    box(group, 0, -0.12, 0, 13.5, 0.25, 13.5, mat.concrete);
    box(group, -6.3, 0, 0, 0.35, 4.55, 12.6, facade);
    box(group, 6.3, 0, 0, 0.35, 4.55, 12.6, facade);
    box(group, 0, 0, -6.1, 12.9, 4.55, 0.35, facade);

    // Fachada frontal com entrada central
    box(group, -4.55, 0, frontZ, 3.8, 4.55, 0.35, facade);
    box(group, 4.55, 0, frontZ, 3.8, 4.55, 0.35, facade);
    box(group, 0, 3.35, frontZ, 5.4, 1.2, 0.35, facade);

    // Rodapé exterior
    box(group, 0, 0, 6.2, 12.7, 0.3, 0.2, mat.concrete);

    // Alpendre
    box(group, 0, 0, 7.35, 5.8, 0.22, 2.5, mat.tile);
    box(group, 0, 2.85, 7.25, 6.3, 0.2, 2.8, mat.roof);

    for (const x of [-2.65, 2.65]) {
      box(group, x, 0, 7.25, 0.22, 2.85, 0.22, mat.white);
    }

    // Porta de entrada
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-1.82, 0.08, 6.12);
    group.add(doorPivot);

    box(doorPivot, 0.88, 0, 0, 1.76, 2.72, 0.14, mat.wood);
    box(doorPivot, 0.88, 0.18, -0.09, 1.48, 2.28, 0.035, mat.woodLight);
    box(doorPivot, 0.88, 1.25, -0.13, 0.7, 0.8, 0.035, mat.dark);
    cylinder(doorPivot, 1.53, 1.25, -0.12, 0.055, 0.1, mat.gold);

    doorPivot.rotation.y = -1.08;

    // Janelas
    addWindow(group, -4.55, 1.45, 6.2, 1.65, 1.45);
    addWindow(group, 4.55, 1.45, 6.2, 1.65, 1.45);
    addWindow(group, -6.48, 1.45, -1.4, 1.8, 1.45, false);
    addWindow(group, 6.48, 1.45, -1.4, 1.8, 1.45, false);

    // Telhado inclinado
    const leftRoof = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.28, 14),
      mat.roof
    );

    leftRoof.position.set(-3.45, 5.05, 0);
    leftRoof.rotation.z = -0.42;
    leftRoof.castShadow = true;
    group.add(leftRoof);

    const rightRoof = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.28, 14),
      mat.roof
    );

    rightRoof.position.set(3.45, 5.05, 0);
    rightRoof.rotation.z = 0.42;
    rightRoof.castShadow = true;
    group.add(rightRoof);

    box(group, 0, 4.55, 0, 0.22, 0.35, 14.2, mat.roofDark);
    box(group, 4.2, 4.45, -3.8, 0.8, 1.2, 0.8, mat.wallAlt);

    // Lâmpadas da fachada
    for (const x of [-5.8, 5.8]) {
      box(group, x, 2.65, 6.25, 0.18, 0.3, 0.12, mat.dark);

      const lamp = new THREE.PointLight(0xffd49a, 0.35, 5);
      lamp.position.set(x, 2.65, 6.45);
      group.add(lamp);
    }

    // Jardim e caminho
    for (const x of [-8.2, 8.2]) {
      addTree(group, x, 5.8);
    }

    box(group, 0, -0.02, 9.5, 18, 0.12, 5, mat.green, false);
    box(group, 0, 0.02, 8.05, 4.4, 0.08, 3.2, mat.concrete, false);

    // Pequena vedação lateral
    for (const x of [-9.2, 9.2]) {
      box(group, x, 0.05, 9.5, 0.18, 1.0, 5, mat.white);

      for (const z of [7.5, 9.0, 10.5, 11.5]) {
        box(group, x, 0.05, z, 0.12, 1.2, 0.12, mat.concrete);
      }
    }

    group.position.set(location.x, 0, location.z);
    scene.add(group);

    const colliders = [];

    const add = (x, z, w, d) => {
      colliders.push({
        minX: location.x + x - w / 2,
        maxX: location.x + x + w / 2,
        minZ: location.z + z - d / 2,
        maxZ: location.z + z + d / 2
      });
    };

    add(-6.3, 0, 0.65, 12.6);
    add(6.3, 0, 0.65, 12.6);
    add(0, -6.1, 12.9, 0.65);
    add(-4.55, 6, 3.8, 0.65);
    add(4.55, 6, 3.8, 0.65);

    return {
      exterior: group,
      roof: leftRoof,
      colliders,
      doorPivot
    };
  }

  function addLivingRoom(g, variant) {
    const sofaPalette = [mat.sofa, mat.red, mat.green, mat.woodLight, mat.dark];
    const sofaMaterial = sofaPalette[variant % sofaPalette.length];

    // Sofá
    box(g, -5.7, 0.28, 2.0, 3.8, 0.55, 1.15, sofaMaterial);
    box(g, -5.7, 0.82, 1.45, 3.8, 0.75, 0.2, sofaMaterial);
    box(g, -7.55, 0.48, 2.0, 0.25, 0.7, 1.15, sofaMaterial);
    box(g, -3.85, 0.48, 2.0, 0.25, 0.7, 1.15, sofaMaterial);

    // Almofadas
    for (const x of [-6.8, -5.7, -4.6]) {
      box(g, x, 0.95, 1.45, 0.7, 0.35, 0.18, mat.fabric);
    }

    // Mesa de centro
    box(g, -5.4, 0.48, -0.2, 2.1, 0.14, 1.1, mat.woodLight);

    for (const x of [-6.25, -4.55]) {
      for (const z of [-0.65, 0.25]) {
        box(g, x, 0, z, 0.1, 0.48, 0.1, mat.wood);
      }
    }

    // Móvel de televisão
    box(g, -5.6, 0, -3.1, 3.7, 0.8, 0.65, mat.wood);
    box(g, -5.6, 0.85, -3.35, 2.7, 1.55, 0.12, mat.dark);
    box(g, -5.6, 1.65, -3.27, 0.4, 0.04, 0.03, mat.white);

    // Tapete
    box(g, -5.6, 0.03, 1.2, 5.2, 0.04, 4.1, mat.fabric, false);
  }

  function addBedroom(g, variant) {
    // Cama
    box(g, -5.7, 0.18, -6.1, 3.4, 0.35, 3.8, mat.wood);
    box(g, -5.7, 0.55, -6.1, 3.3, 0.22, 3.7, mat.white);
    box(g, -5.7, 0.78, -7.35, 3.25, 0.35, 1.0, mat.wood);
    box(g, -5.7, 0.8, -5.0, 3.2, 0.18, 1.0, variant === 1 ? mat.red : mat.fabric);

    for (const x of [-6.45, -4.95]) {
      box(g, x, 0.82, -7.15, 0.85, 0.18, 0.65, mat.white);
    }

    // Guarda-roupa e cómoda
    box(g, -1.7, 0, -6.5, 1.3, 2.65, 2.0, mat.woodLight);
    box(g, -1.5, 0, -3.8, 1.7, 0.95, 0.65, mat.wood);

    for (const y of [0.5, 1.1, 1.7]) {
      box(g, -1.5, y, -3.42, 1.45, 0.045, 0.04, mat.gold);
    }

    // Candeeiro de cabeceira
    box(g, -3.3, 0, -7.2, 0.55, 0.75, 0.55, mat.wood);
    cylinder(g, -3.3, 0.75, -7.2, 0.22, 0.35, mat.fabric);
  }

  function addKitchen(g, variant) {
    const cabinet = variant % 2 === 0 ? mat.woodLight : mat.white;

    // Armários
    box(g, 5.5, 0.12, 5.8, 5.5, 0.95, 1.15, cabinet);
    box(g, 5.5, 1.08, 5.8, 5.65, 0.13, 1.3, mat.dark);

    for (const x of [3.4, 4.5, 5.6, 6.7, 7.6]) {
      box(g, x, 0.2, 5.15, 0.95, 0.72, 0.08, mat.woodLight);
      box(g, x, 0.5, 5.08, 0.06, 0.12, 0.05, mat.metal);
    }

    // Lava-loiça e fogão
    box(g, 3.7, 1.18, 5.55, 1.05, 0.04, 0.65, mat.metal);
    box(g, 6.6, 1.2, 5.7, 1.05, 0.07, 0.8, mat.dark);

    for (const x of [6.3, 6.9]) {
      for (const z of [5.48, 5.88]) {
        cylinder(g, x, 1.28, z, 0.13, 0.035, mat.metal);
      }
    }

    // Frigorífico
    box(g, 8.05, 0, 3.35, 1.0, 2.4, 1.1, mat.white);
    box(g, 8.05, 1.15, 3.93, 0.08, 0.8, 0.06, mat.metal);

    // Mesa auxiliar
    box(g, 5.5, 0.85, 3.2, 2.2, 0.12, 1.2, mat.woodLight);

    for (const x of [4.65, 6.35]) {
      for (const z of [2.8, 3.6]) {
        box(g, x, 0, z, 0.1, 0.82, 0.1, mat.wood);
      }
    }
  }

  function addDining(g) {
    box(g, 2.0, 0.85, -0.3, 3.0, 0.16, 1.7, mat.woodLight);

    for (const x of [0.85, 3.15]) {
      for (const z of [-1.0, 0.4]) {
        box(g, x, 0, z, 0.42, 0.82, 0.42, mat.wood);
        box(g, x, 0.42, z, 0.48, 0.12, 0.48, mat.fabric);
      }
    }
  }

  function addBathroom(g) {
    box(g, 7.25, 0.02, -7.0, 3.2, 0.06, 3.6, mat.tile, false);
    box(g, 5.65, 0, -7.0, 0.14, 2.45, 3.5, mat.wallAlt);
    box(g, 7.2, 0, -8.75, 3.0, 2.45, 0.14, mat.wallAlt);

    // Duche
    box(g, 7.75, 0.12, -7.65, 1.35, 0.12, 1.35, mat.white);
    box(g, 7.75, 0.15, -7.0, 1.25, 2.15, 0.06, mat.glass);

    // Sanita e lavatório
    box(g, 6.35, 0.12, -5.65, 0.75, 0.4, 0.9, mat.white);
    box(g, 6.35, 0.55, -5.25, 0.65, 0.75, 0.2, mat.white);
    box(g, 8.25, 0.75, -5.55, 1.0, 0.12, 0.6, mat.white);
  }

  function addInteriorLights(g) {
    const light = new THREE.PointLight(0xffe0b5, 0.65, 18);
    light.position.set(0, 3.4, 0);
    g.add(light);

    for (const x of [-5.5, 5.5]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe2ad })
      );

      lamp.position.set(x, 3.65, 0);
      g.add(lamp);
    }
  }

  function createInterior(index, propertyType = 'casa de bairro') {
    const g = new THREE.Group();
    const variant = index % 5;
    const floorColors = [0xb18a65, 0xc8bba7, 0x9ca6a8, 0xe0ded5, 0xf0ece3];
    const wallColors = [0xe9dfce, 0xd7c7ad, 0xe7e2d8, 0xf2eee5, 0xe5e1d8];
    const floorMaterial = material(floorColors[variant], 0.82);
    const wallMaterial = material(wallColors[variant], 0.9);

    // Acabamentos interiores diferentes por casa e por categoria.
    const typeFloor = String(propertyType).toLowerCase().includes('luxo') ? 0xf0ece3
      : String(propertyType).toLowerCase().includes('musseque') ? 0x9b8068
      : floorColors[variant];
    floorMaterial.color.setHex(typeFloor);

    box(g, 0, -0.16, 0, 18, 0.32, 18, floorMaterial);
    box(g, 5.5, 0.012, 5.5, 7.0, 0.035, 4.5, mat.tile, false);
    box(g, 7.2, 0.018, -7.0, 3.2, 0.035, 3.8, mat.tile, false);

    // Paredes exteriores
    box(g, -9, 0, 0, 0.3, 4.2, 18, wallMaterial);
    box(g, 9, 0, 0, 0.3, 4.2, 18, wallMaterial);
    box(g, 0, 0, -9, 18, 4.2, 0.3, wallMaterial);
    box(g, -6.5, 0, 9, 5, 4.2, 0.3, wallMaterial);
    box(g, 6.5, 0, 9, 5, 4.2, 0.3, wallMaterial);
    box(g, 0, 3.7, 9, 8, 0.5, 0.3, wallMaterial);

    // Divisões interiores
    box(g, -1.0, 0, -6.85, 0.16, 2.65, 4.1, mat.wallAlt);
    box(g, -1.0, 0, -2.05, 0.16, 2.65, 1.1, mat.wallAlt);
    box(g, -6.55, 0, -1.45, 4.9, 2.65, 0.16, mat.wallAlt);
    box(g, -2.0, 0, -1.45, 2.0, 2.65, 0.16, mat.wallAlt);
    box(g, 5.5, 0, -6.9, 0.16, 2.45, 3.8, mat.wallAlt);
    box(g, 5.5, 0, -2.35, 0.16, 2.45, 1.3, mat.wallAlt);
    box(g, 7.2, 0, -8.6, 3.5, 2.45, 0.16, mat.wallAlt);

    addLivingRoom(g, variant);
    addBedroom(g, variant);
    addKitchen(g, variant);
    addDining(g);
    addBathroom(g);

    // Pequenos elementos decorativos diferentes tornam cada interior menos repetido.
    const decorColors = [0x286447, 0x9a3c32, 0x315d83, 0xc59a50, 0x5b526f];
    const wallArt = box(g, 0, 2.25, -8.72, 2.2, 1.25, 0.08, material(decorColors[variant]));
    wallArt.castShadow = false;
    if (variant === 1 || variant === 3) {
      box(g, 7.7, 0.8, 0.1, 0.8, 1.6, 0.8, mat.green);
      cylinder(g, 7.7, 2.35, 0.1, 0.55, 0.7, mat.leaf);
    } else if (variant === 2 || variant === 4) {
      box(g, -8.1, 0.2, -3.8, 0.65, 2.3, 0.65, mat.wood);
      for (const y of [0.8, 1.35, 1.9]) {
        box(g, -7.72, y, -3.8, 0.08, 0.05, 0.55, mat.gold);
      }
    }
    addInteriorLights(g);

    // Cobertura removível pelo sistema de entrada
    const roof = box(g, 0, 4.2, 0, 18, 0.18, 18, mat.wall, false);

    const interiorX = 500 + index * 35;
    const interiorZ = 0;

    g.position.set(interiorX, 0, interiorZ);
    g.visible = false;
    scene.add(g);

    const colliders = [];

    const add = (x, z, w, d) => {
      colliders.push({
        minX: interiorX + x - w / 2,
        maxX: interiorX + x + w / 2,
        minZ: interiorZ + z - d / 2,
        maxZ: interiorZ + z + d / 2
      });
    };

    // Paredes
    add(-9, 0, 0.45, 18);
    add(9, 0, 0.45, 18);
    add(0, -9, 18, 0.45);
    add(-6.5, 9, 5, 0.45);
    add(6.5, 9, 5, 0.45);

    // Divisórias
    add(-1.0, -6.85, 0.25, 4.1);
    add(-1.0, -2.05, 0.25, 1.1);
    add(-6.55, -1.45, 4.9, 0.25);
    add(-2.0, -1.45, 2.0, 0.25);
    add(5.5, -6.9, 0.25, 3.8);
    add(5.5, -2.35, 0.25, 1.3);
    add(7.2, -8.6, 3.5, 0.25);

    // Móveis
    add(-5.8, 2.0, 3.9, 1.2);
    add(-5.6, -3.1, 3.8, 0.75);
    add(-5.7, -6.1, 3.5, 3.9);
    add(-1.7, -6.5, 1.4, 2.1);
    add(5.5, 5.8, 5.6, 1.2);
    add(8.05, 3.35, 1.1, 1.15);
    add(2.0, -0.3, 3.0, 1.8);

    return {
      group: g,
      roof,
      interiorX,
      interiorZ,
      colliders
    };
  }

  function createCommercialInterior(index, kind = 'boutique', title = 'Loja') {
    const g = new THREE.Group();
    const wall = material(0xe9e5dc, 0.92);
    const floor = material(kind === 'hotel' ? 0x9b8876 : 0xb7b1a6, 0.82);
    const dark = material(0x202b30, 0.55);
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x91c8d5, roughness: 0.18, transparent: true, opacity: 0.55
    });
    const gold = material(0xc89a4c, 0.38, 0.35);
    const wood = material(0x80583d, 0.78);
    box(g, 0, -0.16, 0, 18, 0.32, 18, floor);
    box(g, -9, 0, 0, 0.3, 4.4, 18, wall);
    box(g, 9, 0, 0, 0.3, 4.4, 18, wall);
    box(g, 0, 0, -9, 18, 4.4, 0.3, wall);
    box(g, -6.5, 0, 9, 5, 4.4, 0.3, wall);
    box(g, 6.5, 0, 9, 5, 4.4, 0.3, wall);
    box(g, 0, 4.25, 0, 18, 0.2, 18, wall, false);
    box(g, 0, 2.0, 8.82, 4.0, 2.5, 0.12, glass, false);

    if (kind === 'boutique') {
      // Boutique com provadores, espelhos, balcão e expositores de roupa.
      box(g, 0, 0.0, -7.4, 5.8, 2.6, 2.8, wall);
      box(g, 0, 2.55, -7.4, 6.0, 0.12, 2.9, wood);
      for (const x of [-6.2, -2.4, 2.4, 6.2]) {
        cylinder(g, x, 0.1, -2.8, 0.07, 2.8, gold, 10);
        box(g, x, 2.75, -2.8, 0.12, 0.12, 5.0, dark);
        for (let n = 0; n < 4; n++) {
          const garment = material([0x2f5c89, 0x8f3444, 0x32704e, 0xd2a34d, 0xe8e2d5][(n + Math.round(x)) % 5 < 0 ? 0 : (n + Math.round(x)) % 5]);
          const hangerX = x - 1.4 + n * 0.9;
          const shape = new THREE.Shape();
          shape.moveTo(-0.38, 0.55);
          shape.lineTo(-0.18, 0.72);
          shape.lineTo(0, 0.62);
          shape.lineTo(0.18, 0.72);
          shape.lineTo(0.38, 0.55);
          shape.lineTo(0.27, 0.25);
          shape.lineTo(0.22, -0.5);
          shape.lineTo(-0.22, -0.5);
          shape.lineTo(-0.27, 0.25);
          shape.closePath();
          const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), garment);
          mesh.position.set(hangerX, 1.75, -2.72);
          mesh.castShadow = false;
          g.add(mesh);
          box(g, hangerX, 2.5, -2.8, 0.035, 0.35, 0.035, gold, false);
        }
      }
      box(g, 0, 0.55, 5.8, 5.6, 1.1, 1.2, wood);
      box(g, 0, 1.15, 5.8, 5.8, 0.12, 1.3, gold);
      for (const x of [-7.5, 7.5]) {
        box(g, x, 0.2, 4.5, 1.0, 2.8, 0.12, glass, false);
      }
    } else if (kind === 'bank') {
      box(g, 0, 0.6, 5.6, 13, 1.2, 1.2, wood);
      box(g, 0, 1.25, 5.55, 13.2, 0.12, 1.35, gold);
      for (const x of [-4.2, 0, 4.2]) {
        box(g, x, 1.4, 5.0, 2.4, 1.2, 0.12, glass, false);
        box(g, x, 0.3, -2.8, 2.8, 0.9, 1.1, wood);
      }
    } else if (kind === 'hotel') {
      box(g, 0, 0.55, 5.8, 7.5, 1.1, 1.2, wood);
      box(g, 0, 1.15, 5.8, 7.7, 0.12, 1.3, gold);
      for (const x of [-5.5, 5.5]) {
        box(g, x, 0.2, -1.5, 2.2, 0.8, 1.0, mat.green);
        box(g, x, 0.95, -2.0, 2.2, 1.2, 0.16, mat.fabric);
      }
    } else if (kind === 'car-dealer') {
      box(g, 0, 0.05, 0, 14, 0.08, 12, mat.tile, false);
      for (const x of [-5, 0, 5]) {
        box(g, x, 0.05, -3, 3.8, 0.12, 6.0, gold);
      }
    } else {
      box(g, 0, 0.5, 5.8, 8, 1.0, 1.0, wood);
      box(g, 0, 1.1, 5.8, 8.2, 0.12, 1.2, gold);
    }

    const interiorX = 500 + (index + 100) * 35;
    const interiorZ = 0;
    g.position.set(interiorX, 0, interiorZ);
    g.visible = false;
    scene.add(g);
    const colliders = [
      { minX: interiorX - 9.3, maxX: interiorX - 8.7, minZ: -9, maxZ: 9 },
      { minX: interiorX + 8.7, maxX: interiorX + 9.3, minZ: -9, maxZ: 9 },
      { minX: interiorX - 9, maxX: interiorX + 9, minZ: -9.3, maxZ: -8.7 },
      { minX: interiorX - 9, maxX: interiorX - 4, minZ: 8.7, maxZ: 9.3 },
      { minX: interiorX + 4, maxX: interiorX + 9, minZ: 8.7, maxZ: 9.3 }
    ];
    return { group: g, roof: null, interiorX, interiorZ, colliders };
  }

  // Todas as moradias e apartamentos criados na cidade passam a ter interior.
  // Os interiores são carregados apenas quando o jogador entra, para poupar memória
  // nos telemóveis e computadores mais modestos.
  const locations = (world.buildings || [])
    .filter(building =>
      ((building.type === 'house' || building.type === 'apartment') && building.forSale !== false) ||
      (building.type === 'shop' && ['boutique', 'bank', 'hotel', 'car-dealer'].includes(building.kind))
    )
    .map(building => ({
      name: building.propertyType || building.facility || 'Casa',
      x: building.x,
      z: building.z,
      width: building.width,
      depth: building.depth,
      district: building.district || 'Luanda',
      propertyType: building.propertyType || (building.type === 'shop' ? building.facility || building.kind : building.type === 'apartment' ? 'apartamento' : 'casa'),
      commercialKind: building.kind || null,
      isCommercial: building.type === 'shop',
      salePrice: Number(building.salePrice || 0),
      entranceX: Number(building.entranceX ?? building.x),
      entranceZ: Number(building.entranceZ ?? (building.z + building.depth / 2 + 2)),
      exterior: building.group
    }));

  locations.forEach((location, index) => {
    const house = { ...location, colliders: [], interior: null, interiorRoof: null };

    house.ensureInterior = () => {
      if (house.interior) return house;
      const inside = house.isCommercial
        ? createCommercialInterior(index, house.commercialKind, house.name)
        : createInterior(index, house.propertyType);
      house.interior = inside.group;
      house.interiorRoof = inside.roof;
      house.interiorX = inside.interiorX;
      house.interiorZ = inside.interiorZ;
      house.colliders = inside.colliders;
      return house;
    };

    houses.push(house);
  });

  return houses;
}
