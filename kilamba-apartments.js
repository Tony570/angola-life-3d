import * as THREE from 'three';

// Interiores integrados nos edifícios do Kilamba: recepção no rés-do-chão,
// quatro pisos residenciais, elevador, escadas e apartamentos T2.
export function createHouseSystem(scene, world = { buildings: [] }) {
  const houses = [];
  const FLOOR_HEIGHT = 3.05;
  const FLOOR_COUNT = 5;
  const mat = (color, roughness=.82, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const M = {
    wall:mat(0xeee9df), wallAlt:mat(0xd8d0c2), floor:mat(0xb8a58d), tile:mat(0xc9d0ce),
    concrete:mat(0xb7b4ac), wood:mat(0x795239), woodLight:mat(0xa8794f), white:mat(0xf4f1e9),
    sofa:mat(0x3f6475), fabric:mat(0xd9cbb6), dark:mat(0x252b30), metal:mat(0x8e999d,.38,.58),
    gold:mat(0xc29a58,.35,.4), green:mat(0x477b4d), red:mat(0x9d5146),
    glass:new THREE.MeshPhysicalMaterial({color:0x8fc4d3,transparent:true,opacity:.38,roughness:.18})
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
    // Pavimento de entrada, tapete e balcão de atendimento.
    box(level,0,-.005,4.7,16.4,.045,6.9,M.tile,false);
    box(level,0,.025,1.05,16.2,.035,.12,M.gold,false);
    box(level,0,.035,4.35,5.8,.025,3.1,M.fabric,false);
    box(level,-3.75,.08,3.45,4.25,1.08,1.08,M.wood);
    box(level,-3.75,1.16,3.45,4.42,.13,1.18,M.gold);
    box(level,-3.75,.27,2.89,3.78,.58,.08,M.woodLight);
    box(level,-3.75,.93,2.83,1.85,.16,.05,M.white);
    box(level,-3.75,1.12,2.82,1.25,.08,.04,M.green);
    // Parede de destaque atrás da recepção e letreiro.
    box(level,-3.75,0,1.12,5.0,2.55,.18,M.wallAlt);
    box(level,-3.75,2.12,1.0,3.75,.38,.12,M.wood);
    box(level,-3.75,2.20,.92,3.25,.09,.06,M.gold);
    // Área de espera com sofás, mesas e plantas.
    addSofa(level,3.2,4.15,variant%2?M.red:M.sofa,.78);
    addSofa(level,5.65,4.15,variant%2?M.red:M.sofa,.78);
    box(level,4.42,.27,5.25,1.35,.16,.7,M.woodLight);
    box(level,4.42,.43,5.25,1.25,.035,.62,M.white);
    plant(level,-7.1,5.65); plant(level,7.1,5.65);
    // Caixa de correio, quadro informativo e sinalética do bloco.
    for(let n=0;n<8;n++) {
      const x=-5.9+(n%4)*.55, y=.28+Math.floor(n/4)*.48;
      box(level,x,y,6.95,.43,.38,.16,n%3===0?M.gold:M.metal);
    }
    box(level,0,1.55,-2.15,5.8,.9,.12,M.wallAlt);
    box(level,0,2.05,-2.23,4.5,.12,.05,M.wood);
    box(level,0,2.16,-2.25,3.9,.055,.035,M.gold);
    // Iluminação quente do hall.
    for(const [x,z] of [[-5.5,1],[0,1],[5.5,1],[-5.5,6],[0,6],[5.5,6]]) {
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.105,10,8),new THREE.MeshBasicMaterial({color:0xffe4b1}));
      lamp.position.set(x,2.58,z); level.add(lamp);
      // A esfera luminosa substitui vários focos dinâmicos para reduzir o custo gráfico.
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
    parent.add(level);
    addFloorShell(level);
    if(floorIndex===0) addReceptionLobby(level,variant);
    else addApartmentFurniture(level,variant);
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
    const roof=box(root,0,FLOOR_HEIGHT*FLOOR_COUNT,0,17.2,.18,17.2,M.wall,false);
    const colliders=[];
    const add=(x,z,w,d)=>colliders.push({
      minX:building.x+x-w/2,maxX:building.x+x+w/2,
      minZ:building.z+z-d/2,maxZ:building.z+z+d/2
    });
    add(-8.35,0,.35,17); add(8.35,0,.35,17); add(0,-8.35,17,.35);
    add(-5.2,8.35,6.3,.35); add(5.2,8.35,6.3,.35);
    add(-1.2,-4.5,.2,1.6); add(-1.2,-.8,.2,1.6);
    add(-5,-5,6.1,.2); add(2.9,-5,4.2,.2);
    add(-6.7,-1.5,3,.2); add(-2,-1.5,1.5,.2); add(3.8,-1.5,2.2,.2);
    add(5,-6.6,.2,3.2); add(5,-1.4,.2,2); add(7,-6.6,2.6,.2);
    for (const door of doors) {
      const c=door.userData.houseDoorCollider;
      colliders.push({minX:building.x+c.x-c.w/2,maxX:building.x+c.x+c.w/2,minZ:building.z+c.z-c.d/2,maxZ:building.z+c.z+c.d/2,_houseDoor:true,floor:c.floor,door});
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
