
import * as THREE from 'three';

export function createHouseSystem(scene) {
  const houses = [];

  const mat = {
    floor: new THREE.MeshStandardMaterial({ color: 0xc8b99e, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf0e5d2, roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x75452e }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x365d75 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xe6d8c2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x252525 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x76c9e8, transparent: true, opacity: 0.55
    }),
    white: new THREE.MeshStandardMaterial({ color: 0xf5f2e9 }),
    green: new THREE.MeshStandardMaterial({ color: 0x477747 }),
    tile: new THREE.MeshStandardMaterial({ color: 0xb8c6c9 })
  };

  function block(parent, x, y, z, w, h, d, material) {
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

  function createWindow(parent, x, y, z, width, height) {
    block(parent, x, y, z, width, height, 0.12, mat.glass);

    block(parent, x, y, z - 0.08, width + 0.15, 0.09, 0.12, mat.wood);
    block(parent, x, y + height - 0.09, z - 0.08,
      width + 0.15, 0.09, 0.12, mat.wood);
    block(parent, x - width / 2, y, z - 0.08,
      0.09, height, 0.12, mat.wood);
    block(parent, x + width / 2, y, z - 0.08,
      0.09, height, 0.12, mat.wood);
  }

  function createFurniture(group) {
    // Sala
    block(group, -4.5, 0.25, -3, 4, 0.7, 1.35, mat.sofa);
    block(group, -4.5, 0.9, -3.55, 4, 1, 0.3, mat.sofa);
    block(group, -5.5, 0.95, -3, 0.8, 0.16, 0.85, mat.fabric);
    block(group, -3.5, 0.95, -3, 0.8, 0.16, 0.85, mat.fabric);

    block(group, -4.5, 0.65, -0.4, 2.4, 0.15, 1.2, mat.wood);
    for (const x of [-5.4, -3.6]) {
      for (const z of [-0.8, 0]) {
        block(group, x, 0, z, 0.12, 0.65, 0.12, mat.wood);
      }
    }

    // Móvel e televisão
    block(group, -4.5, 0.5, -7.2, 3.2, 0.8, 0.6, mat.wood);
    block(group, -4.5, 1.3, -7.45, 2.5, 1.4, 0.12, mat.dark);

    // Quarto
    block(group, 4.2, 0.25, -4, 3.5, 0.4, 4, mat.wood);
    block(group, 4.2, 0.7, -4, 3.35, 0.25, 3.85, mat.white);
    block(group, 4.2, 0.98, -5.4, 3.2, 0.4, 0.75, mat.fabric);
    block(group, 6.5, 0.3, -5.2, 0.8, 0.7, 0.8, mat.wood);

    // Roupeiro
    block(group, 7.3, 0, -0.2, 1.1, 2.8, 1.1, mat.wood);
    block(group, 7.3, 1.2, 0.38, 0.06, 0.12, 0.06, mat.dark);

    // Cozinha
    block(group, -4.5, 0.5, 5.3, 5.5, 1, 1.5, mat.white);
    block(group, -4.5, 1.55, 5.3, 5.6, 0.15, 1.6, mat.dark);
    block(group, -4.5, 2, 5.85, 5.2, 0.9, 0.4, mat.wood);

    // Frigorífico
    block(group, -7.6, 0, 3.2, 1.1, 2.5, 1.1, mat.white);
    block(group, -7.6, 1.25, 3.78, 0.08, 0.7, 0.08, mat.dark);

    // Mesa de jantar e cadeiras
    block(group, 3.2, 0.9, 4.5, 2.8, 0.15, 1.6, mat.wood);

    for (const x of [2, 4.4]) {
      for (const z of [3.5, 5.5]) {
        block(group, x, 0, z, 0.48, 0.85, 0.48, mat.wood);
      }
    }

    // Casa de banho
    block(group, 7.1, 0, 5.7, 1.4, 0.15, 2.5, mat.tile);
    block(group, 7, 0.15, 5.7, 1.2, 0.7, 1.2, mat.white);
    block(group, 7, 0.85, 5.7, 1.2, 0.12, 1.2, mat.glass);
  }

  function createInterior(index) {
    const interior = new THREE.Group();

    // Chão
    block(interior, 0, -0.15, 0, 18, 0.3, 18, mat.floor);

    // Paredes laterais
    block(interior, -9, 0, 0, 0.3, 4.5, 18, mat.wall);
    block(interior, 9, 0, 0, 0.3, 4.5, 18, mat.wall);

    // Parede traseira
    block(interior, 0, 0, -9, 18, 4.5, 0.3, mat.wall);

    // Parede frontal: abertura central para a entrada
    block(interior, -6.5, 0, 9, 5, 4.5, 0.3, mat.wall);
    block(interior, 6.5, 0, 9, 5, 4.5, 0.3, mat.wall);
    block(interior, 0, 3.8, 9, 8, 0.7, 0.3, mat.wall);

    // Janelas laterais
    createWindow(interior, -8.78, 1.4, -3, 0.12, 1.5);
    createWindow(interior, 8.78, 1.4, 3, 0.12, 1.5);

    // Porta de entrada
    block(interior, 0, 0, 8.82, 1.8, 2.8, 0.12, mat.wood);
    block(interior, 0.65, 1.2, 8.72, 0.08, 0.08, 0.08, mat.dark);

    // Teto elevado para permitir ver o interior
    block(interior, 0, 4.5, 0, 18, 0.2, 18, mat.wall);

    createFurniture(interior);

    // Iluminação própria da casa
    const light = new THREE.PointLight(0xffe3b0, 2.2, 35);
    light.position.set(0, 3.7, 0);
    interior.add(light);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe8b8 })
    );
    lamp.position.set(0, 4.15, 0);
    interior.add(lamp);

    // Zona separada da cidade
    const interiorX = 500 + index * 35;
    interior.position.set(interiorX, 0, 0);
    interior.visible = false;
    scene.add(interior);

    return {
      group: interior,
      interiorX,
      interiorZ: 4
    };
  }

  const locations = [
    { name: 'Casa Familiar', x: 55, z: 35 },
    { name: 'Casa Moderna', x: 55, z: 57 },
    { name: 'Casa do Bairro', x: 78, z: 35 },
    { name: 'Casa Grande', x: 78, z: 57 }
  ];

  locations.forEach((location, index) => {
    const interior = createInterior(index);

    houses.push({
      ...location,
      interior: interior.group,
      interiorX: interior.interiorX,
      interiorZ: interior.interiorZ
    });
  });

  return houses;
}
