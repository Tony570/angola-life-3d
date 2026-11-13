
import * as THREE from 'three';

// ANGOLA LIFE 3D — HABITAÇÕES REAIS
// API compatível com main.js: createHouseSystem(scene) devolve casas
// com exteriorColliders, interior, interiorRoof, interiorX/Z e colliders.

export function createHouseSystem(scene) {
  const houses = [];

  const mat = {
    wall: new THREE.MeshStandardMaterial({ color: 0xe8ddca, roughness: 0.95 }),
    wallAlt: new THREE.MeshStandardMaterial({ color: 0xd4c0a3, roughness: 0.95 }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xf0e9dc, roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x754333, roughness: 0.95 }),
    roofDark: new THREE.MeshStandardMaterial({ color: 0x4d3932, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x70452e, roughness: 0.85 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0xa9794f, roughness: 0.85 }),
    tile: new THREE.MeshStandardMaterial({ color: 0xcbd3d2, roughness: 0.8 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x9b704c, roughness: 0.9 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2eee5, roughness: 0.8 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x426779, roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xd9c9ad, roughness: 1 }),
    red: new THREE.MeshStandardMaterial({ color: 0x984a3c, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x25292b, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x929a9b, metalness: 0.5, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x75b9d0, transparent: true, opacity: 0.42, roughness: 0.2 }),
    green: new THREE.MeshStandardMaterial({ color: 0x397343, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x64954d, roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xaaa69d, roughness: 1 }),
    black: new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: 0.6 })
  };

  function box(parent, x, y, z, w, h, d, material, castShadow = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, radius, height, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addWindow(group, x, y, z, width, height, front = true) {
    const depth = 0.12;
    box(group, x, y, z, width, height, 0.07, mat.glass, false);
    const frameZ = z + (front ? 0.09 : -0.09);
    box(group, x, y - 0.06, frameZ, width + 0.18, 0.12, depth, mat.white);
    box(group, x, y + height - 0.04, frameZ, width + 0.18, 0.12, depth, mat.white);
    box(group, x - width / 2 - 0.04, y, frameZ, 0.1, height, depth, mat.white);
    box(group, x + width / 2 + 0.04, y, frameZ, 0.1, height, depth, mat.white);
    box(group, x, y, frameZ + (front ? 0.015 : -0.015), 0.055, height, 0.07, mat.white);
  }

  function addTree(group, x, z) {
    cylinder(group, x, 0, z, 0.18, 1.7, mat.wood);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), mat.leaf);
    crown.position.set(x, 2.25, z);
    crown.castShadow = true;
    group.add(crown);
  }

  function createExterior(location, variant) {
    const group = new THREE.Group();
    const facade = variant === 1 ? mat.plaster : variant === 2 ? mat.wallAlt : mat.wall;
    const frontZ = 6;

    box(group, -6.3, 0, 0, 0.35, 4.55, 12.6, facade);
    box(group, 6.3, 0, 0, 0.35, 4.55, 12.6, facade);
    box(group, 0, 0, -6.1, 12.9, 4.55, 0.35, facade);

    box(group, -4.55, 0, frontZ, 3.8, 4.55, 0.35, facade);
    box(group, 4.55, 0, frontZ, 3.8, 4.55, 0.35, facade);
    box(group, 0, 3.35, frontZ, 5.4, 1.2, 0.35, facade);

    box(group, 0, 0, 6.22, 12.7, 0.28, 0.18, mat.concrete);
    box(group, 0, 0, 7.35, 5.8, 0.22, 2.5, mat.tile);
    box(group, 0, 2.85, 7.25, 6.3, 0.2, 2.8, mat.roof);

    for (const x of [-2.65, 2.65]) {
      box(group, x, 0, 7.25, 0.22, 2.85, 0.22, mat.white);
    }

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-1.82, 0.08, 6.12);
    group.add(doorPivot);
    box(doorPivot, 0.88, 0, 0, 1.76, 2.72, 0.14, mat.wood);
    box(doorPivot, 0.88, 0.18, -0.09, 1.48, 2.28, 0.035, mat.woodLight);
    cylinder(doorPivot, 1.53, 1.25, -0.12, 0.055, 0.1, mat.metal);
    doorPivot.rotation.y = -1.08;

    addWindow(group, -4.55, 1.45, 6.2, 1.65, 1.45);
    addWindow(group, 4.55, 1.45, 6.2, 1.65, 1.45);
    addWindow(group, -6.48, 1.45, -1.4, 1.8, 1.45, false);
    addWindow(group, 6.48, 1.45, -1.4, 1.8, 1.45, false);

    const leftRoof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.28, 14), mat.roof);
    leftRoof.position.set(-3.45, 5.05, 0);
    leftRoof.rotation.z = -0.42;
    leftRoof.castShadow = true;
    group.add(leftRoof);

    const rightRoof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.28, 14), mat.roof);
    rightRoof.position.set(3.45, 5.05, 0);
    rightRoof.rotation.z = 0.42;
    rightRoof.castShadow = true;
    group.add(rightRoof);

    box(group, 0, 4.55, 0, 0.22, 0.35, 14.2, mat.roofDark);
    box(group, 4.2, 4.45, -3.8, 0.8, 1.2, 0.8, mat.wallAlt);

    for (const x of [-5.8, 5.8]) {
      box(group, x, 2.65, 6.25, 0.18, 0.3, 0.12, mat.dark);
      const lamp = new THREE.PointLight(0xffd49a, 0.35, 5);
      lamp.position.set(x, 2.65, 6.45);
      group.add(lamp);
    }

    for (const x of [-8.2, 8.2]) addTree(group, x, 5.8);
    box(group, 0, -0.02, 9.5, 18, 0.12, 5, mat.green, false);
    box(group, 0, 0.02, 8.05, 4.4, 0.08, 3.2, mat.concrete, false);

    group.position.set(location.x, 0, location.z);
    scene.add(group);

    const colliders = [];
    const add = (x, z, w, d) => colliders.push({
      minX: location.x + x - w / 2,
      maxX: location.x + x + w / 2,
      minZ: location.z + z - d / 2,
      maxZ: location.z + z + d / 2
    });

    add(-6.3, 0, 0.65, 12.6);
    add(6.3, 0, 0.65, 12.6);
    add(0, -6.1, 12.9, 0.65);
    add(-4.55, 6, 3.8, 0.65);
    add(4.55, 6, 3.8, 0.65);

    return { exterior: group, roof: leftRoof, colliders, doorPivot };
  }

  function addLivingRoom(g, variant) {
    const sofaMaterial = variant === 2 ? mat.red : mat.sofa;
    box(g, -5.7, 0.28, 2.0, 3.8, 0.55, 1.15, sofaMaterial);
    box(g, -5.7, 0.82, 1.45, 3.8, 0.75, 0.2, sofaMaterial);
    box(g, -7.55, 0.48, 2.0, 0.25, 0.7, 1.15, sofaMaterial);
    box(g, -3.85, 0.48, 2.0, 0.25, 0.7, 1.15, sofaMaterial);
    box(g, -5.4, 0.48, -0.2, 2.1, 0.14, 1.1, mat.woodLight);

    for (const x of [-6.25, -4.55]) {
      for (const z of [-0.65, 0.25]) {
        box(g, x, 0, z, 0.1, 0.48, 0.1, mat.wood);
      }
    }

    box(g, -5.6, 0, -3.1, 3.7, 0.8, 0.65, mat.wood);
    box(g, -5.6, 0.85, -3.35, 2.7, 1.55, 0.12, mat.dark);
    box(g, -5.6, 1.65, -3.27, 0.4, 0.04, 0.03, mat.white);
    box(g, -5.6, 0.03, 1.2, 5.2, 0.04, 4.1, mat.fabric, false);
  }

  function addBedroom(g, variant) {
    box(g, -5.7, 0.18, -6.1, 3.4, 0.35, 3.8, mat.wood);
    box(g, -5.7, 0.55, -6.1, 3.3, 0.22, 3.7, mat.white);
    box(g, -5.7, 0.78, -7.35, 3.25, 0.35, 1.0, mat.wood);
    box(g, -5.7, 0.8, -5.0, 3.2, 0.18, 1.0, variant === 1 ? mat.red : mat.fabric);

    for (const x of [-6.45, -4.95]) {
      box(g, x, 0.82, -7.15, 0.85, 0.18, 0.65, mat.white);
    }

    box(g, -1.7, 0, -6.5, 1.3, 2.65, 2.0, mat.woodLight);
    box(g, -1.5, 0, -3.8, 1.7, 0.95, 0.65, mat.wood);
  }

  function addKitchen(g, variant) {
    const cabinet = variant === 2 ? mat.woodLight : mat.white;
    box(g, 5.5, 0.12, 5.8, 5.5, 0.95, 1.15, cabinet);
    box(g, 5.5, 1.08, 5.8, 5.65, 0.13, 1.3, mat.dark);

    for (const x of [3.4, 4.5, 5.6, 6.7, 7.6]) {
      box(g, x, 0.2, 5.15, 0.95, 0.72, 0.08, mat.woodLight);
      box(g, x, 0.5, 5.08, 0.06, 0.12, 0.05, mat.metal);
    }

    box(g, 3.7, 1.18, 5.55, 1.05, 0.04, 0.65, mat.metal);
    box(g, 6.6, 1.2, 5.7, 1.05, 0.07, 0.8, mat.dark);

    for (const x of [6.3, 6.9]) {
      for (const z of [5.48, 5.88]) {
        cylinder(g, x, 1.28, z, 0.13, 0.035, mat.metal);
      }
    }

    box(g, 8.05, 0, 3.35, 1.0, 2.4, 1.1, mat.white);
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
    box(g, 7.75, 0.12, -7.65, 1.35, 0.12, 1.35, mat.white);
    box(g, 7.75, 0.15, -7.0, 1.25, 2.15, 0.06, mat.glass);
    box(g, 6.35, 0.12, -5.65, 0.75, 0.4, 0.9, mat.white);
    box(g, 6.35, 0.55, -5.25, 0.65, 0.75, 0.2, mat.white);
    box(g, 8.25, 0.75, -5.55, 1.0, 0.12, 0.6, mat.white);
  }

  function createInterior(index) {
    const g = new THREE.Group();
    const variant = index % 3;

    box(g, 0, -0.16, 0, 18, 0.32, 18, mat.floor);
    box(g, 5.5, 0.012, 5.5, 7.0, 0.035, 4.5, mat.tile, false);
    box(g, 7.2, 0.018, -7.0, 3.2, 0.035, 3.8, mat.tile, false);

    box(g, -9, 0, 0, 0.3, 4.2, 18, mat.wall);
    box(g, 9, 0, 0, 0.3, 4.2, 18, mat.wall);
    box(g, 0, 0, -9, 18, 4.2, 0.3, mat.wall);
    box(g, -6.5, 0, 9, 5, 4.2, 0.3, mat.wall);
    box(g, 6.5, 0, 9, 5, 4.2, 0.3, mat.wall);
    box(g, 0, 3.7, 9, 8, 0.5, 0.3, mat.wall);

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

    const roof = box(g, 0, 4.2, 0, 18, 0.18, 18, mat.wall, false);
    const interiorX = 500 + index * 35;
    const interiorZ = 0;

    g.position.set(interiorX, 0, interiorZ);
    g.visible = false;
    scene.add(g);

    const colliders = [];
    const add = (x, z, w, d) => colliders.push({
      minX: interiorX + x - w / 2,
      maxX: interiorX + x + w / 2,
      minZ: interiorZ + z - d / 2,
      maxZ: interiorZ + z + d / 2
    });

    add(-9, 0, 0.45, 18);
    add(9, 0, 0.45, 18);
    add(0, -9, 18, 0.45);
    add(-6.5, 9, 5, 0.45);
    add(6.5, 9, 5, 0.45);
    add(-1.0, -6.85, 0.25, 4.1);
    add(-1.0, -2.05, 0.25, 1.1);
    add(-6.55, -1.45, 4.9, 0.25);
    add(-2.0, -1.45, 2.0, 0.25);
    add(5.5, -6.9, 0.25, 3.8);
    add(5.5, -2.35, 0.25, 1.3);
    add(7.2, -8.6, 3.5, 0.25);

    add(-5.8, 2.0, 3.9, 1.2);
    add(-5.6, -3.1, 3.8, 0.75);
    add(-5.7, -6.1, 3.5, 3.9);
    add(-1.7, -6.5, 1.4, 2.1);
    add(5.5, 5.8, 5.6, 1.2);
    add(8.05, 3.35, 1.1, 1.15);
    add(2.0, -0.3, 3.0, 1.8);

    return { group: g, roof, interiorX, interiorZ, colliders };
  }

  const locations = [
    { name: 'Casa Familiar', x: 108, z: -45 },
    { name: 'Casa Moderna', x: 108, z: -15 },
    { name: 'Casa do Bairro', x: 108, z: 15 },
    { name: 'Casa Grande', x: 108, z: 45 }
  ];

  locations.forEach((location, index) => {
    const outside = createExterior(location, index % 3);
    const inside = createInterior(index);

    houses.push({
      ...location,
      exterior: outside.exterior,
      exteriorRoof: outside.roof,
      exteriorColliders: outside.colliders,
      doorPivot: outside.doorPivot,
      interior: inside.group,
      interiorRoof: inside.roof,
      interiorX: inside.interiorX,
      interiorZ: inside.interiorZ,
      colliders: inside.colliders
    });
  });

  return houses;
}
