
import * as THREE from 'three';

// ANGOLA LIFE 3D — CASAS MOBILADAS E HABITÁVEIS
// Mantém a compatibilidade com main.js e player.js.

export function createHouseSystem(scene) {
  const houses = [];

  const mat = {
    wall: new THREE.MeshStandardMaterial({ color: 0xe9dfcf, roughness: 0.95 }),
    wall2: new THREE.MeshStandardMaterial({ color: 0xd4c1a5, roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x9b704c, roughness: 0.9 }),
    tile: new THREE.MeshStandardMaterial({ color: 0xcbd3d2, roughness: 0.8 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x70452e, roughness: 0.85 }),
    wood2: new THREE.MeshStandardMaterial({ color: 0xa9794f, roughness: 0.85 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2eee5, roughness: 0.8 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x426779, roughness: 1 }),
    red: new THREE.MeshStandardMaterial({ color: 0x984a3c, roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xd9c9ad, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x25292b, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x929a9b, metalness: 0.5, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x75b9d0, transparent: true, opacity: 0.4 }),
    green: new THREE.MeshStandardMaterial({ color: 0x397343, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x64954d, roughness: 1 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x844b36, roughness: 0.95 }),
    exterior: new THREE.MeshStandardMaterial({ color: 0xd9b991, roughness: 0.95 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf5e6ce, roughness: 0.9 })
  };

  function box(parent, x, y, z, w, h, d, material, shadow = true) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, radius, height, material) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 16),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function sphere(parent, x, y, z, radius, material) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 14, 12),
      material
    );
    mesh.position.set(x, y + radius, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function windowFrame(group, x, y, z, width, height) {
    box(group, x, y, z, width, height, 0.08, mat.glass, false);
    box(group, x, y - 0.06, z - 0.08, width + 0.16, 0.12, 0.12, mat.trim);
    box(group, x, y + height - 0.04, z - 0.08, width + 0.16, 0.12, 0.12, mat.trim);
    box(group, x - width / 2 - 0.04, y, z - 0.08, 0.1, height, 0.12, mat.trim);
    box(group, x + width / 2 + 0.04, y, z - 0.08, 0.1, height, 0.12, mat.trim);
    box(group, x, y, z - 0.1, 0.055, height, 0.08, mat.trim);
  }

  function createExterior(location, variant) {
    const group = new THREE.Group();
    const facade = variant === 1 ? mat.white : variant === 2 ? mat.wall2 : mat.exterior;

    box(group, 0, 0, -5.8, 13, 4.6, 0.35, facade);
    box(group, -6.3, 0, 0, 0.35, 4.6, 12, facade);
    box(group, 6.3, 0, 0, 0.35, 4.6, 12, facade);

    // Fachada com entrada central.
    box(group, -4.5, 0, 6, 4, 4.6, 0.35, facade);
    box(group, 4.5, 0, 6, 4, 4.6, 0.35, facade);
    box(group, 0, 3.25, 6, 5, 1.35, 0.35, facade);

    // Porta e moldura.
    box(group, -1.08, 0, 6.08, 0.14, 2.85, 0.22, mat.wood);
    box(group, 1.08, 0, 6.08, 0.14, 2.85, 0.22, mat.wood);
    box(group, 0, 2.85, 6.08, 2.3, 0.14, 0.22, mat.wood);
    box(group, 0, 0, 5.91, 1.9, 2.75, 0.1, mat.wood2);
    box(group, 0.72, 1.25, 5.82, 0.07, 0.07, 0.07, mat.metal);

    // Alpendre e telhado.
    box(group, 0, 0, 7.15, 4.6, 0.22, 2.4, mat.tile);
    box(group, 0, 2.9, 7.1, 5.2, 0.18, 2.8, mat.roof);
    const roof = box(group, 0, 4.65, 0, 14, 0.45, 14, mat.roof);
    box(group, 0, 4.48, 0, 14.2, 0.12, 14.2, mat.wood);

    windowFrame(group, -3.8, 1.45, 6.2, 1.7, 1.35);
    windowFrame(group, 3.8, 1.45, 6.2, 1.7, 1.35);

    for (const x of [-5.7, 5.7]) {
      cylinder(group, x, 0, 6.2, 0.24, 0.5, mat.wood2);
      cylinder(group, x, 0.5, 6.2, 0.06, 0.9, mat.green);
      sphere(group, x - 0.2, 1.2, 6.2, 0.38, mat.leaf);
      sphere(group, x + 0.2, 1.35, 6.2, 0.38, mat.leaf);
    }

    group.position.set(location.x, 0, location.z);
    scene.add(group);

    const colliders = [];
    const add = (x, z, w, d) => colliders.push({
      minX: location.x + x - w / 2,
      maxX: location.x + x + w / 2,
      minZ: location.z + z - d / 2,
      maxZ: location.z + z + d / 2
    });

    add(-6.3, 0, 0.65, 12);
    add(6.3, 0, 0.65, 12);
    add(0, -5.8, 13, 0.65);
    add(-4.5, 6, 4, 0.65);
    add(4.5, 6, 4, 0.65);

    return { exterior: group, roof, colliders };
  }

  function addLivingRoom(g, variant) {
    const sofa = variant === 2 ? mat.red : mat.sofa;

    box(g, -5.8, 0.28, 1.8, 3.8, 0.55, 1.15, sofa);
    box(g, -5.8, 0.82, 1.25, 3.8, 0.75, 0.2, sofa);
    box(g, -7.65, 0.48, 1.8, 0.25, 0.7, 1.15, sofa);
    box(g, -3.95, 0.48, 1.8, 0.25, 0.7, 1.15, sofa);

    for (const x of [-6.9, -5.8, -4.7]) {
      box(g, x, 0.9, 1.65, 0.65, 0.12, 0.5, mat.fabric);
    }

    box(g, -5.6, 0.025, -0.3, 5.4, 0.04, 3.3, mat.fabric, false);
    box(g, -5.6, 0.48, -0.3, 2.1, 0.14, 1.1, mat.wood2);

    for (const x of [-6.45, -4.75]) {
      for (const z of [-0.7, 0.1]) {
        box(g, x, 0, z, 0.1, 0.48, 0.1, mat.wood);
      }
    }

    box(g, -5.6, 0, -3.1, 3.7, 0.8, 0.65, mat.wood);
    box(g, -5.6, 0.85, -3.35, 2.7, 1.55, 0.12, mat.dark);
    box(g, -5.6, 1.65, -3.27, 0.4, 0.04, 0.03, mat.white);

    cylinder(g, -8.1, 0, -1.0, 0.28, 0.08, mat.metal);
    cylinder(g, -8.1, 0.08, -1.0, 0.035, 1.65, mat.metal);
    cylinder(g, -8.1, 1.7, -1.0, 0.3, 0.35, mat.white);
  }

  function addBedroom(g, variant) {
    box(g, -5.7, 0.18, -6.1, 3.4, 0.35, 3.8, mat.wood);
    box(g, -5.7, 0.55, -6.1, 3.3, 0.22, 3.7, mat.white);
    box(g, -5.7, 0.78, -7.35, 3.25, 0.35, 1.0, mat.wood);
    box(g, -5.7, 0.8, -5.0, 3.2, 0.18, 1.0, variant === 1 ? mat.red : mat.fabric);

    box(g, -6.45, 0.82, -7.15, 0.85, 0.18, 0.65, mat.white);
    box(g, -4.95, 0.82, -7.15, 0.85, 0.18, 0.65, mat.white);

    for (const x of [-7.9, -3.5]) {
      box(g, x, 0, -7.15, 0.85, 0.75, 0.8, mat.wood2);
      box(g, x, 0.78, -7.15, 0.35, 0.04, 0.35, mat.white);
      cylinder(g, x, 0.82, -7.15, 0.1, 0.3, mat.white);
    }

    box(g, -1.7, 0, -6.5, 1.3, 2.65, 2.0, mat.wood2);
    box(g, -2.05, 0.1, -5.46, 0.05, 2.4, 0.05, mat.metal);
    box(g, -1.35, 0.1, -5.46, 0.05, 2.4, 0.05, mat.metal);

    box(g, -1.5, 0, -3.8, 1.7, 0.95, 0.65, mat.wood);
    for (const y of [0.25, 0.55]) {
      box(g, -1.5, y, -3.45, 1.5, 0.025, 0.04, mat.metal);
    }
  }

  function addKitchen(g, variant) {
    const cabinet = variant === 2 ? mat.wood2 : mat.white;

    box(g, 5.5, 0.12, 5.8, 5.5, 0.95, 1.15, cabinet);
    box(g, 5.5, 1.08, 5.8, 5.65, 0.13, 1.3, mat.dark);

    for (const x of [3.4, 4.5, 5.6, 6.7, 7.6]) {
      box(g, x, 0.2, 5.15, 0.95, 0.72, 0.08, mat.wood2);
      box(g, x, 0.5, 5.08, 0.06, 0.12, 0.05, mat.metal);
    }

    box(g, 3.7, 1.18, 5.55, 1.05, 0.04, 0.65, mat.metal);
    cylinder(g, 3.7, 1.22, 5.45, 0.035, 0.32, mat.metal);

    box(g, 6.6, 1.2, 5.7, 1.05, 0.07, 0.8, mat.dark);
    for (const x of [6.3, 6.9]) {
      for (const z of [5.48, 5.88]) {
        cylinder(g, x, 1.28, z, 0.13, 0.035, mat.metal);
      }
    }

    for (const x of [3.7, 5.5, 7.2]) {
      box(g, x, 2.05, 5.95, 1.45, 1.05, 0.48, cabinet);
      box(g, x, 2.1, 5.68, 0.06, 0.15, 0.05, mat.metal);
    }

    box(g, 8.05, 0, 3.35, 1.0, 2.4, 1.1, mat.white);
    box(g, 8.05, 1.25, 2.78, 0.06, 0.035, 0.05, mat.metal);
    box(g, 8.05, 0.35, 2.78, 0.06, 0.035, 0.05, mat.metal);

    box(g, 5.5, 0.85, 3.2, 2.2, 0.12, 1.2, mat.wood2);
    for (const x of [4.65, 6.35]) {
      for (const z of [2.8, 3.6]) {
        box(g, x, 0, z, 0.1, 0.82, 0.1, mat.wood);
      }
    }
  }

  function addDining(g, variant) {
    box(g, 2.0, 0.85, -0.3, 3.0, 0.16, 1.7, mat.wood2);

    for (const x of [0.85, 3.15]) {
      for (const z of [-1.0, 0.4]) {
        box(g, x, 0, z, 0.42, 0.82, 0.42, mat.wood);
        box(g, x, 0.42, z, 0.48, 0.12, 0.48, mat.fabric);
      }
    }

    cylinder(g, 2.0, 1.02, -0.3, 0.32, 0.025, mat.white);
    cylinder(g, 2.0, 1.05, -0.3, 0.1, 0.1, mat.green);
  }

  function addBathroom(g) {
    box(g, 7.25, 0.02, -7.0, 3.2, 0.06, 3.6, mat.tile, false);
    box(g, 5.65, 0, -7.0, 0.14, 2.45, 3.5, mat.wall2);
    box(g, 7.2, 0, -8.75, 3.0, 2.45, 0.14, mat.wall2);

    box(g, 7.75, 0.12, -7.65, 1.35, 0.12, 1.35, mat.white);
    box(g, 7.75, 0.15, -7.0, 1.25, 2.15, 0.06, mat.glass);
    cylinder(g, 7.75, 2.3, -8.05, 0.13, 0.06, mat.metal);

    box(g, 6.35, 0.12, -5.65, 0.75, 0.4, 0.9, mat.white);
    sphere(g, 6.35, 0.48, -5.65, 0.3, mat.white);
    box(g, 6.35, 0.55, -5.25, 0.65, 0.75, 0.2, mat.white);

    box(g, 8.25, 0.75, -5.55, 1.0, 0.12, 0.6, mat.white);
    box(g, 8.25, 0.12, -5.55, 0.16, 0.68, 0.16, mat.white);
    box(g, 8.25, 1.2, -5.45, 0.85, 0.9, 0.06, mat.glass);
    cylinder(g, 8.25, 0.95, -5.75, 0.035, 0.3, mat.metal);
  }

  function addDecorations(g, variant) {
    box(g, -8.7, 1.1, -2.5, 0.12, 2.0, 2.5, mat.glass, false);
    box(g, -8.55, 1.1, -3.85, 0.16, 2.3, 0.22, variant === 1 ? mat.red : mat.fabric);
    box(g, -8.55, 1.1, -1.15, 0.16, 2.3, 0.22, variant === 1 ? mat.red : mat.fabric);

    box(g, -1.2, 1.7, 8.78, 1.5, 1.0, 0.08, mat.wood);
    box(g, -1.2, 1.78, 8.72, 1.3, 0.8, 0.04, mat.red);

    for (const [x, z] of [[-8, 3.8], [0, 3.2], [8, 1.0]]) {
      cylinder(g, x, 0, z, 0.24, 0.45, mat.wood2);
      cylinder(g, x, 0.45, z, 0.045, 0.85, mat.green);
      sphere(g, x - 0.18, 1.0, z, 0.34, mat.leaf);
      sphere(g, x + 0.18, 1.15, z, 0.34, mat.leaf);
    }

    for (const [x, z] of [[-5, 0], [2, 2], [5, -3], [-4, -6]]) {
      cylinder(g, x, 3.8, z, 0.12, 0.12, mat.metal);
      sphere(g, x, 3.35, z, 0.2, mat.white);

      const light = new THREE.PointLight(0xffdfb5, 0.8, 9);
      light.position.set(x, 3.1, z);
      g.add(light);
    }
  }

  function createInterior(index) {
    const g = new THREE.Group();
    const variant = index % 3;

    // Chão e zonas de cerâmica.
    box(g, 0, -0.16, 0, 18, 0.32, 18, mat.floor);
    box(g, 5.5, 0.012, 5.5, 7.0, 0.035, 4.5, mat.tile, false);
    box(g, 7.2, 0.018, -7.0, 3.2, 0.035, 3.8, mat.tile, false);

    // Paredes exteriores com entrada frontal aberta.
    box(g, -9, 0, 0, 0.3, 4.2, 18, mat.wall);
    box(g, 9, 0, 0, 0.3, 4.2, 18, mat.wall);
    box(g, 0, 0, -9, 18, 4.2, 0.3, mat.wall);
    box(g, -6.5, 0, 9, 5, 4.2, 0.3, mat.wall);
    box(g, 6.5, 0, 9, 5, 4.2, 0.3, mat.wall);
    box(g, 0, 3.7, 9, 8, 0.5, 0.3, mat.wall);

    // Quarto: paredes divididas para deixar uma porta livre.
    box(g, -1.0, 0, -6.85, 0.16, 2.65, 4.1, mat.wall2);
    box(g, -1.0, 0, -2.05, 0.16, 2.65, 1.1, mat.wall2);
    box(g, -6.55, 0, -1.45, 4.9, 2.65, 0.16, mat.wall2);
    box(g, -2.0, 0, -1.45, 2.0, 2.65, 0.16, mat.wall2);

    // Casa de banho: abertura frontal para entrar.
    box(g, 5.5, 0, -6.9, 0.16, 2.45, 3.8, mat.wall2);
    box(g, 5.5, 0, -2.35, 0.16, 2.45, 1.3, mat.wall2);
    box(g, 7.2, 0, -8.6, 3.5, 2.45, 0.16, mat.wall2);

    // Rodapés.
    box(g, -8.78, 0.08, 0, 0.08, 0.16, 17.5, mat.wood2);
    box(g, 8.78, 0.08, 0, 0.08, 0.16, 17.5, mat.wood2);
    box(g, 0, 0.08, -8.78, 17.5, 0.16, 0.08, mat.wood2);

    // Mobiliário.
    addLivingRoom(g, variant);
    addBedroom(g, variant);
    addKitchen(g, variant);
    addDining(g, variant);
    addBathroom(g);
    addDecorations(g, variant);

    // Teto removível ao entrar.
    const roof = box(g, 0, 4.2, 0, 18, 0.18, 18, mat.wall, false);

    // Posição isolada de cada interior.
    const interiorX = 500 + index * 35;
    const interiorZ = 0;

    g.position.set(interiorX, 0, interiorZ);
    g.visible = false;
    scene.add(g);

    // Colisões alinhadas com a posição do interior.
    const colliders = [];

    const add = (x, z, w, d) => colliders.push({
      minX: interiorX + x - w / 2,
      maxX: interiorX + x + w / 2,
      minZ: interiorZ + z - d / 2,
      maxZ: interiorZ + z + d / 2
    });

    // Paredes exteriores.
    add(-9, 0, 0.45, 18);
    add(9, 0, 0.45, 18);
    add(0, -9, 18, 0.45);
    add(-6.5, 9, 5, 0.45);
    add(6.5, 9, 5, 0.45);

    // Divisórias: os vãos das portas ficam sem colisão.
    add(-1.0, -6.85, 0.25, 4.1);
    add(-1.0, -2.05, 0.25, 1.1);
    add(-6.55, -1.45, 4.9, 0.25);
    add(-2.0, -1.45, 2.0, 0.25);

    add(5.5, -6.9, 0.25, 3.8);
    add(5.5, -2.35, 0.25, 1.3);
    add(7.2, -8.6, 3.5, 0.25);

    // Móveis principais.
    add(-5.8, 1.8, 3.9, 1.2);
    add(-5.6, -0.3, 2.2, 1.2);
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

  const locations = [
    { name: 'Casa Familiar', x: 55, z: 35 },
    { name: 'Casa Moderna', x: 55, z: 57 },
    { name: 'Casa do Bairro', x: 78, z: 35 },
    { name: 'Casa Grande', x: 78, z: 57 }
  ];

  locations.forEach((location, index) => {
    const outside = createExterior(location, index % 3);
    const inside = createInterior(index);

    houses.push({
      ...location,
      exterior: outside.exterior,
      exteriorRoof: outside.roof,
      exteriorColliders: outside.colliders,
      interior: inside.group,
      interiorRoof: inside.roof,
      interiorX: inside.interiorX,
      interiorZ: inside.interiorZ,
      colliders: inside.colliders
    });
  });

  return houses;
}
