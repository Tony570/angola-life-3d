import * as THREE from 'three';

const DISTRICTS = [
  { name: 'Ingombota', x: 0, z: 0, style: 'apartments', subtitle: 'Centro histórico e zona comercial' },
  { name: 'Maianga', x: 145, z: 55, style: 'apartments', subtitle: 'Residências e serviços urbanos' },
  { name: 'Maculusso', x: -125, z: 35, style: 'modern', subtitle: 'Zona residencial central' },
  { name: 'Miramar', x: -255, z: -105, style: 'luxury', subtitle: 'Moradias e embaixadas' },
  { name: 'Alvalade', x: 245, z: -115, style: 'modern', subtitle: 'Bairro residencial e comércio' },
  { name: 'Prenda', x: 155, z: 195, style: 'popular', subtitle: 'Bairro tradicional e familiar' },
  { name: 'Samba', x: 20, z: 320, style: 'coastal', subtitle: 'Zona costeira de Luanda' },
  { name: 'Bairro Azul', x: -155, z: 190, style: 'apartments', subtitle: 'Residências e serviços' },
  { name: 'Cruzeiro', x: -285, z: 65, style: 'popular', subtitle: 'Zona urbana e residencial' },
  { name: 'Sambizanga', x: -105, z: -220, style: 'musseque', subtitle: 'Bairro tradicional de Luanda' }
];
const ILHA_DE_LUANDA = { name: 'Ilha de Luanda', x: -390, z: -20, style: 'coastal', subtitle: 'Marginal, restaurantes e lazer' };

