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
    wood: material(0x80583b, 0.82),
    metal: material(0x59636a, 0.48, 0.68),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x8fc5d2, roughness: 0.18, metalness: 0.08,
      transparent: true, opacity: 0.72
    }),
    roof: material(0x77736b),
    green: material(0x477b48),
    gold: material(0xd5a744),
    red: material(0xa83d32),
    water: material(0x258ca7, 0.25)
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

  const makePublic = (name, subtitle, x, z, kind, color = 0x285b77) => {
    const group = new THREE.Group();
    const wallColors = {
      bank: 0xe5e8e8, boutique: 0xd9c9b7, 'car-dealer': 0xe8e6df,
      hotel: 0xd8d0c4, 'fuel-station': 0xe8e4d8, market: 0xd9c8a8,
      hospital: 0xe8e7df, police: 0xdce3e8
    };
    const wall = material(wallColors[kind] || 0xe8dfce);
    const height = ['university','hospital','hotel'].includes(kind) ? 12 : 8;
    const width = ({
      university:25, hotel:24, 'car-dealer':24, bank:21,
      boutique:19, 'fuel-station':22, market:22
    })[kind] || 18;
    const depth = ({
      university:20, hotel:19, 'car-dealer':19, bank:17,
      boutique:16, 'fuel-station':18, market:19
    })[kind] || 15;
    box(group, 0, 0, 0, width + 1, 0.3, depth + 1, M.concrete);
    box(group, 0, 0.3, 0, width, height, depth, wall);
    box(group, 0, height + 0.3, 0, width + 0.6, 0.45, depth + 0.6, M.white);
    // Fachada comercial com montra, molduras, entrada coberta e pilares.
    if (['bank','boutique','car-dealer','hotel','fuel-station','market'].includes(kind)) {
      box(group, 0, 0.38, depth / 2 + 0.18, width * 0.72, 2.9, 0.12, M.glass);
      box(group, 0, 3.25, depth / 2 + 0.32, width * 0.78, 0.28, 0.72, M.dark);
      for (const px of [-width * 0.39, width * 0.39]) {
        box(group, px, 0.25, depth / 2 + 0.42, 0.34, 3.35, 0.34, M.white);
      }
      box(group, 0, 3.55, depth / 2 + 0.48, width * 0.84, 0.22, 1.15, M.white);
      for (const wx of [-width * 0.28, width * 0.28]) {
        box(group, wx, 0.55, depth / 2 + 0.27, 0.12, 2.6, 0.12, M.metal);
      }
    }
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
  // Rua da Direita: eixo comercial e pedonal no centro de Ingombota.
  addRoad(-85, -32, 85, -32, 9, false);

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

    // Nesta etapa, os bairros ficam sem casas; as ruas e serviços permanecem.
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
  makePublic('Mercado Central', 'Comércio e abastecimento', -325, -80, 'market', 0x39704d);
  makePublic('Centro de Saúde', 'Cuidados primários', -80, 360, 'clinic', 0x9d3030);

  // Equipamentos comerciais da referência visual do mundo virtual.
  makePublic('Banco de Luanda', 'Serviços bancários e atendimento', -350, 245, 'bank', 0x176b55);
  makePublic('Boutique Moda Angola', 'Loja de roupa e acessórios', 320, -325, 'boutique', 0x8a3c62);
  makePublic('Concessionária de Automóveis', 'Exposição e compra de viaturas', 390, -245, 'car-dealer', 0x9b3028);
  makePublic('Hotel Angola', 'Recepção e alojamento', -420, -245, 'hotel', 0x315b83);
  makePublic('Posto Angola Oil', 'Combustível e loja de conveniência', 340, 390, 'fuel-station', 0xc52f27);

  // A Ilha de Luanda é uma zona própria, além dos dez bairros principais.
  world.destinations.push({ name: ILHA_DE_LUANDA.name, x: ILHA_DE_LUANDA.x, z: ILHA_DE_LUANDA.z, category: 'ilha' });
  addSign(ILHA_DE_LUANDA.name, ILHA_DE_LUANDA.subtitle, ILHA_DE_LUANDA.x, ILHA_DE_LUANDA.z - 20);
  // A Ilha de Luanda fica sem casas nesta etapa.

  // Rua da Direita, no centro de Ingombota.
  world.destinations.push({ name: 'Rua da Direita', x: 0, z: -32, category: 'rua' });
  addSign('Rua da Direita', 'Centro de Ingombota', 0, -55);

  return world;
}
