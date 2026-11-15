import * as THREE from 'three';

// Detalhes arquitetónicos adicionais para os edifícios já existentes.
// Não substitui fachadas, portas, janelas, interiores nem sistemas de compra.
export function addLuandaArchitectureDetails(_scene, world) {
  if (!world || !Array.isArray(world.buildings)) return world;
  if (world.architectureDetailsApplied) return world;

  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: 0xbab6ad, roughness: 0.94 }),
    white: new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.88 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x30383b, roughness: 0.72 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x586267, metalness: 0.58, roughness: 0.48 }),
    tank: new THREE.MeshStandardMaterial({ color: 0xd8dedb, roughness: 0.68 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8ebbc4, roughness: 0.32, metalness: 0.1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x80583d, roughness: 0.86 }),
    terracotta: new THREE.MeshStandardMaterial({ color: 0xa94f3e, roughness: 0.9 }),
    green: new THREE.MeshStandardMaterial({ color: 0x39754a, roughness: 0.95 }),
    greenLight: new THREE.MeshStandardMaterial({ color: 0x639653, roughness: 0.95 }),
    planter: new THREE.MeshStandardMaterial({ color: 0x9a6749, roughness: 0.9 }),
    awningRed: new THREE.MeshStandardMaterial({ color: 0xa83f35, roughness: 0.86 }),
    awningBlue: new THREE.MeshStandardMaterial({ color: 0x315c76, roughness: 0.86 }),
    awningCream: new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.9 }),
    solar: new THREE.MeshStandardMaterial({ color: 0x24465d, roughness: 0.42, metalness: 0.28 })
  };

  const boxGeometries = new Map();
  const cylinderGeometries = new Map();

  function addBox(parent, x, y, z, width, height, depth, material) {
    const key = [width, height, depth].join(':');
    let geometry = boxGeometries.get(key);
    if (!geometry) {
      geometry = new THREE.BoxGeometry(width, height, depth);
      boxGeometries.set(key, geometry);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, x, y, z, radiusTop, radiusBottom, height, material, segments = 12) {
    const key = [radiusTop, radiusBottom, height, segments].join(':');
    let geometry = cylinderGeometries.get(key);
    if (!geometry) {
      geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
      cylinderGeometries.set(key, geometry);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  }

  function addLabel(parent, label, x, y, z, width, height, background, foreground) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#f0d9a3';
    context.lineWidth = 7;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    context.fillStyle = foreground;
    context.font = 'bold 58px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(label).toUpperCase(), 256, 65, 470);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
    );
    sign.position.set(x, y, z);
    sign.renderOrder = 2;
    parent.add(sign);
    return sign;
  }

  function addPlant(parent, x, y, z, scale = 1) {
    addBox(parent, x, y, z, 0.9 * scale, 0.3 * scale, 0.42 * scale, M.planter);
    for (let leaf = 0; leaf < 3; leaf++) {
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.17 * scale, 0.62 * scale, 5),
        leaf % 2 ? M.green : M.greenLight
      );
      mesh.position.set(
        x + (leaf - 1) * 0.22 * scale,
        y + 0.55 * scale,
        z + (leaf % 2 ? 0.04 : -0.04) * scale
      );
      mesh.rotation.z = (leaf - 1) * 0.18;
      mesh.castShadow = false;
      parent.add(mesh);
    }
  }

  function addCompoundWall(building, group, width, depth) {
    const halfWidth = Math.min(width / 2 + 2.0, 10.5);
    const halfDepth = Math.min(depth / 2 + 2.1, 10.6);
    const wallHeight = 1.02;
    const wallThickness = 0.24;
    const gateHalfWidth = 3.15;
    const segmentWidth = halfWidth - gateHalfWidth;
    const segmentCenter = (halfWidth + gateHalfWidth) / 2;
    const colliders = [];

    addBox(group, -halfWidth, 0, 0, wallThickness, wallHeight, halfDepth * 2, M.concrete);
    addBox(group, halfWidth, 0, 0, wallThickness, wallHeight, halfDepth * 2, M.concrete);
    addBox(group, 0, 0, -halfDepth, halfWidth * 2, wallHeight, wallThickness, M.concrete);
    addBox(group, -segmentCenter, 0, halfDepth, segmentWidth, wallHeight, wallThickness, M.concrete);
    addBox(group, segmentCenter, 0, halfDepth, segmentWidth, wallHeight, wallThickness, M.concrete);

    // Capeamento dos muros e pilares do portão, mantendo a entrada central aberta.
    addBox(group, -halfWidth, wallHeight, 0, wallThickness + 0.12, 0.1, halfDepth * 2 + 0.12, M.white);
    addBox(group, halfWidth, wallHeight, 0, wallThickness + 0.12, 0.1, halfDepth * 2 + 0.12, M.white);
    addBox(group, 0, wallHeight, -halfDepth, halfWidth * 2 + 0.12, 0.1, wallThickness + 0.12, M.white);
    addBox(group, -segmentCenter, wallHeight, halfDepth, segmentWidth + 0.12, 0.1, wallThickness + 0.12, M.white);
    addBox(group, segmentCenter, wallHeight, halfDepth, segmentWidth + 0.12, 0.1, wallThickness + 0.12, M.white);

    for (const gateX of [-gateHalfWidth, gateHalfWidth]) {
      addBox(group, gateX, 0, halfDepth, 0.42, 1.38, 0.42, M.concrete);
      addBox(group, gateX, 1.38, halfDepth, 0.58, 0.14, 0.58, M.white);
      addBox(group, gateX, 0.38, halfDepth + 0.24, 0.12, 0.62, 0.08, M.metal);
    }

    // Pequena placa de identificação na parede frontal, sem tapar o portão.
    addLabel(group, building.name || 'BLOCO RESIDENCIAL', -6.65, 1.26, halfDepth + 0.14, 4.8, 0.42, '#26383b', '#f3d99f');

    const addCollider = (cx, cz, colliderWidth, colliderDepth) => {
      const collider = {
        minX: building.x + cx - colliderWidth / 2,
        maxX: building.x + cx + colliderWidth / 2,
        minZ: building.z + cz - colliderDepth / 2,
        maxZ: building.z + cz + colliderDepth / 2
      };
      colliders.push(collider);
      if (Array.isArray(world.colliders)) world.colliders.push(collider);
    };

    addCollider(-halfWidth, 0, wallThickness, halfDepth * 2);
    addCollider(halfWidth, 0, wallThickness, halfDepth * 2);
    addCollider(0, -halfDepth, halfWidth * 2, wallThickness);
    addCollider(-segmentCenter, halfDepth, segmentWidth, wallThickness);
    addCollider(segmentCenter, halfDepth, segmentWidth, wallThickness);

    building.architectureFenceColliders = colliders;
    addPlant(group, -halfWidth + 0.9, 0.08, -1.8, 0.9);
    addPlant(group, halfWidth - 0.9, 0.08, 1.8, 0.9);
  }

  function addRoofEquipment(group, building, index, roofY, width, depth) {
    const roofZ = -depth / 2 + 3.2;

    if (index % 2 === 0) {
      // Reservatório de água elevado, muito comum nos edifícios residenciais.
      addBox(group, 0, roofY, roofZ, 1.9, 0.16, 1.9, M.metal);
      for (const x of [-0.62, 0.62]) {
        for (const z of [roofZ - 0.62, roofZ + 0.62]) {
          addBox(group, x, roofY + 0.16, z, 0.08, 0.42, 0.08, M.metal);
        }
      }
      addCylinder(group, 0, roofY + 0.58, roofZ, 0.68, 0.68, 1.28, M.tank, 14);
      addCylinder(group, 0, roofY + 1.84, roofZ, 0.7, 0.7, 0.12, M.dark, 14);
      addBox(group, 0.78, roofY + 0.82, roofZ, 0.08, 0.48, 0.08, M.metal);
    } else if (index % 3 === 1) {
      // Painel solar inclinado para aquecimento/energia no telhado.
      const panel = addBox(group, -3.8, roofY + 0.2, roofZ, 2.35, 0.08, 1.55, M.solar);
      panel.rotation.x = -0.22;
      addBox(group, -3.8, roofY + 0.12, roofZ - 0.58, 2.45, 0.08, 0.08, M.metal);
      addBox(group, -3.8, roofY + 0.12, roofZ + 0.58, 2.45, 0.08, 0.08, M.metal);
    } else {
      // Antena de televisão e pequeno suporte de telecomunicações.
      addCylinder(group, 4.2, roofY, roofZ, 0.045, 0.045, 1.8, M.metal, 8);
      addBox(group, 4.2, roofY + 1.28, roofZ, 1.1, 0.055, 0.055, M.metal);
      addBox(group, 4.2, roofY + 1.02, roofZ, 0.72, 0.055, 0.055, M.metal);
      addCylinder(group, 4.2, roofY + 1.55, roofZ, 0.16, 0.16, 0.12, M.dark, 10);
    }
  }

  function addShopfront(group, index, front, shopName, side, accentMaterial) {
    const shopX = side * 5.15;
    const signY = 2.58;
    const signZ = front + 0.27;
    addBox(group, shopX, 2.53, front + 0.2, 2.8, 0.46, 0.14, M.dark);
    addLabel(group, shopName, shopX, signY + 0.2, signZ + 0.02, 2.62, 0.34, '#28383a', '#fff1ce');

    // Toldo curto com faixas alternadas, por cima da montra já existente.
    addBox(group, shopX, 2.18, front + 0.62, 2.95, 0.14, 0.88, accentMaterial);
    for (let stripe = 0; stripe < 5; stripe++) {
      addBox(
        group,
        shopX - 1.18 + stripe * 0.59,
        2.18,
        front + 1.08,
        0.55,
        0.15,
        0.08,
        stripe % 2 === 0 ? M.awningCream : accentMaterial
      );
    }
    for (const dx of [-0.88, 0.88]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd99a })
      );
      lamp.position.set(shopX + dx, 2.04, front + 0.72);
      group.add(lamp);
    }
  }

  const homes = world.buildings.filter(building =>
    building &&
    building.group &&
    (building.type === 'house' || building.type === 'apartment') &&
    Number.isFinite(building.width) &&
    Number.isFinite(building.depth) &&
    !building.group.userData.luandaArchitectureDetails
  );

  const shopfronts = [
    { index: 1, name: 'MINI MERCADO', side: -1, material: M.awningRed },
    { index: 4, name: 'BARBEARIA', side: 1, material: M.awningBlue },
    { index: 7, name: 'PAPELARIA', side: -1, material: M.awningRed }
  ];

  homes.forEach((building, index) => {
    const group = building.group;
    const width = building.width;
    const depth = building.depth;
    const floors = Math.max(1, Number(building.floors) || 5);
    const floorHeight = Number(building.floorHeight) || 3.05;
    const front = depth / 2;
    const buildingHeight = floors * floorHeight + 0.45;
    const roofY = buildingHeight + 0.42;

    // Caixa de electricidade, contador e tubo de alimentação na fachada.
    const meterX = width / 2 - 1.05;
    addBox(group, meterX, 0.42, front + 0.22, 0.48, 0.74, 0.16, M.dark);
    addBox(group, meterX, 0.82, front + 0.32, 0.27, 0.22, 0.035, M.glass);
    addBox(group, meterX - 0.34, 0.35, front + 0.2, 0.055, 1.05, 0.07, M.metal);

    // Intercomunicador e iluminação discreta junto à entrada existente.
    addBox(group, 2.72, 0.92, front + 0.31, 0.18, 0.48, 0.08, M.dark);
    addBox(group, 2.72, 1.24, front + 0.37, 0.1, 0.12, 0.035, M.glass);
    for (const x of [-2.62, 2.62]) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd49a })
      );
      lamp.position.set(x, 2.42, front + 0.42);
      group.add(lamp);
    }

    // Unidades exteriores de ar condicionado, alternadas para evitar repetição.
    if (floors > 1) {
      const side = index % 2 === 0 ? 1 : -1;
      const unitFloor = Math.min(2 + (index % 2), floors - 1);
      const unitY = unitFloor * floorHeight + 1.05;
      const unitZ = 2.6;
      addBox(group, side * (width / 2 + 0.12), unitY, unitZ, 0.42, 0.46, 0.86, M.white);
      addBox(group, side * (width / 2 + 0.35), unitY + 0.11, unitZ, 0.06, 0.22, 0.62, M.dark);
      for (let vent = 0; vent < 4; vent++) {
        addBox(
          group,
          side * (width / 2 + 0.39),
          unitY + 0.07,
          unitZ - 0.21 + vent * 0.14,
          0.025,
          0.035,
          0.055,
          M.metal
        );
      }
    }

    // Jardineiras em varandas alternadas: cada bloco ganha uma aparência própria.
    if (floors > 1) {
      for (let floor = 1; floor < floors; floor++) {
        if ((floor + index) % 2 !== 0) continue;
        const balconyX = index % 2 === 0 ? -5.55 : 5.55;
        addPlant(group, balconyX, floor * floorHeight + 0.36, front + 0.9, 0.82);
      }
    }

    // Roupa estendida em algumas varandas, sem alterar a circulação dos apartamentos.
    if (index % 3 === 1 && floors > 2) {
      const floor = 2;
      const balconyX = index % 2 === 0 ? 5.55 : -5.55;
      const clothes = [M.terracotta, M.awningBlue, M.awningCream];
      addBox(group, balconyX, floor * floorHeight + 0.48, front + 1.1, 1.8, 0.045, 0.045, M.metal);
      clothes.forEach((material, item) => {
        const cloth = addBox(
          group,
          balconyX - 0.52 + item * 0.52,
          floor * floorHeight + 0.5,
          front + 1.14,
          0.42,
          0.58,
          0.045,
          material
        );
        cloth.rotation.z = item === 1 ? 0.04 : -0.035;
      });
    }

    // Pequenos estores em alguns blocos para quebrar a repetição das janelas.
    if (index % 3 === 0 && floors > 2) {
      const windowX = index % 2 === 0 ? -5.55 : 5.55;
      for (let floor = 1; floor < floors; floor++) {
        const y = floor * floorHeight + 1.62;
        for (const side of [-1, 1]) {
          addBox(group, windowX + side * 0.82, y - 0.67, front + 0.3, 0.11, 1.3, 0.075, M.wood);
        }
      }
    }

    addRoofEquipment(group, building, index, roofY, width, depth);
    addCompoundWall(building, group, width, depth);

    const shop = shopfronts.find(item => item.index === index);
    if (shop) {
      addShopfront(group, index, front, shop.name, shop.side, shop.material);
      building.visualShopfront = shop.name;
    }

    group.userData.luandaArchitectureDetails = true;
    building.architectureStyle = index % 3 === 0 ? 'residencial-jardim'
      : index % 3 === 1 ? 'residencial-comercial'
      : 'residencial-urbano';
  });

  world.architectureDetailsApplied = true;
  world.architectureDetails = homes.length;
  world.architectureShopfronts = homes.filter(building => building.visualShopfront).length;
  world.architectureFenceCount = homes.length;
  return world;
}
