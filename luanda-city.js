import * as THREE from 'three';

const DISTRICTS = [
  { name: 'Cacuaco', x: -300, z: -410, style: 'musseque', subtitle: 'Zona costeira e bairros populares' },
  { name: 'Mulenvos', x: -105, z: -390, style: 'popular', subtitle: 'Bairros residenciais em expansão' },
  { name: 'Sambizanga', x: -115, z: -195, style: 'musseque', subtitle: 'Bairros tradicionais de Luanda' },
  { name: 'Ingombota', x: 0, z: 0, style: 'apartments', subtitle: 'Centro histórico e zona comercial' },
  { name: 'Rangel', x: 105, z: -125, style: 'popular', subtitle: 'Zona urbana e comércio local' },
  { name: 'Maianga', x: 155, z: 35, style: 'apartments', subtitle: 'Residências e serviços urbanos' },
  { name: 'Cazenga', x: 265, z: -235, style: 'musseque', subtitle: 'Bairros populares e oficinas' },
  { name: 'Hoji ya Henda', x: 355, z: -95, style: 'popular', subtitle: 'Zona residencial e comercial' },
  { name: 'Viana', x: 390, z: 165, style: 'popular', subtitle: 'Indústria, comércio e habitação' },
  { name: 'Kilamba Kiaxi', x: 225, z: 285, style: 'apartments', subtitle: 'Golfe e Nova Vida' },
  { name: 'Camama', x: 405, z: 365, style: 'modern', subtitle: 'Urbanizações e novas moradias' },
  { name: 'Talatona', x: -115, z: 350, style: 'luxury', subtitle: 'Condomínios e zona empresarial' },
  { name: 'Belas', x: -330, z: 385, style: 'modern', subtitle: 'Benfica e zonas residenciais' },
  { name: 'Mussulo', x: -465, z: 185, style: 'coastal', subtitle: 'Ilha, praia e turismo' },
  { name: 'Samba', x: 5, z: 235, style: 'popular', subtitle: 'Zona costeira e residencial' },
  { name: 'Kilamba', x: -65, z: 515, style: 'apartments', subtitle: 'Centralidade e prédios residenciais' }
];

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
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1120, 1160), M.ground);
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
    box(group, 0, 0.28, 0, width, height, depth, wall);
    box(group, 0, height + 0.28, 0, width + 0.5, 0.35, depth + 0.5,
      style === 'musseque' ? M.roof : M.white);

    const front = depth / 2 + 0.06;
    box(group, 0, 0.38, front, 1.35, 2.2, 0.13, M.dark);
    box(group, 0, 0.42, front + 0.08, 1.05, 2.0, 0.06, M.gold);

    const windowCount = floors >= 3 ? 3 : 2;
    for (let floor = 0; floor < floors; floor++) {
      for (let n = 0; n < windowCount; n++) {
        const wx = (n - (windowCount - 1) / 2) * (width / (windowCount + 0.2));
        const wy = floor * 3.15 + 1.35;
        box(group, wx, wy, front + 0.04, 1.65, 1.25, 0.12, M.dark);
        box(group, wx, wy + 0.08, front + 0.12, 1.35, 1.05, 0.05, M.glass);
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
    [-300, -410, -115, -195],
    [-115, -195, 0, 0],
    [0, 0, 155, 35],
    [155, 35, 225, 285],
    [225, 285, 405, 365],
    [0, 0, 5, 235],
    [5, 235, -115, 350],
    [-115, 350, -330, 385],
    [-330, 385, -465, 185],
    [0, 0, 105, -125],
    [105, -125, 265, -235],
    [265, -235, 355, -95],
    [355, -95, 390, 165],
    [390, 165, 405, 365],
    [-105, -390, -300, -410],
    [-65, 515, -115, 350]
  ];
  arterial.forEach(([x1, z1, x2, z2]) => addRoad(x1, z1, x2, z2, 13));

  // Vias de ligação entre os principais bairros.
  addRoad(-430, -300, 430, -300, 10, false);
  addRoad(-430, -80, 430, -80, 10, false);
  addRoad(-430, 150, 430, 150, 10, false);
  addRoad(-430, 390, 430, 390, 10, false);
  addRoad(-300, -500, -300, 500, 10, false);
  addRoad(-100, -500, -100, 530, 10, false);
  addRoad(150, -500, 150, 500, 10, false);
  addRoad(390, -430, 390, 450, 10, false);

  DISTRICTS.forEach((district, index) => {
    world.destinations.push({
      name: district.name,
      x: district.x,
      z: district.z,
      category: 'município'
    });
    addSign(district.name, district.subtitle, district.x, district.z - 20);

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
  makePublic('Administração Municipal', 'Atendimento ao cidadão', -20, -38, 'administration', 0x285b77);
  makePublic('Universidade de Luanda', 'Ensino superior', 185, -360, 'university', 0x315d83);
  makePublic('Escola Pública', 'Ensino geral', -280, -340, 'school', 0x39704d);
  makePublic('Hospital Geral', 'Urgência e consultas', 320, 30, 'hospital', 0x9d3030);
  makePublic('Quartel dos Bombeiros', 'Proteção e emergência', -190, 70, 'fire-station', 0xb4472f);
  makePublic('Esquadra de Polícia', 'Polícia Nacional', 75, -185, 'police', 0x24466f);
  makePublic('Instituto Técnico', 'Formação profissional', 285, 300, 'technical-school', 0x4e6c85);
  makePublic('Terminal de Transportes', 'Táxis e autocarros', 395, 215, 'transport-terminal', 0x8a652b);
  makePublic('Mercado Municipal', 'Comércio e abastecimento', -345, -120, 'market', 0x39704d);
  makePublic('Centro de Saúde', 'Cuidados primários', -80, 420, 'clinic', 0x9d3030);

  return world;
}
