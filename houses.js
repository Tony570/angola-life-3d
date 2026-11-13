import * as THREE from 'three';

// ANGOLA LIFE 3D — CASAS HABITÁVEIS
// Compatível com main.js: mantém createHouseSystem e todas as propriedades esperadas.

export function createHouseSystem(scene) {
  const houses = [];
  const M = {
    wall: new THREE.MeshStandardMaterial({ color: 0xe8ddc9, roughness: 0.92 }),
    wall2: new THREE.MeshStandardMaterial({ color: 0xd2bea0, roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xb58b62, roughness: 0.9 }),
    tile: new THREE.MeshStandardMaterial({ color: 0xc5d0d1, roughness: 0.75 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x70452f, roughness: 0.85 }),
    wood2: new THREE.MeshStandardMaterial({ color: 0xa9784e, roughness: 0.85 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x496879, roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xe4d8c6, roughness: 1 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f1e9, roughness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x252a2d, roughness: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x858d91, metalness: 0.55, roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x79b9d0, transparent: true, opacity: 0.42 }),
    green: new THREE.MeshStandardMaterial({ color: 0x47734a, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x65924f, roughness: 1 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x874d38, roughness: 0.95 }),
    exterior: new THREE.MeshStandardMaterial({ color: 0xd7b58b, roughness: 0.95 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf0dfc4, roughness: 0.9 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9d4938, roughness: 0.9 })
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
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 14), material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function sphere(parent, x, y, z, radius, material) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), material);
    mesh.position.set(x, y + radius, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function makeFrontWindow(parent, x, y, z, width, height) {
    box(parent, x, y, z, width, height, 0.08, M.glass, false);
    box(parent, x, y - 0.06, z - 0.08, width + 0.16, 0.1, 0.12, M.trim);
    box(parent, x, y + height - 0.04, z - 0.08, width + 0.16, 0.1, 0.12, M.trim);
    box(parent, x - width / 2 - 0.04, y, z - 0.08, 0.1, height, 0.12, M.trim);
    box(parent, x + width / 2 + 0.04, y, z - 0.08, 0.1, height, 0.12, M.trim);
    box(parent, x, y, z - 0.1, 0.06, height, 0.08, M.trim);
  }

  function createExterior(location, variant) {
    const group = new THREE.Group();
    const facade = variant === 1 ? M.white : variant === 2 ? M.wall2 : M.exterior;

    box(group, 0, 0, -5.8, 13, 4.6, 0.35, facade);
    box(group, -6.3, 0, 0, 0.35, 4.6, 12, facade);
    box(group, 6.3, 0, 0, 0.35, 4.6, 12, facade);

    // Fachada dividida para deixar a entrada central livre.
    box(group, -4.5, 0, 6, 4, 4.6, 0.35, facade);
    box(group, 4.5, 0, 6, 4, 4.6, 0.35, facade);
    box(group, 0, 3.25, 6, 5, 1.35, 0.35, facade);

    // Porta, moldura, puxador e alpendre.
    box(group, -1.08, 0, 6.08, 0.14, 2.85, 0.22, M.wood);
    box(group, 1.08, 0, 6.08, 0.14, 2.85, 0.22, M.wood);
    box(group, 0, 2.85, 6.08, 2.3, 0.14, 0.22, M.wood);
    box(group, 0, 0, 5.91, 1.9, 2.75, 0.1, M.wood2);
    box(group, 0.72, 1.25, 5.82, 0.07, 0.07, 0.07, M.metal);
    box(group, 0, 0, 7.15, 4.6, 0.22, 2.4, M.tile);
    box(group, 0, 2.9, 7.1, 5.2, 0.18, 2.8, M.roof);

    // Telhado e janelas.
    const roof = box(group, 0, 4.65, 0, 14, 0.45, 14, M.roof);
    box(group, 0, 4.48, 0, 14.2, 0.12, 14.2, M.wood);

    makeFrontWindow(group, -3.8, 1.45, 6.2, 1.7, 1.35);
    makeFrontWindow(group, 3.8, 1.45, 6.2, 1.7, 1.35);

    // Vasos junto à entrada.
    for (const x of [-5.7, 5.7]) {
      cylinder(group, x, 0, 6.2, 0.22, 0.55, M.wood2);
      cylinder(group, x, 0.55, 6.2, 0.055, 0.85, M.green);
      sphere(group, x - 0.2, 1.25, 6.2, 0.38, M.leaf);
      sphere(group, x + 0.2, 1.35, 6.2, 0.38, M.leaf);
    }

    group.position.set(location.x, 0, location.z);
    scene.add(group);

    const colliders = [];

    const add = (x, z, width, depth) => colliders.push({
      minX: location.x + x - width / 2,
      maxX: location.x + x + width / 2,
      minZ: location.z + z - depth / 2,
      maxZ: location.z + z + depth / 2
    });

    add(-6.3, 0, 0.65, 12);
    add(6.3, 0, 0.65, 12);
    add(0, -5.8, 13, 0.65);
    add(-4.5, 6, 4, 0.65);
    add(4.5, 6, 4, 0.65);

    return { exterior: group, roof, colliders };
  }

  function addLivingRoom(group, variant) {
    const sofaMaterial = variant === 2 ? M.red : M.sofa;

    // Sofá com braços, encosto e almofadas.
    box(group, -4.8, 0.28, -2.8, 3.5, 0.58, 1.15, sofaMaterial);
    box(group, -4.8, 0.83, -3.27, 3.5, 0.72, 0.22, sofaMaterial);

    for (const side of [-1, 1]) {
      box(group, -4.8 + side * 1.68, 0.55, -2.8, 0.22, 0.62, 1.15, sofaMaterial);
    }

    for (const x of [-5.7, -4.8, -3.9]) {
      box(group, x, 0.88, -2.9, 0.62, 0.12, 0.48, M.fabric);
    }

    // Tapete, mesa e móvel de televisão.
    box(group, -4.8, 0.015, -1.0, 5.7, 0.035, 4.2, M.fabric, false);
    box(group, -4.8, 0.48, -0.2, 2.0, 0.12, 1.0, M.wood2);

    for (const x of [-5.55, -4.05]) {
      for (const z of [-0.55, 0.15]) {
        box(group, x, 0, z, 0.1, 0.48, 0.1, M.wood);
      }
    }

    box(group, -4.8, 0.15, -7.65, 3.5, 0.7, 0.65, M.wood);
    box(group, -4.8, 1.0, -8.0, 2.65, 1.45, 0.12, M.dark);

    // Planta decorativa.
    cylinder(group, -7.7, 0, -0.5, 0.3, 0.5, M.red);
    cylinder(group, -7.7, 0.5, -0.5, 0.06, 1.0, M.green);
    sphere(group, -7.95, 1.2, -0.5, 0.4, M.leaf);
    sphere(group, -7.45, 1.3, -0.5, 0.4, M.leaf);
  }

  function addBedroom(group, variant) {
    // Cama de casal, cabeceira, almofadas e mesas de cabeceira.
    box(group, 5.9, 0.22, -4.7, 3.2, 0.38, 4.0, M.wood);
    box(group, 5.9, 0.62, -4.7, 3.05, 0.28, 3.85, M.white);
    box(group, 5.9, 0.91, -6.05, 3.0, 0.34, 1.0, variant === 1 ? M.fabric : M.white);
    box(group, 5.9, 0.62, -2.85, 3.25, 1.2, 0.18, M.wood);

    for (const x of [4.0, 7.8]) {
      box(group, x, 0, -6.05, 0.9, 0.72, 0.85, M.wood2);
      cylinder(group, x, 0.72, -6.05, 0.12, 0.38, M.white);
    }

    // Armário encostado à parede lateral.
    box(group, 8.15, 0, -1.2, 1.0, 2.5, 1.25, M.wood2);
    box(group, 7.88, 1.0, -1.2, 0.06, 0.12, 0.08, M.metal);
    box(group, 8.42, 1.0, -1.2, 0.06, 0.12, 0.08, M.metal);
  }

  function addKitchen(group, variant) {
    const cabinet = variant === 2 ? M.wood2 : M.white;

    box(group, -5.4, 0.12, 5.7, 5.8, 0.92, 1.15, cabinet);
    box(group, -5.4, 1.06, 5.8, 5.95, 0.12, 1.25, M.dark);

    for (const x of [-7.65, -6.55, -5.45, -4.35, -3.25]) {
      box(group, x, 0.2, 5.1, 0.94, 0.72, 0.08, M.wood2);
      box(group, x, 0.52, 5.02, 0.07, 0.12, 0.06, M.metal);
    }

    // Lava-loiça e torneira.
    box(group, -7.2, 1.19, 5.55, 1.15, 0.035, 0.62, M.metal);
    cylinder(group, -7.2, 1.22, 5.45, 0.035, 0.34, M.metal);

    // Placa e queimadores.
    box(group, -3.65, 1.2, 5.65, 1.0, 0.06, 0.75, M.dark);

    for (const x of [-3.95, -3.35]) {
      for (const z of [5.42, 5.82]) {
        const burner = new THREE.Mesh(
          new THREE.CylinderGeometry(0.13, 0.13, 0.035, 12),
          M.metal
        );

        burner.position.set(x, 1.28, z);
        group.add(burner);
      }
    }

    // Armários superiores.
    for (const x of [-7.1, -5.4, -3.7]) {
      box(group, x, 2.05, 5.95, 1.45, 1.05, 0.48, cabinet);
      box(group, x, 2.08, 5.69, 0.06, 0.14, 0.06, M.metal);
    }

    // Frigorífico.
    box(group, -8.05, 0, 3.55, 0.95, 2.35, 0.95, M.white);
    box(group, -8.05, 1.2, 3.05, 0.06, 0.035, 0.05, M.metal);
  }

  function addDining(group, variant) {
    box(group, 3.7, 0.88, 5.0, 2.8, 0.16, 1.65, M.wood2);

    for (const x of [2.55, 4.85]) {
      for (const z of [4.35, 5.65]) {
        box(group, x, 0, z, 0.42, 0.84, 0.42, M.wood);
      }
    }

    for (const x of [2.3, 5.1]) {
      box(group, x, 0.42, 5.0, 0.12, 0.82, 0.72, variant === 1 ? M.sofa : M.wood);
    }

    cylinder(group, 3.7, 1.05, 5.0, 0.16, 0.12, M.green);
  }

  function addBathroom(group) {
    // Casa de banho no canto traseiro direito, com passagem livre.
    box(group, 7.35, 0, -6.8, 2.4, 0.12, 3.7, M.tile);
    box(group, 7.35, 0.12, -8.45, 2.4, 2.35, 0.12, M.wall2);
    box(group, 6.45, 0.12, -6.8, 0.12, 2.35, 3.4, M.wall2);

    // Base e vidro do duche.
    box(group, 7.75, 0.15, -7.7, 1.35, 0.12, 1.15, M.white);
    box(group, 7.75, 1.45, -7.7, 1.25, 2.5, 0.06, M.glass);
    cylinder(group, 7.75, 2.7, -8.0, 0.12, 0.08, M.metal);

    // Sanita e lavatório.
    box(group, 6.95, 0.15, -5.55, 0.72, 0.38, 0.9, M.white);
    sphere(group, 6.95, 0.55, -5.55, 0.3, M.white);
    box(group, 8.05, 0.75, -5.45, 0.95, 0.12, 0.55, M.white);
    box(group, 8.05, 0.12, -5.45, 0.16, 0.68, 0.16, M.white);
    box(group, 8.05, 0.95, -5.45, 0.05, 0.32, 0.05, M.metal);
  }

  function createInterior(index) {
    const group = new THREE.Group();
    const variant = index % 3;

    // Piso e zonas de cerâmica.
    box(group, 0, -0.16, 0, 18, 0.32, 18, M.floor);
    box(group, -5.4, 0.012, 5.55, 7.0, 0.035, 4.5, M.tile, false);
    box(group, 7.35, 0.012, -6.8, 2.8, 0.035, 4.2, M.tile, false);

    // Paredes, mantendo a entrada central aberta.
    box(group, -9, 0, 0, 0.3, 4.4, 18, M.wall);
    box(group, 9, 0, 0, 0.3, 4.4, 18, M.wall);
    box(group, 0, 0, -9, 18, 4.4, 0.3, M.wall);
    box(group, -6.5, 0, 9, 5, 4.4, 0.3, M.wall);
    box(group, 6.5, 0, 9, 5, 4.4, 0.3, M.wall);
    box(group, 0, 3.85, 9, 8, 0.55, 0.3, M.wall);

    // Rodapés e janelas laterais.
    box(group, -8.78, 0.08, 0, 0.08, 0.16, 17.5, M.wood2);
    box(group, 8.78, 0.08, 0, 0.08, 0.16, 17.5, M.wood2);
    box(group, 0, 0.08, -8.78, 17.5, 0.16, 0.08, M.wood2);
    box(group, -8.78, 1.45, -3.1, 0.08, 1.5, 2.2, M.glass, false);
    box(group, 8.78, 1.45, 2.6, 0.08, 1.5, 2.2, M.glass, false);

    // Divisórias que definem o quarto sem fechar a circulação.
    box(group, 1.35, 0, -5.75, 0.18, 2.2, 6.5, M.wall2);
    box(group, 4.7, 0, -2.45, 3.5, 2.2, 0.18, M.wall2);

    addLivingRoom(group, variant);
    addBedroom(group, variant);
    addKitchen(group, variant);
    addDining(group, variant);
    addBathroom(group);

    // Quadros, candeeiros e iluminação quente.
    box(group, -1.0, 1.7, -8.78, 1.2, 0.9, 0.06, M.wood);
    box(group, -1.0, 1.78, -8.73, 1.0, 0.7, 0.025, M.red);

    const lights = [
      [-4.8, 2.7, -2.0],
      [5.8, 2.7, -3.5],
      [-5.2, 2.7, 5.0],
      [3.5, 2.7, 4.0]
    ];

    for (const [x, y, z] of lights) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe5b4 })
      );

      bulb.position.set(x, y, z);
      group.add(bulb);

      const light = new THREE.PointLight(0xffdfae, 0.65, 10);
      light.position.set(x, y - 0.25, z);
      group.add(light);
    }

    // O teto é ocultado pelo main.js quando o jogador entra.
    const roof = box(group, 0, 4.35, 0, 18, 0.18, 18, M.wall, false);

    // Cada interior fica numa zona isolada, tal como no sistema original.
    const interiorX = 500 + index * 35;
    const interiorZ = 1;

    group.position.set(interiorX, 0, 0);
    group.visible = false;
    scene.add(group);

    const colliders = [];

    const add = (x, z, width, depth) => colliders.push({
      minX: interiorX + x - width / 2,
      maxX: interiorX + x + width / 2,
      minZ: interiorZ + z - depth / 2,
      maxZ: interiorZ + z + depth / 2
    });

    // Paredes exteriores; a porta frontal permanece desimpedida.
    add(-9, 0, 0.45, 18);
    add(9, 0, 0.45, 18);
    add(0, -9, 18, 0.45);
    add(-6.5, 9, 5, 0.45);
    add(6.5, 9, 5, 0.45);

    // Móveis principais. Mantém corredores centrais livres para caminhar.
    add(-4.8, -7.65, 3.6, 0.75);
    add(-4.8, -2.8, 3.8, 1.25);
    add(-4.8, -0.2, 2.1, 1.1);
    add(5.9, -4.7, 3.35, 4.1);
    add(-5.4, 5.7, 5.9, 1.2);
    add(-8.05, 3.55, 1.05, 1.05);
    add(3.7, 5.0, 2.9, 1.75);

    // Colisões pequenas para as paredes da casa de banho, sem bloquear o acesso.
    add(7.35, -8.35, 2.5, 0.25);
    add(6.45, -6.8, 0.25, 3.3);

    return { group, roof, interiorX, interiorZ, colliders };
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
