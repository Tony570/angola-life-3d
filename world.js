
import * as THREE from 'three';
import { createPeople } from './people.js';

export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    buildings: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
      { name: 'Banco Nacional', x: -50, z: 58 },
      { name: 'Boutique Central', x: -50, z: 29 },
      { name: 'Concessionária de Automóveis', x: 50, z: 58 },
      { name: 'Hotel Central', x: 91, z: 29 },
      { name: 'Esquadra de Polícia', x: 50, z: -42 },
      { name: 'Hospital Municipal', x: 91, z: 101 },
      { name: 'Mercado', x: -78, z: -18 },
      { name: 'Posto de Combustível', x: 78, z: -28 },
      { name: 'Sabor de Luanda', x: -55, z: -12 },
      { name: 'Cantinho da Ilha', x: -55, z: -35 },
      { name: 'Paladar Angolano', x: -55, z: -58 },
      { name: 'Centro de Luanda', x: 35, z: -35 },
      { name: 'Zona Comercial', x: -40, z: -35 },
      { name: 'Bairro Residencial', x: 40, z: 40 },
      { name: 'Marginal', x: -35, z: 40 }
    ]
  };

  const mat = {
    grass: new THREE.MeshStandardMaterial({ color: 0x777d45, roughness: 1 }),
    grass2: new THREE.MeshStandardMaterial({ color: 0x85865a, roughness: 1 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x303236, roughness: 1 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xaaa397, roughness: 1 }),
    sidewalkDark: new THREE.MeshStandardMaterial({ color: 0x817e75, roughness: 1 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.9 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe4b72e, roughness: 0.9 }),
    black: new THREE.MeshStandardMaterial({ color: 0x202124 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x769eaa, roughness: 0.25, metalness: 0.15, transparent: true, opacity: 0.72 }),
    windowDark: new THREE.MeshStandardMaterial({ color: 0x263b43 }),
    green: new THREE.MeshStandardMaterial({ color: 0x347342 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x43834b }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x765035 }),
    sand: new THREE.MeshStandardMaterial({ color: 0xd0b17b }),
    water: new THREE.MeshStandardMaterial({ color: 0x2389a9, roughness: 0.3 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x99958d }),
    metal: new THREE.MeshStandardMaterial({ color: 0x555b5d, metalness: 0.65 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x80533b }),
    wood: new THREE.MeshStandardMaterial({ color: 0x765037 }),
    red: new THREE.MeshStandardMaterial({ color: 0x9c382b }),
    blue: new THREE.MeshStandardMaterial({ color: 0x315c75 })
  };

  const buildingColors = [0xe5c49a, 0xd8a77f, 0xf0dfbd, 0xc9b7a0, 0xe2d3b9, 0xd4a18c, 0xc8c4ad, 0xe9d7b5, 0xbfa58c, 0xd5c6a8, 0xc5a68d, 0xe2cdb0];
  const roofColors = [0x985e43, 0x6d5550, 0x9b927e, 0x514f4b];
  const signColors = [0xd9a52d, 0x285b75, 0x9c382b, 0x347342];
  const sharedBox = new THREE.BoxGeometry(1, 1, 1);
  const dummy = new THREE.Object3D();

  function box(parent, x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, x, y, z, rt, rb, h, material, segments = 10) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function makeSurfaceTexture(base, seed = 1, pavement = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 256, 256);

    let state = seed >>> 0;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };

    for (let i = 0; i < 7000; i++) {
      const shade = Math.floor(random() * 48) + 65;
      const alpha = 0.025 + random() * 0.09;
      ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`;
      const size = 0.5 + random() * (pavement ? 1.5 : 2.8);
      ctx.fillRect(random() * 256, random() * 256, size, size);
    }

    if (!pavement) {
      for (let i = 0; i < 16; i++) {
        const x = random() * 256;
        const y = random() * 256;
        ctx.strokeStyle = 'rgba(10,11,12,0.18)';
        ctx.lineWidth = 0.8 + random() * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (random() - 0.5) * 18, y + 5 + random() * 15);
        ctx.lineTo(x + (random() - 0.5) * 28, y + 15 + random() * 18);
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(12,13,14,${0.025 + random() * 0.035})`;
        ctx.fillRect(random() * 230, random() * 250, 8 + random() * 24, 4 + random() * 12);
      }
    } else {
      ctx.strokeStyle = 'rgba(65,62,56,0.22)';
      ctx.lineWidth = 1;
      for (let p = 0; p <= 256; p += 32) {
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(256, p);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(pavement ? 2 : 1, pavement ? 2 : 14);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    return texture;
  }

  const asphaltSurface = new THREE.MeshStandardMaterial({
    map: makeSurfaceTexture('#303236', 17), roughness: 0.98, metalness: 0
  });
  const sidewalkSurface = new THREE.MeshStandardMaterial({
    map: makeSurfaceTexture('#aaa397', 31, true), roughness: 1
  });
  const gutterMaterial = new THREE.MeshStandardMaterial({ color: 0x686862, roughness: 1 });
  const drainMaterial = new THREE.MeshStandardMaterial({ color: 0x34383a, metalness: 0.35, roughness: 0.8 });

  function makeRoadPlane(x, z, width, length, horizontal, material, y) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(horizontal ? length : width, horizontal ? width : length),
      material
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = false;
    scene.add(mesh);
    return mesh;
  }

  function addInstancedStrips(count, geometry, material, positions) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.frustumCulled = true;
    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, p.ry || 0, 0);
      dummy.scale.set(p.sx || 1, p.sy || 1, p.sz || 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
    return mesh;
  }

  function addGround() {
    box(scene, 0, -1.2, 0, 260, 1, 260, mat.grass);
    for (let i = 0; i < 28; i++) {
      const x = -115 + (i * 37) % 230;
      const z = -110 + (i * 61) % 220;
      box(scene, x, -0.12, z, 12, 0.12, 12, mat.grass2);
    }
  }

  function makeRoad(x, z, width, length, horizontal = true) {
    makeRoadPlane(x, z, width, length, horizontal, asphaltSurface, 0.025);

    const sidewalkWidth = 2.6;
    const sidewalkOffset = width / 2 + sidewalkWidth / 2 + 0.12;
    const curbOffset = width / 2 + 0.13;
    const curbGeometry = new THREE.BoxGeometry(horizontal ? length : 0.24, 0.18, horizontal ? 0.24 : length);

    for (const side of [-1, 1]) {
      const sx = horizontal ? x : x + side * sidewalkOffset;
      const sz = horizontal ? z + side * sidewalkOffset : z;
      makeRoadPlane(sx, sz, horizontal ? length : sidewalkWidth, horizontal ? sidewalkWidth : length, horizontal, sidewalkSurface, 0.052);

      const curb = new THREE.Mesh(curbGeometry, mat.sidewalkDark);
      curb.position.set(horizontal ? x : x + side * curbOffset, 0.09, horizontal ? z + side * curbOffset : z);
      curb.receiveShadow = false;
      curb.castShadow = false;
      scene.add(curb);

      const gutter = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? length : 0.16, 0.025, horizontal ? 0.16 : length),
        gutterMaterial
      );
      gutter.position.set(horizontal ? x : x + side * (width / 2 - 0.04), 0.043, horizontal ? z + side * (width / 2 - 0.04) : z);
      scene.add(gutter);
    }

    const tilePositions = [];
    const tileStep = 3.2;
    const tileCount = Math.floor((length - 8) / tileStep);
    for (const side of [-1, 1]) {
      for (let i = 0; i < tileCount; i++) {
        const along = -length / 2 + 4 + i * tileStep;
        tilePositions.push({
          x: horizontal ? x + along : x + side * sidewalkOffset,
          y: 0.061,
          z: horizontal ? z + side * sidewalkOffset : z + along,
          sx: horizontal ? 0.035 : sidewalkWidth,
          sy: 0.012,
          sz: horizontal ? sidewalkWidth : 0.035
        });
      }
    }
    if (tilePositions.length) addInstancedStrips(tilePositions.length, sharedBox, gutterMaterial, tilePositions);

    if (width >= 12) {
      const dashCount = Math.max(1, Math.floor((length - 12) / 14));
      const dashPositions = [];
      for (let i = 0; i < dashCount; i++) {
        const along = -length / 2 + 7 + i * 14;
        dashPositions.push({
          x: horizontal ? x + along : x,
          y: 0.043,
          z: horizontal ? z : z + along,
          sx: horizontal ? 4.4 : 0.14,
          sy: 0.018,
          sz: horizontal ? 0.14 : 4.4
        });
      }
      addInstancedStrips(dashPositions.length, sharedBox, mat.yellow, dashPositions);

      const edgePositions = [-1, 1].map(side => ({
        x: horizontal ? x : x + side * (width / 2 - 0.95),
        y: 0.041,
        z: horizontal ? z + side * (width / 2 - 0.95) : z,
        sx: horizontal ? length : 0.11,
        sy: 0.014,
        sz: horizontal ? 0.11 : length
      }));
      addInstancedStrips(2, sharedBox, mat.white, edgePositions);
    }

    const drains = [];
    for (let along = -length / 2 + 10; along < length / 2 - 8; along += 28) {
      drains.push({
        x: horizontal ? x + along : x + sidewalkOffset,
        y: 0.075,
        z: horizontal ? z + sidewalkOffset : z + along,
        sx: 0.55, sy: 0.035, sz: 0.34
      });
    }
    if (drains.length) addInstancedStrips(drains.length, sharedBox, drainMaterial, drains);
  }

  function makeCrosswalk(x, z, horizontal = true) {
    const positions = [];
    for (let i = 0; i < 7; i++) {
      const offset = (i - 3) * 1.65;
      positions.push({
        x: x + (horizontal ? offset : 0),
        y: 0.052,
        z: z + (horizontal ? 0 : offset),
        sx: horizontal ? 1.35 : 0.42,
        sy: 0.025,
        sz: horizontal ? 0.42 : 1.35
      });
    }
    addInstancedStrips(positions.length, sharedBox, mat.white, positions);
  }

  function buildRoadNetwork() {
    makeRoad(0, 0, 16, 230, false);
    makeRoad(0, 0, 16, 230, true);
    [-70, -35, 35, 70].forEach(p => {
      makeRoad(p, 0, 10, 220, false);
      makeRoad(0, p, 10, 220, true);
    });
    [-70, -35, 0, 35, 70].forEach(p => {
      makeCrosswalk(p, 0, true);
      makeCrosswalk(0, p, false);
      makeCrosswalk(p, 35, true);
      makeCrosswalk(35, p, false);
    });
  }

  function addWindow(group, x, y, z, width, height) {
    const frame = new THREE.MeshStandardMaterial({ color: 0xd8d0bd });
    box(group, x, y, z, width, height, 0.09, mat.windowDark);
    box(group, x, y + 0.08, z + 0.06, width - 0.16, height - 0.16, 0.035, mat.glass);
    box(group, x, y, z - 0.07, width + 0.16, 0.09, 0.12, frame);
    box(group, x, y + height - 0.09, z - 0.07, width + 0.16, 0.09, 0.12, frame);
    box(group, x - width / 2 + 0.04, y, z - 0.07, 0.08, height, 0.12, frame);
    box(group, x + width / 2 - 0.04, y, z - 0.07, 0.08, height, 0.12, frame);
  }

  function addBalcony(group, x, y, z, width) {
    const railing = new THREE.MeshStandardMaterial({ color: 0x555b5d, metalness: 0.6, roughness: 0.55 });
    box(group, x, y, z + 0.75, width + 0.35, 0.15, 1.3, mat.concrete);
    box(group, x, y + 0.85, z + 1.35, width + 0.35, 0.08, 0.08, railing);
    box(group, x - width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);
    box(group, x + width / 2, y + 0.42, z + 0.75, 0.08, 0.85, 1.2, railing);
    const bars = Math.max(3, Math.floor(width / 0.45));
    for (let i = 0; i <= bars; i++) {
      const bx = x - width / 2 + (i / bars) * width;
      box(group, bx, y + 0.08, z + 1.35, 0.045, 0.75, 0.045, railing);
    }
  }

  function addAirConditioner(group, x, y, z) {
    box(group, x, y, z, 0.85, 0.42, 0.38, mat.white);
    box(group, x, y + 0.1, z + 0.2, 0.55, 0.16, 0.035, mat.metal);
  }

  function addRoofDetails(group, width, depth, height, seed) {
    const parapet = new THREE.MeshStandardMaterial({ color: 0xb8ad9a });
    box(group, 0, height, depth / 2 - 0.12, width, 0.55, 0.2, parapet);
    box(group, 0, height, -depth / 2 + 0.12, width, 0.55, 0.2, parapet);
    box(group, width / 2 - 0.12, height, 0, 0.2, 0.55, depth, parapet);
    box(group, -width / 2 + 0.12, height, 0, 0.2, 0.55, depth, parapet);
    if (seed % 3 !== 0) cylinder(group, width * 0.22, height + 0.5, -depth * 0.18, 0.9, 0.9, 1.5, mat.black, 12);
  }

  function makeBuilding(x, z, width, depth, floors, type = 'house') {
    const group = new THREE.Group();
    const height = floors * 3.2;
    const seed = Math.abs(Math.floor(x * 3 + z * 7));
    const wallMaterial = new THREE.MeshStandardMaterial({ color: buildingColors[seed % buildingColors.length], roughness: 0.9 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColors[Math.abs(Math.floor(x + z * 2)) % roofColors.length], roughness: 0.95 });
    const trim = new THREE.MeshStandardMaterial({ color: seed % 2 === 0 ? 0xe5ddcb : 0xb8a993 });
    const wall = 0.32;
    const doorWidth = type === 'shop' ? 2.8 : 1.9;
    const doorHeight = 2.5;
    const frontZ = depth / 2;

    box(group, 0, 0, 0, width, 0.28, depth, mat.concrete);
    box(group, -width / 2 + wall / 2, 0.28, 0, wall, height - 0.28, depth, wallMaterial);
    box(group, width / 2 - wall / 2, 0.28, 0, wall, height - 0.28, depth, wallMaterial);
    box(group, 0, 0.28, -depth / 2 + wall / 2, width, height - 0.28, wall, wallMaterial);
    const sideWidth = (width - doorWidth) / 2;
    box(group, -width / 2 + sideWidth / 2, 0.28, frontZ, sideWidth, height - 0.28, wall, wallMaterial);
    box(group, width / 2 - sideWidth / 2, 0.28, frontZ, sideWidth, height - 0.28, wall, wallMaterial);
    box(group, 0, doorHeight + 0.28, frontZ, doorWidth, height - doorHeight - 0.28, wall, wallMaterial);

    for (let floor = 1; floor < floors; floor++) {
      const y = floor * 3.2;
      box(group, 0, y - 0.16, 0, width, 0.28, depth, mat.concrete);
      box(group, 0, y + 0.08, 0, width - 0.7, 0.08, depth - 0.7, wallMaterial);
      box(group, 0, y - 0.1, frontZ + 0.08, width, 0.12, 0.12, trim);
    }

    for (const side of [-1, 1]) {
      box(group, side * (width / 2 - 0.25), 0.28, frontZ + 0.03, 0.28, height - 0.28, 0.35, trim);
    }

    const columns = Math.max(2, Math.floor(width / 3));
    for (let floor = 0; floor < floors; floor++) {
      const y = floor * 3.2 + 0.85;
      for (let col = 0; col < columns; col++) {
        const wx = -width / 2 + (col + 0.5) * width / columns;
        const ww = Math.min(1.3, width / columns * 0.55);
        if (floor === 0 && Math.abs(wx) < doorWidth / 2 + ww / 2 + 0.4) continue;
        box(group, wx, y, frontZ + 0.19, ww + 0.15, 1.55, 0.07, mat.windowDark);
        box(group, wx, y + 0.08, frontZ + 0.24, ww, 1.35, 0.035, mat.glass);
        box(group, wx, y - 0.78, frontZ + 0.27, ww + 0.18, 0.09, 0.1, trim);
        box(group, wx, y + 0.78, frontZ + 0.27, ww + 0.18, 0.09, 0.1, trim);
        if (type === 'apartment' && floor > 0 && col % 2 === 0) {
          addBalcony(group, wx, y - 0.7, frontZ + 0.2, Math.min(1.5, ww + 0.2));
        }
        if ((seed + floor + col) % 5 === 0) addAirConditioner(group, wx + 0.85, y + 0.25, frontZ + 0.25);
      }
    }

    const doorFrame = new THREE.MeshStandardMaterial({ color: 0x69432e });
    box(group, -doorWidth / 2 - 0.08, 0.28, frontZ + 0.08, 0.12, doorHeight, 0.18, doorFrame);
    box(group, doorWidth / 2 + 0.08, 0.28, frontZ + 0.08, 0.12, doorHeight, 0.18, doorFrame);
    box(group, 0, doorHeight + 0.2, frontZ + 0.08, doorWidth + 0.28, 0.16, 0.18, doorFrame);
    box(group, 0, 0.02, frontZ + 0.65, doorWidth + 1.2, 0.16, 1.1, mat.concrete);

    if (type === 'shop') {
      const sign = new THREE.MeshStandardMaterial({ color: signColors[seed % signColors.length], roughness: 0.7 });
      box(group, 0, 2.75, frontZ + 0.22, width * 0.78, 0.65, 0.2, sign);
      box(group, 0, 2.38, frontZ + 0.25, width * 0.8, 0.08, 0.22, mat.yellow);
      for (const side of [-1, 1]) {
        const sx = side * (doorWidth / 2 + sideWidth / 4);
        box(group, sx, 0.65, frontZ + 0.19, sideWidth * 0.72, 1.6, 0.08, mat.glass);
      }
    }

    const interiorFloor = new THREE.MeshStandardMaterial({ color: 0xb8a991 });
    box(group, 0, 0.29, 0, width - 0.8, 0.04, depth - 0.8, interiorFloor);
    if (type === 'house') {
      box(group, -width * 0.22, 0.3, -depth * 0.12, 0.16, 2.4, depth * 0.55, wallMaterial);
      box(group, width * 0.18, 0.3, -depth * 0.2, width * 0.36, 2.4, 0.16, wallMaterial);
    }
    box(group, 0, height, 0, width + 0.5, 0.35, depth + 0.5, roofMaterial);
    addRoofDetails(group, width, depth, height + 0.35, seed);
    group.position.set(x, 0, z);
    scene.add(group);
    world.buildings.push({ group, x, z, width, depth, floors, type, entranceX: x, entranceZ: z + depth / 2 + 1 });
    return group;
  }

  function makeFacilitySign(group, title, subtitle, color, width, depth) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101b25';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, 24, 256);
    ctx.strokeStyle = '#f4d37a';
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 1000, 232);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 78px Arial, sans-serif';
    ctx.fillText(title.toUpperCase(), 530, 105, 900);
    ctx.fillStyle = '#f4d37a';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(subtitle.toUpperCase(), 530, 190, 900);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(width * 0.82, 14), 1.35),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    sign.position.set(0, 3.55, depth / 2 + 0.28);
    group.add(sign);

    const canopy = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    box(group, 0, 2.55, depth / 2 + 0.48, Math.min(width * 0.9, 15), 0.22, 1.35, canopy);
    box(group, 0, 2.34, depth / 2 + 0.48, Math.min(width * 0.9, 15), 0.08, 1.35, mat.white);

    const record = world.buildings[world.buildings.length - 1];
    if (record && record.group === group) {
      record.facility = title;
      record.serviceType = subtitle;
    }
  }

  function addFacilityInterior(group, kind, width, depth) {
    if (kind === 'bank') {
      for (const x of [-4.5, 4.5]) {
        box(group, x, 0.3, depth / 2 - 2.2, 0.28, 2.9, 0.28, mat.concrete);
      }
      box(group, 0, 0.85, 0.2, width * 0.55, 1.1, 0.65, mat.wood);
      box(group, 0, 1.95, 0.2, width * 0.55, 0.12, 0.7, mat.yellow);
    } else if (kind === 'boutique') {
      for (const x of [-4, 0, 4]) {
        box(group, x, 0.45, -1.5, 0.12, 2.1, 0.12, mat.metal);
        box(group, x, 2.45, -1.5, 2.2, 0.12, 0.12, mat.metal);
        for (let i = 0; i < 4; i++) {
          const clothes = [mat.red, mat.blue, mat.yellow, mat.green][i];
          box(group, x - 0.72 + i * 0.48, 0.75, -1.42, 0.38, 1.05, 0.12, clothes);
        }
      }
      box(group, 0, 0.45, 2.1, 5.5, 0.9, 0.85, mat.wood);
    } else if (kind === 'car-dealer') {
      [0xc62828, 0xeeeeee, 0x2255aa].forEach((paint, index) => {
        const x = (index - 1) * 4.8;
        const body = new THREE.MeshStandardMaterial({ color: paint, metalness: 0.3, roughness: 0.4 });
        box(group, x, 0.42, -1.1, 2.05, 0.62, 3.6, body);
        box(group, x, 1.02, -1.25, 1.55, 0.65, 1.75, mat.glass);
        for (const wx of [-0.92, 0.92]) {
          for (const wz of [-2.2, 0.05]) {
            const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 12), mat.black);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x + wx, 0.38, -1.1 + wz);
            group.add(wheel);
          }
        }
      });
    } else if (kind === 'hotel') {
      for (const x of [-5.2, 5.2]) {
        cylinder(group, x, 0.25, depth / 2 + 0.3, 0.28, 0.34, 2.55, mat.white, 12);
      }
      box(group, 0, 0.3, depth / 2 - 2.1, width * 0.55, 0.95, 0.42, mat.wood);
      box(group, 0, 1.28, depth / 2 - 2.1, width * 0.55, 0.12, 0.48, mat.yellow);
    } else if (kind === 'police') {
      box(group, 0, 0.3, depth / 2 + 0.12, width * 0.78, 0.28, 0.16, mat.blue);
      box(group, 0, 0.58, depth / 2 + 0.12, width * 0.78, 0.1, 0.16, mat.white);
      box(group, 0, 0.68, depth / 2 + 0.12, width * 0.78, 0.12, 0.16, mat.blue);
      const badge = new THREE.Mesh(new THREE.CircleGeometry(0.62, 8), new THREE.MeshStandardMaterial({ color: 0xd9b64e, metalness: 0.35 }));
      badge.position.set(0, 1.55, depth / 2 + 0.22);
      group.add(badge);
    } else if (kind === 'hospital') {
      box(group, 0, 4.7, depth / 2 + 0.18, 1.8, 0.42, 0.2, mat.red);
      box(group, 0, 3.95, depth / 2 + 0.18, 0.42, 1.9, 0.2, mat.red);
    }
  }

  function makeNamedFacility(config) {
    const group = makeBuilding(config.x, config.z, config.width, config.depth, config.floors, config.buildingType || 'shop');
    makeFacilitySign(group, config.name, config.subtitle, config.color, config.width, config.depth);
    addFacilityInterior(group, config.kind, config.width, config.depth);
    const record = world.buildings[world.buildings.length - 1];
    if (record) {
      record.facility = config.name;
      record.kind = config.kind;
      record.entranceX = config.x;
      record.entranceZ = config.z + config.depth / 2 + 1.5;
    }
    return group;
  }

  function makeWallAndGate(x, z, width, rotation = 0) {
    const group = new THREE.Group();
    const wall = new THREE.MeshStandardMaterial({ color: 0xbcae98 });
    const gate = new THREE.MeshStandardMaterial({ color: 0x42494b, metalness: 0.55, roughness: 0.65 });
    box(group, -width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    box(group, width * 0.3, 0, 0, width * 0.4, 1.8, 0.35, wall);
    box(group, 0, 0, 0, width * 0.2, 1.7, 0.2, gate);
    for (let i = -3; i <= 3; i++) box(group, i * 0.3, 0, 0, 0.045, 1.65, 0.08, mat.metal);
    box(group, 0, 1.7, 0, width, 0.15, 0.4, wall);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  function buildCityBlocks() {
    const positions = [-88, -53, -18, 18, 53, 88];
    const facilities = [
      { x: -50, z: 50, name: 'Banco Nacional', subtitle: 'Serviços bancários', kind: 'bank', width: 18, depth: 14, floors: 3, color: 0x245b83 },
      { x: -50, z: 21, name: 'Boutique Central', subtitle: 'Moda e vestuário', kind: 'boutique', width: 16, depth: 14, floors: 2, color: 0x8d315c },
      { x: 50, z: 50, name: 'Concessionária de Automóveis', subtitle: 'Venda de viaturas', kind: 'car-dealer', width: 20, depth: 16, floors: 2, color: 0x315f83 },
      { x: 91, z: 21, name: 'Hotel Central', subtitle: 'Alojamento e recepção', kind: 'hotel', width: 18, depth: 16, floors: 4, color: 0x9b762d, buildingType: 'office' },
      { x: 50, z: -50, name: 'Esquadra de Polícia', subtitle: 'Polícia nacional', kind: 'police', width: 16, depth: 14, floors: 2, color: 0x24466f, buildingType: 'office' },
      { x: 91, z: 91, name: 'Hospital Municipal', subtitle: 'Urgência e consultas', kind: 'hospital', width: 20, depth: 18, floors: 3, color: 0x9d3030, buildingType: 'office' }
    ];
    const facilityKeys = new Set(facilities.map(item => item.x + ',' + item.z));

    positions.forEach((x, xi) => {
      positions.forEach((z, zi) => {
        if (Math.abs(x) < 20 && Math.abs(z) < 20) return;
        const bx = x + (xi % 2 ? 3 : -3);
        const bz = z + (zi % 2 ? 3 : -3);
        if (facilityKeys.has(bx + ',' + bz)) return;

        const floors = 1 + ((xi * 3 + zi * 5) % 5);
        const type = floors >= 4 ? 'apartment' : (xi + zi) % 3 === 0 ? 'shop' : 'house';
        const building = makeBuilding(bx, bz, type === 'shop' ? 12 : 14, 12, floors, type);
        if (type === 'shop') {
          makeFacilitySign(building, 'Loja Comercial', 'Comércio local', 0x347342, 12, 12);
        }
        if ((xi + zi) % 3 === 0) makeWallAndGate(bx + 10, bz + 5, 7, Math.PI / 2);
      });
    });

    facilities.forEach(makeNamedFacility);
    makeBuilding(-25, -25, 18, 18, 9, 'office');
    makeBuilding(25, -25, 18, 18, 11, 'office');
    makeBuilding(-25, 25, 18, 18, 7, 'apartment');
    makeBuilding(25, 25, 18, 18, 8, 'apartment');
  }

  function makePark() {
    const park = new THREE.Mesh(new THREE.BoxGeometry(25, 0.25, 25), mat.grass2);
    park.position.set(0, 0.08, 0);
    scene.add(park);
    cylinder(scene, 0, 0.2, 0, 3.4, 3.4, 0.5, mat.concrete, 24);
    cylinder(scene, 0, 0.7, 0, 2.8, 2.8, 0.15, mat.water, 24);
    cylinder(scene, 0, 0.85, 0, 0.45, 0.45, 2.1, mat.concrete, 12);
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const bench = new THREE.Group();
      box(bench, 0, 0.65, 0, 3, 0.2, 0.8, mat.trunk);
      box(bench, 0, 0.9, -0.3, 3, 0.9, 0.15, mat.trunk);
      bench.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
      bench.rotation.y = -angle;
      scene.add(bench);
    }
  }

  function makeTree(x, z, palm = false) {
    const group = new THREE.Group();
    cylinder(group, 0, 0, 0, palm ? 0.2 : 0.3, palm ? 0.35 : 0.4, palm ? 5 : 2.5, mat.trunk);
    if (palm) {
      const leaves = new THREE.MeshStandardMaterial({ color: 0x287443 });
      for (let i = 0; i < 8; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.32, 3.5, 5), leaves);
        leaf.position.set(Math.cos(i * Math.PI / 4) * 1.15, 4.9, Math.sin(i * Math.PI / 4) * 1.15);
        leaf.rotation.z = Math.cos(i * Math.PI / 4) * 1.1;
        leaf.rotation.x = Math.sin(i * Math.PI / 4) * 1.1;
        group.add(leaf);
      }
    } else {
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 7), mat.leaf);
      crown.position.y = 3.2;
      crown.scale.set(1, 1.2, 1);
      crown.castShadow = true;
      group.add(crown);
    }
    group.position.set(x, 0, z);
    scene.add(group);
  }

  function buildTrees() {
    for (let i = -100; i <= 100; i += 20) {
      makeTree(i, -12, i % 40 === 0);
      makeTree(i, 12, false);
      makeTree(-12, i, true);
      makeTree(12, i, false);
    }
    for (let i = 0; i < 22; i++) {
      const x = -95 + (i * 29) % 190;
      const z = -95 + (i * 47) % 190;
      if (Math.abs(x) < 20 || Math.abs(z) < 20) continue;
      makeTree(x, z, i % 3 === 0);
    }
  }

  function makeStreetLamp(x, z) {
    const group = new THREE.Group();
    cylinder(group, 0, 0, 0, 0.08, 0.13, 5, mat.black, 8);
    box(group, 0.35, 4.8, 0, 0.9, 0.1, 0.12, mat.black);
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.18, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffedb1, emissive: 0xffc75a, emissiveIntensity: 0.45 })
    );
    lamp.position.set(0.75, 4.75, 0);
    group.add(lamp);
    group.position.set(x, 0, z);
    scene.add(group);
  }

  function buildStreetLamps() {
    for (let i = -100; i <= 100; i += 25) {
      makeStreetLamp(-10, i);
      makeStreetLamp(10, i);
      makeStreetLamp(i, -10);
      makeStreetLamp(i, 10);
    }
  }

  function makeCar(x, z, color, rotation = 0) {
    const group = new THREE.Group();
    const body = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.45 });
    box(group, 0, 0.35, 0, 2.2, 0.65, 4.2, body);
    box(group, 0, 1, -0.25, 1.8, 0.75, 2.1, mat.glass);
    box(group, 0, 0.7, 1.25, 2, 0.2, 1.2, body);
    const wheels = new THREE.MeshStandardMaterial({ color: 0x151515 });
    for (const wx of [-1.05, 1.05]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.25, 12), wheels);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.4, wz);
        group.add(wheel);
      }
    }
    const light = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.25 });
    box(group, -0.7, 0.55, 2.12, 0.4, 0.22, 0.08, light);
    box(group, 0.7, 0.55, 2.12, 0.4, 0.22, 0.08, light);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    world.vehicles.push({ group, speed: 0, occupied: false });
    return group;
  }

  function makeMarket() {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 3.5;
      box(group, x, 0, 0, 3, 2.4, 2.8, mat.yellow);
      box(group, x, 2.4, 0, 3.4, 0.2, 3.2, mat.white);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.1, 4), new THREE.MeshStandardMaterial({ color: 0xb33d2c }));
      roof.position.set(x, 3.05, 0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      box(group, x, 0.8, 1.5, 2.6, 0.12, 0.3, mat.wood);
    }
    group.position.set(-78, 0, -25);
    scene.add(group);

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#23633d';
    ctx.fillRect(0, 0, 768, 192);
    ctx.strokeStyle = '#f4d37a';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 752, 176);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MERCADO', 384, 96);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 2.25),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    board.position.set(-78, 4.2, -22.9);
    scene.add(board);
  }

  function makeFuelStation() {
    const group = new THREE.Group();
    box(group, 0, 0, 0, 15, 0.3, 12, mat.concrete);
    box(group, 0, 4, 0, 15, 0.45, 12, mat.yellow);
    for (const x of [-6, 6]) {
      for (const z of [-4, 4]) box(group, x, 0.3, z, 0.4, 3.7, 0.4, mat.white);
    }
    for (let i = -1; i <= 1; i++) {
      box(group, i * 4, 0.3, 0, 1.1, 1.6, 0.8, mat.white);
      box(group, i * 4, 1.9, 0, 0.8, 0.4, 0.12, mat.black);
      cylinder(group, i * 4 + 0.5, 0.8, 0.5, 0.035, 0.035, 0.8, mat.black, 6);
    }
    group.position.set(78, 0, -35);
    scene.add(group);

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d8a323';
    ctx.fillRect(0, 0, 768, 192);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 752, 176);
    ctx.fillStyle = '#17242a';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('POSTO DE COMBUSTÍVEL', 384, 96);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2.6),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
    );
    board.position.set(78, 5.5, -28.7);
    scene.add(board);
  }

  function makeCoast() {
    box(scene, -116, -0.3, 0, 12, 0.25, 230, mat.sand);
    box(scene, -128, -0.4, 0, 14, 0.25, 260, mat.water);
    box(scene, -108, 0, 0, 3, 0.25, 230, mat.sidewalk);
    for (let z = -100; z <= 100; z += 18) makeTree(-106, z, true);
    for (let z = -105; z <= 105; z += 5) box(scene, -110, 0.4, z, 0.12, 0.8, 0.12, mat.metal);
    box(scene, -110, 0.8, 0, 0.15, 0.12, 220, mat.metal);
  }

  addGround();
  makeCoast();
  buildRoadNetwork();
  buildCityBlocks();
  makePark();
  buildTrees();
  buildStreetLamps();
  makeMarket();
  makeFuelStation();
  createPeople(scene, world);
  makeCar(5, 25, 0xc62828, 0);
  makeCar(-42, 35, 0xeeeeee, Math.PI / 2);
  makeCar(55, -70, 0x2255aa, Math.PI / 2);
  makeCar(-72, 70, 0x252525, 0);

  return world;
}
