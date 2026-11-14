import * as THREE from 'three';

// Interiores integrados nos edifícios do Kilamba: recepção no rés-do-chão,
// quatro pisos residenciais, elevador, escadas e apartamentos T2.
export function createHouseSystem(scene, world = { buildings: [] }) {
  const houses = [];
  const FLOOR_HEIGHT = 5.0;
  const INTERIOR_SCALE_XZ = 1.5;
  const INTERIOR_SCALE_Y = 1.35;
  const FLOOR_COUNT = 5;
  const mat = (color, roughness=.82, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const M = {
    wall:mat(0xeee9df), wallAlt:mat(0xd8d0c2), floor:mat(0xb8a58d), tile:mat(0xc9d0ce),
    concrete:mat(0xb7b4ac), wood:mat(0x795239), woodLight:mat(0xa8794f), white:mat(0xf4f1e9),
    sofa:mat(0x3f6475), fabric:mat(0xd9cbb6), dark:mat(0x252b30), metal:mat(0x8e999d,.38,.58),
    gold:mat(0xc29a58,.35,.4), green:mat(0x477b4d), red:mat(0x9d5146),
    glass:new THREE.MeshPhysicalMaterial({color:0x8fc4d3,transparent:true,opacity:.38,roughness:.18,depthWrite:false})
  };
  const geometryCache = new Map();
  function cachedGeometry(key, create) {
    if (!geometryCache.has(key)) geometryCache.set(key, create());
    return geometryCache.get(key);
  }
  function box(parent,x,y,z,w,h,d,material,cast=true) {
    const key = `b:${w}:${h}:${d}`;
    const geometry = cachedGeometry(key, () => new THREE.BoxGeometry(w,h,d));
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x,y+h/2,z); mesh.castShadow=cast; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function cylinder(parent,x,y,z,radius,height,material) {
    const key = `c:${radius}:${height}:14`;
    const geometry = cachedGeometry(key, () => new THREE.CylinderGeometry(radius,radius,height,14));
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x,y+height/2,z); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function plant(parent,x,z) {
    cylinder(parent,x,0,z,.38,.42,M.wood);
    for(let n=0;n<7;n++) {
      const a=n*Math.PI*2/7;
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(.2,.95,6),M.green);
      leaf.position.set(x+Math.cos(a)*.22,.82,z+Math.sin(a)*.22);
      leaf.rotation.z=-.2; parent.add(leaf);
    }
  }
  function addSofa(g,x,z,color=M.sofa,scale=1) {
    const seat = box(g,x,.26,z,2.55*scale,.48,.9,color);
    seat.userData.houseAction = { label: 'SENTAR NO SOFÁ', type: 'sit', rotationY: Math.PI, offsetZ: 1.05 };
    box(g,x,.72,z-.36,2.55*scale,.55,.17,color);
    for(const side of [-1,1]) box(g,x+side*1.2*scale,.4,z,.16,.58,.9,color);
    for(const dx of [-.72,0,.72]) box(g,x+dx*scale,.78,z-.34,.48,.18,.12,M.fabric);
  }
  function addReceptionLobby(level,variant) {
    // Base arquitectónica do átrio; a decoração é aplicada uma única vez
    // pelo conjunto de mobiliário específico de cada edifício.
    const palette=[
      [0x1d3548,0xb58a50,0xe8e2d5,0x315b66],
      [0x3a2830,0xc39b62,0xf0e7dc,0x6d4b48],
      [0x243a32,0xb79b70,0xece6d9,0x526b57],
      [0x30313b,0xa9a9b2,0xf1eee8,0x536078],
      [0x49362b,0xc18b58,0xf3e7d6,0x78604a],
      [0x233b4b,0x9eacb4,0xf0f2ef,0x426b7c],
      [0x3b303f,0xb69a78,0xf0e9df,0x75607d],
      [0x263c3d,0xc1a16b,0xf2eadb,0x58766c],
      [0x3d3430,0xb58d70,0xf1e8df,0x72594d],
      [0x283449,0xbca36f,0xf5f0e6,0x61748b]
    ][Math.abs(variant)%10];
    const [deep,accent,light,feature]=palette.map(color=>mat(color,.58));
    box(level,0,-.005,4.7,16.4,.045,6.9,M.tile,false);
    box(level,0,.025,1.05,16.2,.035,.12,accent,false);
    box(level,0,.035,4.35,6.4,.025,3.5,light,false);
    // Parede de assinatura com moldura e painel central individual.
    box(level,0,0,1.05,15.8,2.62,.16,M.wallAlt);
    box(level,0,1.55,.94,7.2,1.42,.08,deep);
    box(level,0,1.62,.885,6.82,1.25,.035,feature,false);
    box(level,0,2.26,.86,4.8,.055,.025,accent,false);
    box(level,-6.7,1.25,1.0,1.65,1.8,.12,deep);
    box(level,6.7,1.25,1.0,1.65,1.8,.12,deep);
    // Rodapé e frisos discretos do átrio.
    box(level,0,.08,1.0,15.6,.12,.2,accent,false);
    // Luzes embutidas quentes, sem excesso de objectos repetidos.
    for(const [x,z] of [[-5.5,1],[0,1],[5.5,1],[-5.5,6],[0,6],[5.5,6]]) {
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0xffe4bd}));
      lamp.position.set(x,2.58,z); level.add(lamp);
    }
  }
  function addHotelLobbyFurniture(level, variant) {
    const palettes=[
      [0x1d3548,0xb58a50,0xe8e2d5,0x315b66],
      [0x3a2830,0xc39b62,0xf0e7dc,0x6d4b48],
      [0x243a32,0xb79b70,0xece6d9,0x526b57],
      [0x30313b,0xa9a9b2,0xf1eee8,0x536078],
      [0x49362b,0xc18b58,0xf3e7d6,0x78604a],
      [0x233b4b,0x9eacb4,0xf0f2ef,0x426b7c],
      [0x3b303f,0xb69a78,0xf0e9df,0x75607d],
      [0x263c3d,0xc1a16b,0xf2eadb,0x58766c],
      [0x3d3430,0xb58d70,0xf1e8df,0x72594d],
      [0x283449,0xbca36f,0xf5f0e6,0x61748b]
    ];
    const [deepColor,accentColor,lightColor,featureColor]=palettes[Math.abs(variant)%10];
    const deep=mat(deepColor,.42), accent=mat(accentColor,.3,.52), light=mat(lightColor,.68), feature=mat(featureColor,.72);
    const marble=mat(variant%2?0xd0cbc1:0xe0ddd5,.25,.08);
    const leather=mat(variant%2?0x67443b:0x263f50,.76);
    const black=mat(0x20262d,.35,.18);
    const screen=new THREE.MeshStandardMaterial({color:0x172f3b,emissive:0x102c3b,emissiveIntensity:.45,roughness:.25});
    // Balcão único, desenhado como peça de mobiliário de hotel.
    box(level,-3.75,.05,3.45,4.55,1.12,1.2,deep);
    box(level,-3.75,.12,2.83,4.2,.91,.045,accent,false);
    for(let n=0;n<7;n++) box(level,-5.55+n*.6,.17,2.80,.025,.76,.025,light,false);
    const receptionCounterTop=box(level,-3.75,1.18,3.45,4.82,.15,1.34,marble);
    receptionCounterTop.userData.houseAction={label:'CONSULTAR PREÇOS DOS QUARTOS',type:'reception'};
    box(level,-3.75,1.27,3.45,4.66,.035,1.2,light,false);
    // Computador, teclado e telefone em escala de recepção.
    box(level,-4.55,1.37,3.12,.72,.48,.09,black);
    box(level,-4.55,1.45,3.065,.61,.32,.025,screen,false);
    box(level,-4.55,1.29,3.36,.55,.045,.22,black);
    box(level,-3.2,1.33,3.17,.34,.045,.22,black);
    cylinder(level,-2.72,1.31,3.15,.095,.12,accent);
    // Sofá principal e duas poltronas com braços, almofadas e pés.
    const seats=variant%3===0
      ? [[3.15,4.25,2.35,.95],[6.15,4.25,1.55,.95]]
      : variant%3===1
        ? [[3.05,4.35,2.0,.9],[6.0,4.35,2.0,.9],[4.55,6.25,1.65,.82]]
        : [[3.3,4.2,2.5,.9],[6.35,4.2,1.6,.9]];
    for(const [x,z,w,d] of seats) {
      box(level,x,.25,z,w,.42,d,leather);
      box(level,x,.68,z-d*.34,w,.62,.2,deep);
      for(const side of [-1,1]) box(level,x+side*(w/2-.08),.43,z,.16,.56,d,deep);
      for(const dx of [-.55,.55]) box(level,x+dx,.72,z-d*.34,.48,.12,.16,light);
      for(const px of [x-w*.38,x+w*.38]) for(const pz of [z-d*.34,z+d*.34]) cylinder(level,px,.02,pz,.035,.25,accent);
    }
    // Mesa de centro em pedra com estrutura metálica.
    box(level,4.7,.42,5.2,1.75,.12,.95,marble);
    for(const x of [4.05,5.35]) for(const z of [4.82,5.58]) cylinder(level,x,.04,z,.035,.38,accent);
    box(level,4.7,.51,5.2,.55,.035,.32,light,false);
    // Apoio de bagagem e mala, num canto do lobby.
    box(level,-.1,.18,5.85,1.35,.12,.58,accent);
    for(const x of [-.65,.45]) cylinder(level,x,.04,5.85,.035,.28,deep);
    box(level,-.1,.4,5.85,.82,.5,.38,leather);
    box(level,-.1,.68,5.85,.82,.045,.38,accent);
    // Quadros emoldurados e relógio; disposição alternada por bloco.
    for(const [x,y,w,h] of (variant%2===0?[[-6.35,1.35,1.45,1.55],[-3.75,1.35,1.45,1.55],[-1.15,1.35,1.45,1.55]]:[[-6.2,1.4,1.65,1.7],[-2.9,1.4,1.65,1.7]])) {
      box(level,x,y,.91,w,h,.09,accent);
      box(level,x,y,.85,w-.16,h-.16,.025,light,false);
      box(level,x,y+.22,.825,w*.52,.045,.02,feature,false);
      box(level,x,y-.2,.825,w*.68,.025,.02,accent,false);
    }
    cylinder(level,1.0,2.05,1.02,.31,.07,accent);
    cylinder(level,1.0,2.12,1.02,.25,.025,light);
    // Pendentes discretos, com acabamento em latão.
    for(const [x,z] of [[-5.3,2.2],[-1.0,2.2],[3.4,2.0],[6.5,2.0]]) {
      cylinder(level,x,2.45,z,.022,.62,accent);
      const shade=new THREE.Mesh(new THREE.ConeGeometry(.24,.2,14),light);
      shade.position.set(x,2.2,z); level.add(shade);
    }
    // Tapete de recepção, vasos altos e plantas naturais.
    box(level,1.35,.025,1.15,5.9,.04,2.15,feature,false);
    box(level,1.35,.05,.08,5.72,.025,.055,accent,false);
    plant(level,-7.0,1.0); plant(level,7.0,1.0);
    // Aparador de entrada com tampo claro e acabamento metálico.
    box(level,6.45,.45,6.7,1.25,.12,.42,deep);
    for(const x of [5.95,6.95]) cylinder(level,x,.05,6.7,.035,.4,accent);
    plant(level,6.45,6.25);
  }
  function addPremiumDetails(level, variant) {
    // Tapetes, quadros, mesas laterais e elementos decorativos.
    box(level,-5.1,.018,3.0,5.6,.035,4.4,variant%2?M.fabric:M.tile,false);
    box(level,-5.1,.42,4.65,1.15,.78,.72,M.woodLight);
    box(level,-5.1,.84,4.65,1.22,.08,.78,M.gold);
    for (const x of [-7.6,-2.6]) {
      box(level,x,1.55,-2.1,1.15,1.25,.12,M.wood);
      box(level,x,1.62,-2.02,.92,1.0,.035,M.gold);
      box(level,x,2.25,-2.0,.38,.08,.04,M.white);
    }
    // Sala de jantar completa.
    box(level,1.0,.025,3.0,4.0,.035,3.3,M.fabric,false);
    box(level,1.0,.82,3.0,2.6,.14,1.55,M.woodLight);
    box(level,1.0,.91,3.0,2.48,.045,1.43,M.white,false);
    for (const [x,z] of [[-.1,1.95],[2.1,1.95],[-.1,4.05],[2.1,4.05]]) {
      box(level,x,.48,z,.68,.16,.68,M.sofa);
      box(level,x,.9,z-.28,.68,.8,.12,M.sofa);
      for (const dx of [-.24,.24]) for (const dz of [-.22,.22]) box(level,x+dx,.2,z+dz,.07,.4,.07,M.wood);
    }
    // Armários superiores, puxadores e acabamento da cozinha.
    for (const x of [4.2,5.65,7.1]) {
      box(level,x,2.0,1.75,1.25,.95,.55,M.wood);
      box(level,x,2.0,1.44,1.12,.82,.045,M.woodLight);
      box(level,x+.43,2.0,1.37,.055,.24,.05,M.gold);
    }
    box(level,5.8,1.12,3.72,4.2,.12,.25,M.gold);
    // Cabeceiras, mesas de cabeceira e quadros dos quartos.
    for (const [x,z] of [[-5,-6.6],[2.1,-6.55]]) {
      box(level,x,.9,z-1.22,3.05,1.35,.18,M.woodLight);
      for (const side of [-1,1]) {
        box(level,x+side*1.85,.42,z,.62,.72,.58,M.wood);
        cylinder(level,x+side*1.85,.78,z,.16,.32,M.gold);
      }
      box(level,x,1.8,z-1.38,1.5,.9,.08,M.wood);
      box(level,x,1.84,z-1.32,1.28,.68,.035,M.fabric);
    }
    // Acessórios e divisória de vidro da casa de banho.
    box(level,6.7,1.85,-7.8,2.5,.12,.12,M.gold);
    box(level,6.7,.9,-7.72,1.5,.9,.08,M.glass,false);
    for (const x of [5.9,6.5,7.1]) cylinder(level,x,.9,-7.35,.045,.55,M.metal);
    // Plantas e candeeiros de chão.
    for (const [x,z] of [[-7.2,6.3],[7.2,6.3],[-7.1,-2.8],[7.1,-2.8]]) plant(level,x,z);
    for (const [x,z] of [[-7.0,3.2],[7.0,3.2]]) {
      cylinder(level,x,0,z,.12,1.75,M.metal);
      const shade=new THREE.Mesh(new THREE.ConeGeometry(.42,.48,12),M.gold);
      shade.position.set(x,1.95,z); level.add(shade);
    }
  }
  function addApartmentFurniture(level,variant) {
    // Sala de estar e televisão.
    addSofa(level,-5.2,3.2,variant%2?M.red:M.sofa,1);
    box(level,-5.1,.38,1.0,1.8,.12,.9,M.woodLight);
    box(level,-5.2,0,-.15,3.0,.65,.48,M.wood);
    box(level,-5.2,.72,-.38,2.35,1.35,.1,M.dark);
    box(level,-5.2,.03,3.0,4.8,.035,3.0,M.fabric,false);
    // Quarto principal.
    const mainBed = box(level,-5.0,.18,-6.6,3.0,.35,2.7,M.wood);
    mainBed.userData.houseAction = { label: 'DEITAR NA CAMA', type: 'bed', rotationY: 0, offsetZ: 1.15 };
    box(level,-5.0,.55,-6.6,2.9,.2,2.6,M.white);
    box(level,-5.0,.78,-7.55,2.8,.3,.65,M.fabric);
    const wardrobe = box(level,-1.9,0,-6.5,1.0,2.35,1.5,M.woodLight);
    wardrobe.userData.houseAction = { label: 'ABRIR GUARDA-ROUPA', type: 'wardrobe' };
    box(level,-1.85,.85,-4.95,1.2,.9,.55,M.wood);
    // Segundo quarto.
    const secondBed = box(level,2.1,.18,-6.55,2.5,.35,2.5,M.wood);
    secondBed.userData.houseAction = { label: 'DEITAR NA CAMA', type: 'bed', rotationY: 0, offsetZ: 1.15 };
    box(level,2.1,.55,-6.55,2.4,.2,2.4,M.white);
    box(level,2.1,.78,-7.4,2.3,.28,.55,M.fabric);
    box(level,4.25,0,-4.7,1.0,2.25,.75,M.woodLight);
    // Cozinha com bancada, armários, lava-loiça e fogão.
    box(level,5.8,.08,3.0,4.2,.82,1.0,M.woodLight);
    box(level,5.8,.92,3.0,4.35,.12,1.08,M.white);
    const sink = box(level,4.25,.15,2.45,.95,.65,.08,M.metal);
    sink.userData.houseAction = { label: 'USAR LAVA-LOIÇA', type: 'sink' };
    const stove = box(level,6.8,.15,2.45,.95,.65,.08,M.dark);
    stove.userData.houseAction = { label: 'LIGAR / DESLIGAR FOGÃO', type: 'stove' };
    stove.material = new THREE.MeshStandardMaterial({ color: 0x252b30, roughness: .4, metalness: .35, emissive: 0x000000 });
    for(const x of [6.55,7.05]) for(const z of [2.7,3.15]) cylinder(level,x,1.05,z,.12,.035,M.metal);
    box(level,7.55,0,4.65,.85,2.15,.9,M.white);
    const fridge = box(level,7.08,.1,4.65,.08,1.95,.82,M.metal);
    fridge.userData.houseAction = { label: 'ABRIR FRIGORÍFICO', type: 'fridge' };
    box(level,5.8,.78,.8,2.0,.12,1.0,M.wood);
    // Casa de banho com duche, sanita e lavatório.
    box(level,6.75,.02,-6.65,2.65,.06,2.65,M.tile,false);
    box(level,7.5,.12,-7.25,1.05,.12,1.0,M.white);
    const shower = box(level,7.5,.2,-6.75,1.0,1.9,.05,M.glass,false);
    shower.userData.houseAction = { label: 'LIGAR / DESLIGAR DUCHE', type: 'shower' };
    const toilet = box(level,5.85,.12,-5.85,.65,.35,.75,M.white);
    toilet.userData.houseAction = { label: 'USAR SANITA', type: 'toilet', offsetZ: .9 };
    box(level,5.85,.48,-5.55,.58,.65,.18,M.white);
    const bathroomSink = box(level,7.7,.7,-5.55,.8,.12,.5,M.white);
    bathroomSink.userData.houseAction = { label: 'LAVAR AS MÃOS', type: 'sink' };
  }
  function addDoor(level, doorList, x, z, width, floorIndex, baseRotation = 0, openRotation = 1.35) {
    const hinge = new THREE.Group();
    hinge.position.set(x,0,z); hinge.rotation.y = baseRotation;
    const panel = box(hinge,width/2,.05,0,width,2.15,.09,M.woodLight);
    panel.position.x = width/2;
    const rotated = Math.abs(Math.sin(baseRotation)) > .5;
    panel.userData.houseAction = { label: 'ABRIR / FECHAR PORTA', type: 'door', openRotation };
    panel.userData.houseDoorCollider = { x:x+Math.cos(baseRotation)*width/2, z:z-Math.sin(baseRotation)*width/2, w:rotated ? .18 : width, d:rotated ? width : .18, active:true, floor:floorIndex };
    panel.userData.isOpen = false; panel.userData.houseDoorHinge = hinge; panel.userData.houseDoorBaseRotation = baseRotation;
    hinge.add(panel); level.add(hinge); doorList.push(panel); return panel;
  }

  function addFloorShell(level) {
    box(level,0,-.16,0,17,.32,17,M.floor,false);
    // Paredes perimetrais, com porta larga na fachada da entrada.
    box(level,-8.35,0,0,.3,2.85,17,M.wall);
    box(level,8.35,0,0,.3,2.85,17,M.wall);
    // Parede traseira com vãos verdadeiros para as quatro janelas.
    box(level,0,0,-8.35,17,.42,.3,M.wall);
    box(level,0,1.68,-8.35,17,1.17,.3,M.wall);
    for(const [cx,width] of [[-7.05,2.45],[-4.2,1.55],[-.4,2.55],[3.75,1.0],[7.0,2.25]]) {
      box(level,cx,.42,-8.35,width,1.26,.3,M.wall);
    }
    box(level,-5.2,0,8.35,6.3,2.85,.3,M.wall);
    box(level,5.2,0,8.35,6.3,2.85,.3,M.wall);
    // Divisórias com vãos de passagem.
    // Divisória com passagem larga: não fecha o percurso entre sala e cozinha.
    box(level,-1.2,0,-4.5,.16,2.55,1.6,M.wallAlt);
    box(level,-1.2,0,-.8,.16,2.55,1.6,M.wallAlt);
    box(level,-5.0,0,-5.0,6.1,2.55,.16,M.wallAlt);
    box(level,2.9,0,-5.0,4.2,2.55,.16,M.wallAlt);
    box(level,5.0,0,-7.15,.16,2.55,2.1,M.wallAlt);
    box(level,5.0,0,-5.45,.16,2.55,.6,M.wallAlt);
    box(level,5.0,0,-1.4,.16,2.55,2.0,M.wallAlt);
    box(level,-6.7,0,-1.5,3.0,2.55,.16,M.wallAlt);
    box(level,-2.0,0,-1.5,1.5,2.55,.16,M.wallAlt);
    box(level,3.8,0,-1.5,2.2,2.55,.16,M.wallAlt);
    box(level,6.1,0,-6.6,.8,2.55,.16,M.wallAlt);
    box(level,7.75,0,-6.6,1.1,2.55,.16,M.wallAlt);
  }
  function addWindowsAndBalcony(level) {
    for(const x of [-5.6,-2.8,2.0,5.5]) {
      box(level,x,1.05,-8.17,1.25,1.25,.06,M.glass,false);
      box(level,x,.42,-8.12,1.38,.08,.1,M.white);
      box(level,x,1.72,-8.12,1.38,.08,.1,M.white);
      box(level,x-.66,1.05,-8.12,.08,1.3,.1,M.white);
      box(level,x+.66,1.05,-8.12,.08,1.3,.1,M.white);
    }
    box(level,0,0,8.55,5.0,.16,1.15,M.tile);
    for(let n=0;n<=10;n++) box(level,-2.5+n*.5,.16,9.08,.045,.85,.045,M.metal);
    box(level,0,1.2,8.35,5.0,.06,.06,M.metal);
  }
  function addApartmentFloor(parent,floorIndex,variant,doorList) {
    const level=new THREE.Group();
    level.position.y=floorIndex*FLOOR_HEIGHT;
    level.scale.set(INTERIOR_SCALE_XZ, INTERIOR_SCALE_Y, INTERIOR_SCALE_XZ);
    parent.add(level);
    addFloorShell(level);
    if(floorIndex===0) {
      addReceptionLobby(level,variant);
      addHotelLobbyFurniture(level,variant);
    }
    // Pisos superiores ficam vazios e prontos para venda/decoração pelo futuro proprietário.
    addWindowsAndBalcony(level);
    if (floorIndex > 0) {
      addDoor(level,doorList,-1.95,-5.0,2.6,floorIndex,0,1.35);
      addDoor(level,doorList,5.0,-3.7,.9,floorIndex,Math.PI/2,1.35);
    }
    for(const [x,z] of [[-5,2],[-5,-6],[5,2],[6,-6],[0,5]]) {
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,8),new THREE.MeshBasicMaterial({color:0xffe2ae}));
      bulb.position.set(x,2.55,z); level.add(bulb);
    }
    const ceilingLight = new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:0xffdfb0}));
    ceilingLight.position.set(0,2.55,0);
    level.add(ceilingLight);
    return level;
  }
  function createBuildingInterior(building,index) {
    const root=new THREE.Group();
    // The interior occupies the exact same coordinates as its exterior building.
    root.position.set(building.x,0,building.z);
    root.visible=false;
    scene.add(root);
    const doors=[];
    for(let floor=0;floor<FLOOR_COUNT;floor++) addApartmentFloor(root,floor,index+floor,doors);

    // Elevator shaft and doors are part of the shared lobby on every level.
    const shaft=new THREE.Group(); root.add(shaft);
    box(shaft,-7.65,0,.35,.2,FLOOR_HEIGHT*FLOOR_COUNT,2.1,M.dark);
    box(shaft,-7.05,0,-.72,1.25,FLOOR_HEIGHT*FLOOR_COUNT,.14,M.dark);
    box(shaft,-7.05,0,1.42,1.25,FLOOR_HEIGHT*FLOOR_COUNT,.14,M.dark);
    for(let floor=0;floor<FLOOR_COUNT;floor++) {
      const y=floor*FLOOR_HEIGHT;
      box(shaft,-7.05,y+.08,.34,1.1,2.45,.08,M.metal);
      box(shaft,-7.05,y+.22,.40,.42,1.95,.04,M.dark);
      box(shaft,-6.5,y+.82,.56,.08,.38,.08,M.gold);
      // Stair landing and visible ascending steps.
      box(shaft,6.95,y,0,2.0,.16,3.8,M.tile);
      for(let step=0;step<9;step++) {
        const stair=box(shaft,6.35+(step%2)*.55,y+.18+step*.15,-1.65+step*.39,1.0,.16,.46,M.concrete);
        stair.rotation.z=0;
      }
      for(const z of [-1.7,1.8]) box(shaft,7.88,y+.15,z,.08,1.0,.08,M.metal);
    }
    const roof=box(root,0,FLOOR_HEIGHT*FLOOR_COUNT,0,28.8,.3,28.8,M.wall,false);
    const colliders=[];
    const add=(x,z,w,d,floor=null)=>colliders.push({
      minX:building.x+(x-w/2)*INTERIOR_SCALE_XZ,maxX:building.x+(x+w/2)*INTERIOR_SCALE_XZ,
      minZ:building.z+(z-d/2)*INTERIOR_SCALE_XZ,maxZ:building.z+(z+d/2)*INTERIOR_SCALE_XZ,
      ...(floor===null?{}:{floor})
    });
    add(-8.35,0,.35,17); add(8.35,0,.35,17); add(0,-8.35,17,.35);
    add(-5.2,8.35,6.3,.35); add(5.2,8.35,6.3,.35);
    add(-1.2,-4.5,.2,1.6); add(-1.2,-.8,.2,1.6);
    add(-5,-5,6.1,.2); add(2.9,-5,4.2,.2);
    add(-6.7,-1.5,3,.2); add(-2,-1.5,1.5,.2); add(3.8,-1.5,2.2,.2);
    add(5,-6.6,.2,3.2); add(5,-1.4,.2,2); add(7,-6.6,2.6,.2);
    // Paredes opacas e sólidas da receção no rés-do-chão.
    add(0,1.05,15.8,.22,0); add(-6.7,1.0,1.75,.22,0); add(6.7,1.0,1.75,.22,0);
    // Colisão real com balcão, área de espera, mesas, bagagem e plantas.
    add(-3.75,3.45,4.75,1.42,0);
    add(3.15,4.25,2.55,1.15,0); add(6.15,4.25,1.85,1.15,0);
    add(4.7,5.2,1.95,1.12,0); add(-.1,5.85,1.45,.72,0);
    add(-7.0,1.0,.8,.8,0); add(7.0,1.0,.8,.8,0); add(6.45,6.7,1.4,.65,0);
    // Os rececionistas também têm volume físico e não podem ser atravessados.
    add(-4.65,2.05,.78,.78,0); add(-2.85,2.05,.78,.78,0);
    for (const door of doors) {
      const c=door.userData.houseDoorCollider;
      colliders.push({minX:building.x+(c.x-c.w/2)*INTERIOR_SCALE_XZ,maxX:building.x+(c.x+c.w/2)*INTERIOR_SCALE_XZ,minZ:building.z+(c.z-c.d/2)*INTERIOR_SCALE_XZ,maxZ:building.z+(c.z+c.d/2)*INTERIOR_SCALE_XZ,_houseDoor:true,floor:c.floor,door});
    }
    return {group:root,roof,interiorX:building.x,interiorZ:building.z,colliders,doors,floorCount:FLOOR_COUNT,floorHeight:FLOOR_HEIGHT};
  }

  const locations=(world.buildings||[])
    .filter(building=>building.type==='apartment'||building.type==='house')
    .map(building=>({
      name:building.name||building.propertyType||'Bloco residencial',
      x:building.x,z:building.z,district:building.district||'Kilamba',
      propertyType:building.propertyType||'apartamento T2',
      entranceX:Number(building.entranceX??building.x),
      entranceZ:Number(building.entranceZ??building.z),
      exterior:building.group
    }));
  locations.forEach((location,index)=>{
    const house={...location,colliders:[],interior:null,interiorRoof:null,currentFloor:0};
    house.ensureInterior=()=>{
      if(house.interior) return house;
      const inside=createBuildingInterior(house,index);
      house.interior=inside.group; house.interiorRoof=inside.roof;
      house.interiorX=inside.interiorX; house.interiorZ=inside.interiorZ;
      house.colliders=inside.colliders; house.doors=inside.doors; house.floorCount=inside.floorCount; house.floorHeight=inside.floorHeight;
      return house;
    };
    houses.push(house);
  });
  return houses;
}
