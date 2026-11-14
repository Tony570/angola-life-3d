import * as THREE from 'three';

// Acrescenta pequenos elementos de arquitetura residencial sem substituir
// nem reconstruir os modelos existentes da cidade.
export function addLuandaArchitectureDetails(scene, world) {
  const materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xb9b5aa, roughness: 0.92 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x343b3e, roughness: 0.72 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x626b70, metalness: 0.62, roughness: 0.48 }),
    tank: new THREE.MeshStandardMaterial({ color: 0xd9dedb, roughness: 0.68 }),
    shade: new THREE.MeshStandardMaterial({ color: 0x9b6338, roughness: 0.84 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8ebbc4, roughness: 0.3, metalness: 0.12 })
  };

  const addBox = (parent, x, y, z, width, height, depth, material) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (parent, x, y, z, radius, height, material, segments = 12) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, segments),
      material
    );
    mesh.position.set(x, y + height / 2, z);
    parent.add(mesh);
    return mesh;
  };

  const homes = (world.buildings || []).filter(building =>
    building &&
    building.group &&
    (building.type === 'house' || building.type === 'apartment') &&
    Number.isFinite(building.width) &&
    Number.isFinite(building.depth)
  );

  homes.forEach((building, index) => {
    const group = building.group;
    const width = building.width;
    const depth = building.depth;
    const floors = Math.max(1, building.floors || 1);
    const front = depth / 2;
    const roofY = floors * 3.15 + 0.7;

    // Degraus de acesso e pequeno alpendre sobre a entrada.
    addBox(group, 0, 0.02, front + 0.85, 2.5, 0.16, 1.05, materials.concrete);
    addBox(group, 0, 0.18, front + 1.45, 2.5, 0.16, 0.48, materials.concrete);
    addBox(group, 0, 2.62, front + 0.28, 2.15, 0.12, 0.72, materials.shade);
    addBox(group, -0.94, 2.28, front + 0.28, 0.1, 0.7, 0.12, materials.metal);
    addBox(group, 0.94, 2.28, front + 0.28, 0.1, 0.7, 0.12, materials.metal);

    // Caixa de contador e cablagem exterior, comum nas fachadas residenciais.
    addBox(group, width / 2 - 0.72, 0.62, front + 0.12, 0.48, 0.72, 0.18, materials.dark);
    addBox(group, width / 2 - 0.72, 0.76, front + 0.22, 0.28, 0.24, 0.035, materials.glass);

    // Unidades de ar condicionado nas paredes laterais dos apartamentos.
    if (floors >= 2) {
      const levels = floors >= 4 ? [2.0, 5.15, 8.3] : [2.0];
      levels.forEach((level, unitIndex) => {
        if (level > floors * 3.0) return;
        const side = unitIndex % 2 === 0 ? 1 : -1;
        addBox(
          group,
          side * (width / 2 + 0.22),
          level,
          -depth / 2 + 1.6 + unitIndex * 1.1,
          0.42,
          0.34,
          0.72,
          materials.concrete
        );
        addBox(
          group,
          side * (width / 2 + 0.45),
          level + 0.08,
          -depth / 2 + 1.6 + unitIndex * 1.1,
          0.055,
          0.17,
          0.42,
          materials.dark
        );
      });
    }

    // Reservatório de água elevado em parte dos edifícios e casas de vários pisos.
    if (floors >= 2 || index % 3 === 0) {
      const tankX = width * (index % 2 === 0 ? 0.28 : -0.28);
      const tankZ = -depth * 0.22;
      addBox(group, tankX, roofY - 0.18, tankZ, 1.55, 0.18, 1.55, materials.metal);
      addCylinder(group, tankX, roofY, tankZ, 0.68, 1.45, materials.tank, 14);
      addCylinder(group, tankX, roofY + 1.43, tankZ, 0.69, 0.12, materials.dark, 14);
      addBox(group, tankX + 0.78, roofY + 0.1, tankZ, 0.1, 0.45, 0.1, materials.metal);
    }

    // Antena simples no telhado, distribuída de forma alternada.
    if (index % 2 === 0) {
      addCylinder(group, -width * 0.34, roofY, -depth * 0.3, 0.035, 1.35, materials.metal, 7);
      addBox(group, -width * 0.34, roofY + 1.12, -depth * 0.3, 0.85, 0.045, 0.045, materials.metal);
      addBox(group, -width * 0.34, roofY + 0.88, -depth * 0.3, 0.55, 0.045, 0.045, materials.metal);
    }
  });

  world.architectureDetails = homes.length;
  return world;
}
