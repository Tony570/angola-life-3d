
import * as THREE from 'three';

export function createHouseSystem(scene) {
  const houses = [];

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0xc8b99e }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf0e5d2 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x75452e }),
    sofa: new THREE.MeshStandardMaterial({ color: 0x365d75 }),
    fabric: new THREE.MeshStandardMaterial({ color: 0xe6d8c2 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x252525 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x6cabbc }),
    white: new THREE.MeshStandardMaterial({ color: 0xf5f2e9 }),
    green: new THREE.MeshStandardMaterial({ color: 0x477747 })
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

  function furniture(group) {
    // Sofá da sala
    box(group, -4, 0.25, -3, 4, 0.65, 1.3, materials.sofa);
    box(group, -4, 0.9, -3.5, 4, 1, 0.35, materials.sofa);

    // Almofadas
    box(group, -5, 0.9, -3, 0.8, 0.15, 0.8, materials.fabric);
    box(group, -3, 0.9, -3, 0.8, 0.15, 0.8, materials.fabric);

    // Mesa da sala
    box(group, -4, 0.65, -0.5, 2.5, 0.15, 1.3, materials.wood);
    box(group, -5, 0, -0.5, 0.15, 0.65, 0.15, materials.wood);
    box(group, -3, 0, -0.5, 0.15, 0.65, 0.15, materials.wood);

    // Televisão
    box(group, -4, 1.2, -6.4, 2.4, 1.4, 0.15, materials.dark);
    box(group, -4, 0.6, -6.2, 2.8, 0.5, 0.5, materials.wood);

    // Cama
    box(group, 4, 0.35, -4, 3.2, 0.45, 4, materials.wood);
    box(group, 4, 0.8, -4, 3, 0.25, 3.8, materials.white);
    box(group, 4, 1.05, -5.3, 3, 0.4, 0.8, materials.fabric);

    // Mesa de cabeceira
    box(group, 6, 0.3, -5, 0.8, 0.8, 0.8, materials.wood);

    // Cozinha
    box(group, -4, 0.5, 5, 5, 1, 1.5, materials.white);
    box(group, -4, 1.55, 5, 5.2, 0.15, 1.7, materials.dark);

    // Armários
    box(group, -4, 2, 5.3, 4.8, 1, 0.45, materials.wood);

    // Frigorífico
    box(group, -7, 0, 3, 1.1, 2.5, 1.1, materials.white);
    box(group, -7, 1.3, 3.58, 0.08, 0.7, 0.08, materials.dark);

    // Mesa de jantar
    box(group, 3, 0.9, 4, 2.5, 0.15, 1.5, materials.wood);

    for (const x of [2, 4]) {
      for (const z of [3.3, 4.7]) {
        box(group, x, 0, z, 0.45, 0.85, 0.45, materials.wood);
      }
    }

    // Casa de banho
    box(group, 7, 0.1, 5.8, 1.2, 0.7, 1.2, materials.white);
    box(group, 7, 0.8, 5.8, 1.2, 0.15, 1.2, materials.glass);
  }

  function createInterior(index) {
    const group = new THREE.Group();

    // Piso
    box(group, 0, -0.15, 0, 18, 0.3, 18, materials.floor);

    // Paredes laterais
    box(group, -9, 0, 0, 0.3, 4.5, 18, materials.wall);
    box(group, 9, 0, 0, 0.3, 4.5, 18, materials.wall);

    // Parede de trás
    box(group, 0, 0, -9, 18, 4.5, 0.3, materials.wall);

    // Parede da frente com abertura para a porta
    box(group, -6, 0, 9, 6, 4.5, 0.3, materials.wall);
    box(group, 6, 0, 9, 6, 4.5, 0.3, materials.wall);
    box(group, 0, 3.5, 9, 6, 1, 0.3, materials.wall);

    // Telhado
    box(group, 0, 4.5, 0, 18, 0.25, 18, materials.wall);

    furniture(group);

    // Cada interior fica numa zona separada da cidade
    const interiorX = 500 + index * 30;

    group.position.set(interiorX, 0, 0);
    group.visible = false;
    scene.add(group);

    return { group, interiorX, interiorZ: 0 };
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
