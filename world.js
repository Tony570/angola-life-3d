import * as THREE from 'three';
import { createPeople } from './people.js';

// ANGOLA LIFE 3D — cidade de Luanda
export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    buildings: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
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
    glass: new THREE.MeshStandardMaterial({
      color: 0x769eaa, roughness: 0.25, metalness: 0.15,
      transparent: true, opacity: 0.72
    }),
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

  const buildingColors = [
    0xe5c49a, 0xd8a77f, 0xf0dfbd, 0xc9b7a0, 0xe2d3b9, 0xd4a18c,
    0xc8c4ad, 0xe9d7b5, 0xbfa58c, 0xd5c6a8, 0xc5a68d, 0xe2cdb0
  ];
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

  function variation(x, z, seed = 1) {
    const value = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  // Texturas geradas uma única vez e reutilizadas em todas as ruas.
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
      // Pequenas fissuras e manchas subtis no asfalto.
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
      // Manchas de reparação do pavimento.
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(12,13,14,${0.025 + random() * 0.035})`;
        ctx.fillRect(random() * 230, random() * 250, 8 + random() * 24, 4 + random() * 12);
      }
    } else {
      // Juntas de blocos de passeio desenhadas na própria textura.
      ctx.strokeStyle = 'rgba(65,62,56,0.22)';
      ctx.lineWidth = 1;
      for (let p = 0; p <= 256; p += 32) {
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 256); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(256, p); ctx.stroke();
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

  // Terreno
  function addGround() {
    box(scene, 0, -1.2, 0, 260, 1, 260, mat.grass);
    for (let i = 0; i < 28; i++) {
      const x = -115 + (i * 37) % 230;
      const z = -110 + (i * 61) % 220;
      box(scene, x, -0.12, z, 12, 0.12, 12, mat.grass2);
    }
  }

  // Rede viária: poucos meshes por troço, com passeios, lancis, sarjetas e juntas.
  function makeRoad(x, z, width, length, horizontal = true) {
    makeRoadPlane(x, z, width, length, horizontal, asphaltSurface, 0.025);

    const sidewalkWidth = 2.6;
    const sidewalkOffset = width / 2 + sidewalkWidth / 2 + 0.12;
    const curbOffset = width / 2 + 0.13;
    const curbGeometry = new THREE.BoxGeometry(horizontal ? length : 0.24, 0.18, horizontal ? 0.24 : length);

    for (const side of [-1, 1]) {
      const sx = horizontal ? x : x + side * sidewalkOffset;
      const sz = horizontal ? z + side * sidewalkOffset : z;
      makeRoadPlane(sx, sz, horizontal ? length : sidewalkWidth, horizontal ? sidewalkWidth : length,
        horizontal, sidewalkSurface, 0.052);

      const curb = new THREE.Mesh(curbGeometry, mat.sidewalkDark);
      curb.position.set(horizontal ? x : x + side * curbOffset, 0.09,
        horizontal ? z + side * curbOffset : z);
      curb.receiveShadow = false;
      curb.castShadow = false;
      scene.add(curb);

      // Sarjeta escura fina entre asfalto e lancil.
      const gutter = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? length : 0.16, 0.025, horizontal ? 0.16 : length),
        gutterMaterial
      );
      gutter.position.set(horizontal ? x : x + side * (width / 2 - 0.04), 0.043,
        horizontal ? z + side * (width / 2 - 0.04) : z);
      scene.add(gutter);
    }

    // Juntas e pequenas tampas de drenagem instanciadas, sem criar um mesh por bloco.
    const tilePositions = [];