export function expandLuandaCity(scene, world) {
  const material = (color, roughness = 0.88, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  const M = {
    ground: material(0x8b956d),
    road: material(0x30363a, 0.98),
    line: material(0xe9d27d),
    sidewalk: material(0xbdb9ad),
    concrete: material(0xb8b4a9),
    white: material(0xf0e9dc),
    dark: material(0x30383a),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x8fc5d2, roughness: 0.18, metalness: 0.08,
      transparent: true, opacity: 0.72
    }),
    roof: material(0x77736b),
    green: material(0x477b48),
    gold: material(0xd5a744),
    red: material(0xa83d32)
  };

  const box = (parent, x, y, z, w, h, d, mat) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
    return mesh;
  };

  const addGround = () => {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 850), M.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.68, 35);
    ground.receiveShadow = false;
    scene.add(ground);
  };

  const addRoad = (x1, z1, x2, z2, width = 12, withLines = true) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    const road = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), M.road);
    road.position.set((x1 + x2) / 2, -0.58, (z1 + z2) / 2);
    road.rotation.y = angle;
    scene.add(road);

    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.1, length),
        M.sidewalk
      );
      walk.position.set(
        (x1 + x2) / 2 + Math.cos(angle) * side * (width / 2 + 1.1),
        -0.52,
        (z1 + z2) / 2 - Math.sin(angle) * side * (width / 2 + 1.1)
      );
      walk.rotation.y = angle;
      scene.add(walk);
    }

    if (withLines && length > 45) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.035, length - 12),
        M.line
      );
      stripe.position.set((x1 + x2) / 2, -0.51, (z1 + z2) / 2);
      stripe.rotation.y = angle;
      scene.add(stripe);
    }
  };

  const addSign = (name, subtitle, x, z) => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 190;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#172c2b';
    ctx.fillRect(0, 0, 768, 190);
    ctx.fillStyle = '#d7a844';
    ctx.fillRect(0, 0, 15, 190);
    ctx.strokeStyle = '#f0d28a';
    ctx.lineWidth = 7;
    ctx.strokeRect(8, 8, 752, 174);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 55px Arial';
    ctx.fillText(name.toUpperCase(), 395, 75, 690);
    ctx.fillStyle = '#f0d28a';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(subtitle.toUpperCase(), 395, 137, 690);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(17, 4.2),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    sign.position.set(x, 5.4, z);
    scene.add(sign);
  };

  const makeHome = (x, z, style, index, districtName) => {
    const group = new THREE.Group();
    const palettes = [0xe7d2b3, 0xd8b28c, 0xf0e2cc, 0xc7b7a5, 0xd7a18e, 0xe4c7a4];
    const wall = material(palettes[(index * 3 + Math.abs(Math.floor(x + z))) % palettes.length]);
    let width = 12, depth = 10, floors = 1, price = 1800000, type = 'casa popular';

    if (style === 'musseque') {
      width = 8 + (index % 3) * 1.2;
      depth = 7.5;
      price = 850000 + index * 95000;
      type = 'casa de musseque';
    } else if (style === 'popular') {
      width = 11 + (index % 2) * 2;
      depth = 9.5;
      floors = index % 4 === 0 ? 2 : 1;
      price = 2200000 + index * 240000;
      type = 'casa de bairro';
    } else if (style === 'apartments') {
      width = 15;
      depth = 12;
      floors = 3 + (index % 3);
      price = 9500000 + index * 750000;
      type = 'apartamento';
    } else if (style === 'modern' || style === 'coastal') {
      width = 16;
      depth = 13;
      floors = 2;
      price = 18500000 + index * 1250000;
      type = 'moradia moderna';
    } else if (style === 'luxury') {
      width = 19;
      depth = 15;
      floors = 2 + (index % 2);
      price = 42000000 + index * 3500000;
      type = 'vivenda de luxo';
    }

    const height = floors * 3.15;
    box(group, 0, 0, 0, width + 1.2, 0.28, depth + 1.2, M.concrete);
    // Estrutura oca: paredes laterais, traseira e fachada com vãos.
    box(group, -width / 2 + 0.15, 0.28, 0, 0.3, height, depth, wall);
    box(group, width / 2 - 0.15, 0.28, 0, 0.3, height, depth, wall);
    box(group, 0, 0.28, -depth / 2 + 0.15, width, height, 0.3, wall);
    const facadeZ = depth / 2;
    box(group, -width * 0.36, 0.28, facadeZ, width * 0.28, height, 0.3, wall);
    box(group, width * 0.36, 0.28, facadeZ, width * 0.28, height, 0.3, wall);
    box(group, 0, 0.28, facadeZ, width * 0.16, 0.35, 0.3, wall);
    box(group, 0, 2.55, facadeZ, width * 0.16, 0.35, 0.3, wall);
    box(group, 0, height - 0.2, facadeZ, width, 0.4, 0.3, wall);
    box(group, 0, height + 0.28, 0, width + 0.5, 0.35, depth + 0.5,
      style === 'musseque' ? M.roof : M.white);

    const front = depth / 2 + 0.06;
    box(group, 0, 0.38, front, 1.35, 2.2, 0.13, M.dark);
    box(group, 0, 0.42, front + 0.08, 1.05, 2.0, 0.06, M.wood);
    box(group, 0.42, 1.25, front + 0.15, 0.07, 0.07, 0.08, M.gold);
    box(group, 0, 2.55, front + 0.1, 1.7, 0.14, 0.18, M.white);

    const windowCount = floors >= 3 ? 3 : 2;
    for (let floor = 0; floor < floors; floor++) {
      for (let n = 0; n < windowCount; n++) {
        const wx = (n - (windowCount - 1) / 2) * (width / (windowCount + 0.2));
        const wy = floor * 3.15 + 1.35;
        if (floor === 0 && Math.abs(wx) < 0.2) continue;
        box(group, wx, wy, front + 0.04, 1.65, 1.25, 0.12, M.dark);
        box(group, wx, wy + 0.08, front + 0.12, 1.35, 1.05, 0.05, M.glass);
        box(group, wx, wy - 0.69, front + 0.1, 1.75, 0.12, 0.18, M.white);
        box(group, wx, wy + 0.69, front + 0.1, 1.75, 0.12, 0.18, M.white);
      }
    }

    if (floors >= 3) {
      for (let floor = 1; floor < floors; floor++) {
        box(group, 0, floor * 3.15 + 0.15, front + 0.8, width * 0.78, 0.12, 1.3, M.concrete);
        box(group, 0, floor * 3.15 + 0.75, front + 1.42, width * 0.78, 0.75, 0.08, M.dark);
      }
    }

    if (style === 'musseque') {
      box(group, 0, height + 0.42, -depth / 2 - 0.1, width + 1.3, 0.18, depth + 1.1, M.roof);
    }
    if (style === 'luxury' || style === 'modern' || style === 'coastal') {
      box(group, 0, 0.25, depth / 2 + 3.1, width + 5, 1.0, 0.2, M.white);
      box(group, -width / 2 - 2.3, 0.25, 0, 0.2, 1.0, depth + 6, M.white);
      box(group, width / 2 + 2.3, 0.25, 0, 0.2, 1.0, depth + 6, M.white);
      const garden = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 3.5), M.green);
      garden.position.set(-width / 2 + 2.5, 0.12, -depth / 2 + 2.5);
      group.add(garden);
    }

    // Detalhes de fachada por tipologia, para evitar casas repetidas.
    if (style === 'musseque') {
      // Telhado de chapa e pequenas emendas típicas de construção progressiva.
      for (let rib = -3; rib <= 3; rib++) {
        box(group, rib * 1.05, height + 0.55, 0, 0.055, 0.12, depth + 1.2, M.dark);
      }
      box(group, -width / 2 - 0.55, 0.28, front + 1.4, 0.12, 1.15, 3.2, M.roof);
      box(group, width / 2 + 0.55, 0.28, front + 1.4, 0.12, 1.15, 3.2, M.roof);
    } else if (style === 'popular') {
      // Pequeno alpendre, pilares e muro frontal com portão.
      box(group, 0, 2.55, front + 1.05, width * 0.62, 0.16, 2.0, M.roof);
      for (const px of [-width * 0.29, width * 0.29]) {
        box(group, px, 0.25, front + 1.05, 0.18, 2.3, 0.18, M.white);
      }
      box(group, -width * 0.36, 0.2, front + 3.2, 0.18, 0.8, 2.4, M.white);
      box(group, width * 0.36, 0.2, front + 3.2, 0.18, 0.8, 2.4, M.white);
      box(group, 0, 0.2, front + 4.35, width * 0.72, 0.12, 0.12, M.metal);
    } else if (style === 'apartments') {
      // Molduras horizontais, varandas e entrada comum de prédio.
      for (let floor = 1; floor < floors; floor++) {
        box(group, 0, floor * 3.15, front + 0.22, width + 0.18, 0.12, 0.18, M.concrete);
      }
      box(group, 0, 0.22, front + 1.0, 5.8, 0.18, 1.8, M.concrete);
      box(group, -2.75, 0.35, front + 1.75, 0.16, 2.8, 0.16, M.white);
      box(group, 2.75, 0.35, front + 1.75, 0.16, 2.8, 0.16, M.white);
    } else if (style === 'modern' || style === 'coastal') {
      // Alpendre contemporâneo, vidro e jardim frontal.
      box(group, 0, 2.85, front + 1.4, width * 0.72, 0.18, 2.7, M.white);
      for (const px of [-width * 0.32, width * 0.32]) {
        box(group, px, 0.2, front + 1.4, 0.2, 2.65, 0.2, M.white);
      }
      box(group, 0, 1.0, front + 2.75, width * 0.56, 0.08, 0.08, M.glass);
      box(group, 0, 0.08, front + 4.0, width * 0.8, 0.12, 3.4, M.green);
      if (style === 'coastal') {
        box(group, width / 2 - 1.4, 0.08, -depth / 2 - 1.2, 2.8, 0.12, 2.8, M.water);
      }
    } else if (style === 'luxury') {
      // Vivenda de luxo com piscina, colunas, varanda e entrada em pedra.
      box(group, 0, 0.08, front + 4.4, width * 0.7, 0.12, 4.2, M.water);
      box(group, 0, 0.16, front + 2.0, width * 0.78, 0.18, 2.0, M.concrete);
      for (const px of [-width * 0.34, width * 0.34]) {
        box(group, px, 0.2, front + 1.7, 0.34, 3.0, 0.34, M.white);
      }
      box(group, 0, 3.15, front + 1.7, width * 0.8, 0.2, 3.0, M.white);
      box(group, 0, 1.2, front + 3.15, width * 0.58, 0.08, 0.08, M.glass);
      for (const px of [-width * 0.25, width * 0.25]) {
        box(group, px, 0.12, -depth / 2 - 1.0, 0.18, 1.0, 0.18, M.gold);
      }
    }

    group.position.set(x, 0, z);
    scene.add(group);
    world.buildings.push({
      group, x, z, width, depth, floors,
      type: floors >= 3 ? 'apartment' : 'house',
      district: districtName,
      propertyType: type,
      salePrice: price,
      forSale: true,
      entranceX: x,
      entranceZ: z + depth / 2 + 2
    });
  };

  const makePublic = (name, subtitle, x, z, kind, color = 0x285b77) => {
    const group = new THREE.Group();
    const wall = material(0xe8dfce);
    const height = kind === 'university' || kind === 'hospital' ? 12 : 8;
    const width = kind === 'university' ? 25 : 18;
    const depth = kind === 'university' ? 20 : 15;
    box(group, 0, 0, 0, width + 1, 0.3, depth + 1, M.concrete);
    box(group, 0, 0.3, 0, width, height, depth, wall);
    box(group, 0, height + 0.3, 0, width + 0.6, 0.45, depth + 0.6, M.white);
    box(group, 0, 0.45, depth / 2 + 0.12, 4.2, 2.8, 0.18, M.dark);
    for (let floor = 0; floor < Math.ceil(height / 3.2); floor++) {
      for (const wx of [-width / 3, 0, width / 3]) {
        box(group, wx, 1.15 + floor * 3.2, depth / 2 + 0.15, 2.1, 1.5, 0.08, M.glass);
      }
    }
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), 256, 64, 480);
    const texture = new THREE.CanvasTexture(signCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(width - 2, 17), 2.2),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    sign.position.set(0, 3.8, depth / 2 + 0.2);
    group.add(sign);
    group.position.set(x, 0, z);
    scene.add(group);
    world.buildings.push({
      group, x, z, width, depth, floors: Math.ceil(height / 3.2),
      type: 'shop', facility: name, kind,
      entranceX: x, entranceZ: z + depth / 2 + 2
    });
    world.destinations.push({ name, x, z, category: 'serviço público' });
  };

  addGround();

  // Eixos rodoviários que ligam as zonas do norte, centro, leste e sul.
  const arterial = [
    [0, 0, -125, 35], [0, 0, 145, 55],
    [0, 0, -105, -220], [0, 0, 245, -115],
    [0, 0, 155, 195], [0, 0, 20, 320],
    [-125, 35, -255, -105], [-125, 35, -155, 190],
    [-255, -105, -285, 65], [-105, -220, -255, -105],
    [145, 55, 245, -115], [145, 55, 155, 195],
    [155, 195, 20, 320], [-155, 190, -285, 65],
    [-285, 65, -390, -20], [-390, -20, -125, 35]
  ];
  arterial.forEach(([x1, z1, x2, z2]) => addRoad(x1, z1, x2, z2, 13));

  // Ruas locais em grelha curta, com ligações entre os dez bairros.
  for (const z of [-220, -105, 35, 190, 320]) addRoad(-420, z, 300, z, 9, false);
  for (const x of [-285, -155, 0, 155, 245]) addRoad(x, -270, x, 360, 9, false);

  DISTRICTS.forEach((district, index) => {
    world.destinations.push({
      name: district.name,
      x: district.x,
      z: district.z,
      category: 'município'
    });
    addSign(district.name, district.subtitle, district.x, district.z - 20);

    // Ingombota já é representada pelo centro urbano construído em world.js.
    if (district.name === 'Ingombota') return;

    if (district.style === 'musseque') {
      makeHome(district.x - 23, district.z + 22, 'musseque', index, district.name);
      makeHome(district.x + 1, district.z + 24, 'musseque', index + 1, district.name);
      makeHome(district.x + 24, district.z + 22, 'popular', index + 2, district.name);
      makeHome(district.x - 18, district.z + 48, 'musseque', index + 3, district.name);
      makeHome(district.x + 17, district.z + 48, 'popular', index + 4, district.name);
    } else if (district.style === 'popular') {
      makeHome(district.x - 25, district.z + 22, 'popular', index, district.name);
      makeHome(district.x, district.z + 25, 'popular', index + 1, district.name);
      makeHome(district.x + 26, district.z + 22, 'popular', index + 2, district.name);
      makeHome(district.x - 18, district.z + 49, 'musseque', index + 3, district.name);
      makeHome(district.x + 18, district.z + 49, 'popular', index + 4, district.name);
    } else if (district.style === 'apartments') {
      makeHome(district.x - 28, district.z + 25, 'apartments', index, district.name);
      makeHome(district.x + 1, district.z + 27, 'apartments', index + 1, district.name);
      makeHome(district.x + 30, district.z + 25, 'popular', index + 2, district.name);
      makeHome(district.x - 20, district.z + 57, 'apartments', index + 3, district.name);
    } else {
      makeHome(district.x - 28, district.z + 25, district.style, index, district.name);
      makeHome(district.x + 3, district.z + 27, district.style, index + 1, district.name);
      makeHome(district.x + 34, district.z + 25, district.style, index + 2, district.name);
      makeHome(district.x - 15, district.z + 58, district.style, index + 3, district.name);
    }
  });

  // Serviços públicos distribuídos pelas diferentes zonas da cidade.
  makePublic('Administração Municipal', 'Atendimento ao cidadão', 0, -115, 'administration', 0x285b77);
  makePublic('Universidade de Luanda', 'Ensino superior', 175, -285, 'university', 0x315d83);
  makePublic('Escola Pública', 'Ensino geral', -260, -250, 'school', 0x39704d);
  makePublic('Hospital Geral', 'Urgência e consultas', 260, 20, 'hospital', 0x9d3030);
  makePublic('Quartel dos Bombeiros', 'Proteção e emergência', -190, 85, 'fire-station', 0xb4472f);
  makePublic('Esquadra de Polícia', 'Polícia Nacional', 80, -185, 'police', 0x24466f);
  makePublic('Instituto Técnico', 'Formação profissional', 260, 270, 'technical-school', 0x4e6c85);
  makePublic('Terminal de Transportes', 'Táxis e autocarros', 345, 180, 'transport-terminal', 0x8a652b);
  makePublic('Mercado Municipal', 'Comércio e abastecimento', -325, -80, 'market', 0x39704d);
  makePublic('Centro de Saúde', 'Cuidados primários', -80, 360, 'clinic', 0x9d3030);

  // A Ilha de Luanda é uma zona própria, além dos dez bairros principais.
  world.destinations.push({ name: ILHA_DE_LUANDA.name, x: ILHA_DE_LUANDA.x, z: ILHA_DE_LUANDA.z, category: 'ilha' });
  addSign(ILHA_DE_LUANDA.name, ILHA_DE_LUANDA.subtitle, ILHA_DE_LUANDA.x, ILHA_DE_LUANDA.z - 20);
  [-1, 0, 1, 2].forEach((offset, index) => {
    makeHome(ILHA_DE_LUANDA.x + offset * 22, ILHA_DE_LUANDA.z + 35 + (index % 2) * 24, 'coastal', index + 30, ILHA_DE_LUANDA.name);
  });

  // Rua da Direita, no centro de Ingombota.
  world.destinations.push({ name: 'Rua da Direita', x: 0, z: -32, category: 'rua' });
  addSign('Rua da Direita', 'Centro de Ingombota', 0, -55);

  return world;
}
