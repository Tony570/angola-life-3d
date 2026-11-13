
import * as THREE from 'three';

// ============================================
// ANGOLA LIFE 3D — SISTEMA DE CASAS
// Interiores exploráveis com entrada aberta
// ============================================

export function createHouseSystem(scene) {
  const houses = [];

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0xc8b99e, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf0e5d2, roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x75452e }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x365d75 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xe6d8c2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x252525 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x76c9e8, transparent: true, opacity: 0.55 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf5f2e9 }),
    tile: new THREE.MeshStandardMaterial({ color: 0xb8c6c9 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x985e43 }),
    exterior: new THREE.MeshStandardMaterial({ color: 0xd9b58b })
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

  function makeWindow(parent, x, y, z, width, height) {
    box(parent, x, y, z, width, height, 0.12, materials.glass);
    box(parent, x, y, z - 0.08, width + 0.15, 0.09, 0.12, materials.wood);
    box(parent, x, y + height - 0.09, z - 0.08, width + 0.15, 0.09, 0.12, materials.wood);
    box(parent, x - width / 2, y, z - 0.08, 0.09, height, 0.12, materials.wood);
    box(parent, x + width / 2, y, z - 0.08, 0.09, height, 0.12, materials.wood);
  }

  function createFurniture(group) {
    // Sala
    box(group, -4.5, 0.25, -3, 4, 0.7, 1.35, materials.sofa);
    box(group, -4.5, 0.9, -3.55, 4, 1, 0.3, materials.sofa);
    box(group, -4.5, 0.65, -0.4, 2.4, 0.15, 1.2, materials.wood);

    // Mesa da sala
    for (const x of [-5.4, -3.6]) {
      for (const z of [-0.8, 0]) {
        box(group, x, 0, z, 0.12, 0.65, 0.12, materials.wood);
      }
    }

    // Televisão
    box(group, -4.5, 0.5, -7.2, 3.2, 0.8, 0.6, materials.wood);
    box(group, -4.5, 1.3, -7.45, 2.5, 1.4, 0.12, materials.dark);

    // Quarto
    box(group, 4.2, 0.25, -4, 3.5, 0.4, 4, materials.wood);
    box(group, 4.2, 0.7, -4, 3.35, 0.25, 3.85, materials.white);
    box(group, 4.2, 0.98, -5.4, 3.2, 0.4, 0.75, materials.fabric);
    box(group, 7.3, 0, -0.2, 1.1, 2.8, 1.1, materials.wood);

    // Cozinha
    box(group, -4.5, 0.5, 5.3, 5.5, 1, 1.5, materials.white);
    box(group, -4.5, 1.55, 5.3, 5.6, 0.15, 1.6, materials.dark);
    box(group, -7.6, 0, 3.2, 1.1, 2.5, 1.1, materials.white);

    // Mesa de jantar
    box(group, 3.2, 0.9, 4.5, 2.8, 0.15, 1.6, materials.wood);

    for (const x of [2, 4.4]) {
      for (const z of [3.5, 5.5]) {
        box(group, x, 0, z, 0.48, 0.85, 0.48, materials.wood);
      }
    }

    // Casa de banho
    box(group, 7.1, 0, 5.7, 1.4, 0.15, 2.5, materials.tile);
    box(group, 7, 0.15, 5.7, 1.2, 0.7, 1.2, materials.white);
  }

  function createExterior(location, index) {
    const exterior = new THREE.Group();

    // Casa térrea com fachada e entrada central aberta
    box(exterior, 0, 0, -5.8, 13, 5, 0.35, materials.exterior);
    box(exterior, -6.3, 0, 0, 0.35, 5, 12, materials.exterior);
    box(exterior, 6.3, 0, 0, 0.35, 5, 12, materials.exterior);

    // Fachada frontal dividida para deixar passagem
    box(exterior, -4.5, 0, 6, 4, 3.2, 0.35, materials.exterior);
    box(exterior, 4.5, 0, 6, 4, 3.2, 0.35, materials.exterior);
    box(exterior, 0, 3.2, 6, 5, 1.8, 0.35, materials.exterior);

    // Moldura da entrada
    box(exterior, -1.05, 0, 6.05, 0.15, 2.8, 0.25, materials.wood);
    box(exterior, 1.05, 0, 6.05, 0.15, 2.8, 0.25, materials.wood);
    box(exterior, 0, 2.8, 6.05, 2.2, 0.15, 0.25, materials.wood);

    // Telhado exterior
    const roof = box(exterior, 0, 5, 0, 14, 0.4, 14, materials.roof);

    // Janelas da frente
    makeWindow(exterior, -3.8, 1.3, 6.2, 1.5, 1.3);
    makeWindow(exterior, 3.8, 1.3, 6.2, 1.5, 1.3);

    exterior.position.set(location.x, 0, location.z);
    scene.add(exterior);

    return { exterior, roof };
  }

  function createInterior(index) {
    const interior = new THREE.Group();

    // Piso
    box(interior, 0, -0.15, 0, 18, 0.3, 18, materials.floor);

    // Paredes laterais e traseira
    box(interior, -9, 0, 0, 0.3, 4.5, 18, materials.wall);
    box(interior, 9, 0, 0, 0.3, 4.5, 18, materials.wall);
    box(interior, 0, 0, -9, 18, 4.5, 0.3, materials.wall);

    // Parede frontal com abertura central larga
    box(interior, -6.5, 0, 9, 5, 4.5, 0.3, materials.wall);
    box(interior, 6.5, 0, 9, 5, 4.5, 0.3, materials.wall);
    box(interior, 0, 3.8, 9, 8, 0.7, 0.3, materials.wall);

    // Janelas
    makeWindow(interior, -8.78, 1.4, -3, 0.12, 1.5);
    makeWindow(interior, 8.78, 1.4, 3, 0.12, 1.5);

    // Teto guardado numa referência própria
    const roof = box(interior, 0, 4.5, 0, 18, 0.2, 18, materials.wall);

    createFurniture(interior);

    // Luz interior
    const light = new THREE.PointLight(0xffe3b0, 2.2, 35);
    light.position.set(0, 3.7, 0);
    interior.add(light);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe8b8 })
    );

    lamp.position.set(0, 4.15, 0);
    interior.add(lamp);

    // Cada interior fica numa zona separada do mapa
    const interiorX = 500 + index * 35;
    interior.position.set(interiorX, 0, 0);
    interior.visible = false;
    scene.add(interior);

    return {
      group: interior,
      roof,
      interiorX,
      interiorZ: 1
    };
  }

  const locations = [
    { name: 'Casa Familiar', x: 55, z: 35 },
    { name: 'Casa Moderna', x: 55, z: 57 },
    { name: 'Casa do Bairro', x: 78, z: 35 },
    { name: 'Casa Grande', x: 78, z: 57 }
  ];

  locations.forEach((location, index) => {
    const outside = createExterior(location, index);
    const inside = createInterior(index);

    houses.push({
      ...location,
      exterior: outside.exterior,
      exteriorRoof: outside.roof,
      interior: inside.group,
      interiorRoof: inside.roof,
      interiorX: inside.interiorX,
      interiorZ: inside.interiorZ
    });
  });

  return houses;
}
