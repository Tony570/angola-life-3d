import * as THREE from 'three';

// ANGOLA LIFE 3D — INTERIORES EXPLORÁVEIS DOS BLOCOS DO KILAMBA
// Cada bloco tem rés-do-chão + 4 pisos, elevador, escadas e apartamento T2.
export function createHouseSystem(scene, world = { buildings: [] }) {
  const houses = [];
  const FLOOR_HEIGHT = 3.05;
  const FLOOR_COUNT = 5;

  const mat = (color, roughness = 0.82, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const M = {
    wall: mat(0xeee9df), wallAlt: mat(0xd8d0c2), floor: mat(0xb8a58d),
    tile: mat(0xc9d0ce), concrete: mat(0xb7b4ac), wood: mat(0x795239), woodLight: mat(0xa8794f),
    white: mat(0xf4f1e9), sofa: mat(0x3f6475), fabric: mat(0xd9cbb6),
    dark: mat(0x252b30), metal: mat(0x8e999d, .38, .58),
    gold: mat(0xc29a58, .35, .4), glass: new THREE.MeshPhysicalMaterial({
      color: 0x8fc4d3, transparent: true, opacity: .42, roughness: .18
    }), green: mat(0x477b4d), red: mat(0x9d5146)
  };

  function box(parent, x, y, z, w, h, d, material, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, radius, height, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), material);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addSofa(g, x, z, color = M.sofa) {
    box(g, x, .28, z, 3.1, .52, 1.0, color);
    box(g, x, .78, z - .43, 3.1, .62, .18, color);
    for (const side of [-1, 1]) box(g, x + side * 1.48, .42, z, .18, .68, 1.0, color);
    for (const dx of [-.9, 0, .9]) box(g, x + dx, .83, z - .43, .58, .24, .12, M.fabric);
  }

  function addApartmentFloor(parent, floorIndex, variant) {
    const level = new THREE.Group();
    level.position.y = floorIndex * FLOOR_HEIGHT;
    parent.add(level);

    const floorMaterial = floorIndex % 2 ? mat(0xc8bda9) : M.floor;
    box(level, 0, -.16, 0, 17, .32, 17, floorMaterial, false);
    // Perímetro com vão amplo de entrada.
    box(level, -8.35, 0, 0, .3, 2.85, 17, M.wall);
    box(level, 8.35, 0, 0, .3, 2.85, 17, M.wall);
    box(level, 0, 0, -8.35, 17, 2.85, .3, M.wall);
    box(level, -5.6, 0, 8.35, 5.5, 2.85, .3, M.wall);
    box(level, 5.6, 0, 8.35, 5.5, 2.85, .3, M.wall);

    // Hall/corredor, com acesso desimpedido a todas as divisões.
    box(level, -1.2, 0, -2.4, .16, 2.55, 5.8, M.wallAlt);
    box(level, -5.0, 0, -5.0, 6.1, 2.55, .16, M.wallAlt);
    box(level, 2.9, 0, -5.0, 4.2, 2.55, .16, M.wallAlt);
    box(level, 5.0, 0, -6.6, .16, 2.55, 3.2, M.wallAlt);
    box(level, 5.0, 0, -1.4, .16, 2.55, 2.0, M.wallAlt);
    // Portas abertas entre sala, quartos, cozinha e casa de banho.
    box(level, -6.7, 0, -1.5, 3.0, 2.55, .16, M.wallAlt);
    box(level, -2.0, 0, -1.5, 1.5, 2.55, .16, M.wallAlt);
    box(level, 3.8, 0, -1.5, 2.2, 2.55, .16, M.wallAlt);
    box(level, 7.0, 0, -6.6, 2.6, 2.55, .16, M.wallAlt);

    // Sala de estar e televisão.
    addSofa(level, -5.2, 3.2, variant % 2 ? M.red : M.sofa);
    box(level, -5.1, .42, 1.0, 1.8, .12, .9, M.woodLight);
    box(level, -5.2, 0, -0.15, 3.0, .65, .48, M.wood);
    box(level, -5.2, .72, -.38, 2.35, 1.35, .1, M.dark);
    box(level, -5.2, .03, 3.0, 4.8, .035, 3.0, M.fabric, false);

    // Quarto principal.
    box(level, -5.0, .18, -6.6, 3.0, .35, 2.7, M.wood);
    box(level, -5.0, .55, -6.6, 2.9, .2, 2.6, M.white);
    box(level, -5.0, .78, -7.55, 2.8, .3, .65, M.fabric);
    box(level, -1.9, 0, -6.5, 1.0, 2.35, 1.5, M.woodLight);
    box(level, -1.85, .85, -4.95, 1.2, .9, .55, M.wood);

    // Segundo quarto.
    box(level, 2.1, .18, -6.55, 2.5, .35, 2.5, M.wood);
    box(level, 2.1, .55, -6.55, 2.4, .2, 2.4, M.white);
    box(level, 2.1, .78, -7.4, 2.3, .28, .55, M.fabric);
    box(level, 4.25, 0, -4.7, 1.0, 2.25, .75, M.woodLight);

    // Cozinha equipada.
    box(level, 5.8, .08, 3.0, 4.2, .82, 1.0, M.woodLight);
    box(level, 5.8, .92, 3.0, 4.35, .12, 1.08, M.white);
    box(level, 4.25, .15, 2.45, .95, .65, .08, M.metal);
    box(level, 6.8, .15, 2.45, .95, .65, .08, M.dark);
    for (const x of [6.55, 7.05]) for (const z of [2.7, 3.15]) cylinder(level, x, 1.05, z, .12, .035, M.metal);
    box(level, 7.55, 0, 4.65, .85, 2.15, .9, M.white);
    box(level, 5.8, .78, .8, 2.0, .12, 1.0, M.wood);
    // Casa de banho com duche, sanita e lavatório.
    box(level, 6.75, .02, -6.65, 2.65, .06, 2.65, M.tile, false);
    box(level, 7.5, .12, -7.25, 1.05, .12, 1.0, M.white);
    box(level, 7.5, .2, -6.75, 1.0, 1.9, .05, M.glass, false);
    box(level, 5.85, .12, -5.85, .65, .35, .75, M.white);
    box(level, 5.85, .48, -5.55, .58, .65, .18, M.white);
    box(level, 7.7, .7, -5.55, .8, .12, .5, M.white);

    // Janelas, caixilharia e varandas com vista para a fachada.
    for (const x of [-5.6, -2.8, 2.0, 5.5]) {
      box(level, x, 1.05, -8.17, 1.25, 1.25, .06, M.glass, false);
      box(level, x, .42, -8.12, 1.38, .08, .1, M.white);
      box(level, x, 1.72, -8.12, 1.38, .08, .1, M.white);
      box(level, x - .66, 1.05, -8.12, .08, 1.3, .1, M.white);
      box(level, x + .66, 1.05, -8.12, .08, 1.3, .1, M.white);
    }
    box(level, 0, 0, 8.55, 5.0, .16, 1.15, M.tile);
    for (let n = 0; n <= 10; n++) box(level, -2.5 + n * .5, .16, 9.08, .045, .85, .045, M.metal);
    box(level, 0, 1.2, 8.35, 5.0, .06, .06, M.metal);

    // Luzes interiores e interruptores visuais.
    for (const [x,z] of [[-5,2],[-5,-6],[5,2],[6,-6],[0,5]]) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.09,8,8), new THREE.MeshBasicMaterial({color:0xffe2ae}));
      bulb.position.set(x,2.55,z); level.add(bulb);
      const light = new THREE.PointLight(0xffdfb0,.32,7);
      light.position.set(x,2.35,z); level.add(light);
    }
    return level;
  }

  function createBuildingInterior(index) {
    const root = new THREE.Group();
    const interiorX = 500 + index * 38;
    const interiorZ = 0;
    root.position.set(interiorX, 0, interiorZ);
    root.visible = false;
    scene.add(root);

    // Cinco pisos habitáveis, cada um com apartamento completo.
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
      addApartmentFloor(root, floor, index + floor);
    }

    // Núcleo vertical: caixa do elevador e escadaria em todos os pisos.
    const shaft = new THREE.Group();
    root.add(shaft);
    box(shaft, -7.25, 0, .4, 1.75, FLOOR_HEIGHT * FLOOR_COUNT, 2.0, M.dark);
    for (let floor = 0; floor < FLOOR_COUNT; floor++) {
      const y = floor * FLOOR_HEIGHT;
      box(shaft, -7.25, y + .15, 1.48, 1.25, 2.35, .08, M.metal);
      box(shaft, -7.25, y + .25, 1.54, .48, 1.95, .035, M.dark);
      box(shaft, -6.25, y + .85, 1.85, .16, .48, .08, M.gold);
      // Patamar e escadas laterais visíveis em cada piso.
      box(shaft, 6.95, y, .1, 2.1, .16, 3.8, M.tile);
      for (let step = 0; step < 8; step++) {
        box(shaft, 6.25 + (step % 2) * .55, y + .18 + step * .17, -1.45 + step * .42,
          1.1, .18, .48, M.concrete);
      }
      for (const z of [-1.7, 1.8]) box(shaft, 7.95, y + .15, z, .08, 1.0, .08, M.metal);
    }

    // Cobertura superior removível para permitir visão da casa por dentro.
    const ceiling = box(root, 0, FLOOR_HEIGHT * FLOOR_COUNT, 0, 17.2, .18, 17.2, M.wall, false);
    const colliders = [];
    const add = (x,z,w,d) => colliders.push({
      minX: interiorX + x - w/2, maxX: interiorX + x + w/2,
      minZ: interiorZ + z - d/2, maxZ: interiorZ + z + d/2
    });
    add(-8.35,0,.35,17); add(8.35,0,.35,17); add(0,-8.35,17,.35);
    add(-5.6,8.35,5.5,.35); add(5.6,8.35,5.5,.35);
    // Paredes internas: as aberturas das portas ficam livres.
    add(-1.2,-2.4,.2,5.8);
    add(-5,-5,6.1,.2); add(2.9,-5,4.2,.2);
    add(-6.7,-1.5,3,.2); add(-2,-1.5,1.5,.2);
    add(3.8,-1.5,2.2,.2); add(5,-6.6,.2,3.2); add(5,-1.4,.2,2);
    add(7,-6.6,2.6,.2);
    // O mobiliário é decorativo e não bloqueia a exploração do jogador.
    return { group:root, roof:ceiling, interiorX, interiorZ, colliders, floorCount:FLOOR_COUNT, floorHeight:FLOOR_HEIGHT };
  }

  const locations = (world.buildings || [])
    .filter(building => building.type === 'apartment' || building.type === 'house')
    .map(building => ({
      name: building.name || building.propertyType || 'Bloco residencial',
      x: building.x, z: building.z, district: building.district || 'Kilamba',
      propertyType: building.propertyType || 'apartamento T2',
      entranceX: Number(building.entranceX ?? building.x),
      entranceZ: Number(building.entranceZ ?? building.z),
      exterior: building.group
    }));

  locations.forEach((location,index) => {
    const house = { ...location, colliders:[], interior:null, interiorRoof:null, currentFloor:0 };
    house.ensureInterior = () => {
      if (house.interior) return house;
      const inside = createBuildingInterior(index);
      house.interior = inside.group;
      house.interiorRoof = inside.roof;
      house.interiorX = inside.interiorX;
      house.interiorZ = inside.interiorZ;
      house.colliders = inside.colliders;
      house.floorCount = inside.floorCount;
      house.floorHeight = inside.floorHeight;
      return house;
    };
    houses.push(house);
  });

  return houses;
}
