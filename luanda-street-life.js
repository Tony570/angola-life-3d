import * as THREE from 'three';

export function createLuandaStreetLife(scene, world) {
  const mat = (color, roughness = 0.8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const asphalt = mat(0x252a2d, 0.98);
  const paint = mat(0xe9e4d6, 0.85);
  const yellow = mat(0xe4bd4e, 0.8);
  const concrete = mat(0xb7b4aa);
  const metal = mat(0x4a5358, 0.42, 0.7);
  const dark = mat(0x202629, 0.7, 0.2);
  const leaf = mat(0x28633d);
  const leafLight = mat(0x47834b);
  const trunk = mat(0x805638);
  const glass = new THREE.MeshStandardMaterial({
    color: 0xffe5a0, emissive: 0xffbd55, emissiveIntensity: 0.65,
    roughness: 0.35
  });

  const addBox = (parent, x, y, z, w, h, d, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y + h / 2, z);
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (parent, x, y, z, rTop, rBottom, h, material, segments = 10) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, h, segments),
      material
    );
    mesh.position.set(x, y + h / 2, z);
    parent.add(mesh);
    return mesh;
  };

  function streetLamp(x, z, rotation = 0) {
    const group = new THREE.Group();
    addCylinder(group, 0, 0, 0, 0.09, 0.15, 6.7, metal, 8);
    addCylinder(group, 0, 0, 0, 0.28, 0.28, 0.22, concrete, 8);
    const arm = addBox(group, 0.65, 6.45, 0, 1.35, 0.1, 0.1, metal);
    arm.rotation.z = -0.12;
    addBox(group, 1.22, 6.22, 0, 0.62, 0.16, 0.34, dark);
    addBox(group, 1.22, 6.13, 0, 0.48, 0.035, 0.23, glass);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  function palm(x, z, scale = 1) {
    const group = new THREE.Group();
    addCylinder(group, 0, 0, 0, 0.18 * scale, 0.34 * scale, 5.3 * scale, trunk, 9);
    for (let i = 0; i < 9; i++) {
      const angle = i * Math.PI * 2 / 9;
      const length = (2.2 + (i % 3) * 0.25) * scale;
      const frond = new THREE.Mesh(
        new THREE.ConeGeometry(0.22 * scale, length, 5),
        i % 2 ? leaf : leafLight
      );
      frond.position.set(
        Math.cos(angle) * 1.05 * scale,
        5.0 * scale - 0.35 * scale,
        Math.sin(angle) * 1.05 * scale
      );
      frond.rotation.z = -Math.PI / 2.7;
      frond.rotation.y = -angle;
      group.add(frond);
    }
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.32 * scale, 7, 6),
      leaf
    );
    crown.position.y = 5.05 * scale;
    group.add(crown);
    group.position.set(x, 0, z);
    scene.add(group);
  }

  function utilityPole(x, z) {
    const group = new THREE.Group();
    addCylinder(group, 0, 0, 0, 0.12, 0.18, 8.5, trunk, 8);
    addBox(group, -0.9, 7.8, 0, 1.9, 0.13, 0.14, metal);
    for (const dx of [-0.7, 0, 0.7]) {
      addCylinder(group, dx, 7.8, 0, 0.035, 0.035, 0.65, metal, 6);
    }
    group.position.set(x, 0, z);
    scene.add(group);
  }

  function trafficLight(x, z, rotation = 0) {
    const group = new THREE.Group();
    addCylinder(group, 0, 0, 0, 0.07, 0.09, 3.6, metal, 8);
    addBox(group, 0, 2.7, 0, 0.48, 1.15, 0.38, dark);
    for (let i = 0; i < 3; i++) {
      const colors = [0xc83e35, 0xe6b83e, 0x3d9b58];
      const bulb = new THREE.MeshStandardMaterial({
        color: colors[i], emissive: colors[i], emissiveIntensity: 0.3
      });
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), bulb);
      light.position.set(0, 3.05 - i * 0.34, 0.21);
      group.add(light);
    }
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  function crosswalk(x, z, horizontal = true) {
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? 0.72 : 6.2, 0.035, horizontal ? 6.2 : 0.72),
        paint
      );
      stripe.position.set(x + (horizontal ? i * 1.05 : 0), 0.045,
        z + (horizontal ? 0 : i * 1.05));
      scene.add(stripe);
    }
    for (const side of [-1, 1]) {
      const stop = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? 0.22 : 6.5, 0.035, horizontal ? 6.5 : 0.22),
        yellow
      );
      stop.position.set(x + (horizontal ? side * 5.2 : 0), 0.05,
        z + (horizontal ? 0 : side * 5.2));
      scene.add(stop);
    }
  }

  function busStop(x, z, rotation = 0) {
    const group = new THREE.Group();
    addBox(group, 0, 0, 0, 5.8, 0.18, 1.9, concrete);
    addBox(group, 0, 2.25, -0.72, 5.8, 0.16, 0.12, metal);
    addBox(group, -2.75, 0.2, -0.72, 0.12, 2.1, 0.12, metal);
    addBox(group, 2.75, 0.2, -0.72, 0.12, 2.1, 0.12, metal);
    addBox(group, 0, 2.12, -0.72, 5.8, 0.12, 1.9, yellow);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.55),
      new THREE.MeshStandardMaterial({ color: 0x8ab5bc, transparent: true, opacity: 0.65 })
    );
    panel.position.set(-2.65, 1.15, -0.65);
    group.add(panel);
    addBox(group, 0, 0.48, 0.35, 3.8, 0.12, 0.65, trunk);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  function streetBin(x, z) {
    const group = new THREE.Group();
    addCylinder(group, 0, 0, 0, 0.38, 0.32, 0.85, mat(0x315e4b), 10);
    addCylinder(group, 0, 0.82, 0, 0.4, 0.4, 0.12, dark, 10);
    group.position.set(x, 0, z);
    scene.add(group);
  }

  function bench(x, z, rotation = 0) {
    const group = new THREE.Group();
    addBox(group, 0, 0.55, 0, 2.2, 0.14, 0.62, trunk);
    addBox(group, 0, 1.05, -0.25, 2.2, 0.95, 0.12, trunk);
    for (const dx of [-0.82, 0.82]) {
      addBox(group, dx, 0, 0, 0.12, 0.55, 0.12, metal);
    }
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
  }

  // Árvores e iluminação em corredores urbanos, mantendo livres as entradas.
  const avenues = [
    [-300, -410, -115, -195], [-115, -195, 0, 0], [0, 0, 155, 35],
    [155, 35, 225, 285], [225, 285, 405, 365], [0, 0, 5, 235],
    [5, 235, -115, 350], [-115, 350, -330, 385], [-330, 385, -465, 185],
    [0, 0, 105, -125], [105, -125, 265, -235], [265, -235, 355, -95],
    [355, -95, 390, 165], [390, 165, 405, 365], [-105, -390, -300, -410],
    [-65, 515, -115, 350]
  ];

  avenues.forEach(([x1, z1, x2, z2], index) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const nx = -dz / length;
    const nz = dx / length;
    const count = Math.max(2, Math.floor(length / 62));
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const x = x1 + dx * t;
      const z = z1 + dz * t;
      for (const side of [-1, 1]) {
        const px = x + nx * side * 12.5;
        const pz = z + nz * side * 12.5;
        if ((index + i + (side > 0 ? 1 : 0)) % 2 === 0) {
          streetLamp(px, pz, Math.atan2(dx, dz));
        } else {
          palm(px, pz, 0.82 + ((index + i) % 3) * 0.08);
        }
      }
    }
  });

  // Passadeiras, semáforos e paragens nas zonas de maior circulação.
  const crossings = [
    [0, 0, true], [155, 35, false], [225, 285, true],
    [390, 165, false], [-115, -195, true], [-330, 385, false],
    [5, 235, true], [105, -125, false]
  ];
  crossings.forEach(([x, z, horizontal]) => {
    crosswalk(x, z, horizontal);
    trafficLight(x + (horizontal ? 7 : 0), z + (horizontal ? 0 : 7),
      horizontal ? 0 : Math.PI / 2);
  });

  [
    [-210, -300], [110, 110], [330, 220], [-300, 420],
    [-95, 480], [420, 365], [280, -300], [-430, 160]
  ].forEach(([x, z]) => utilityPole(x, z));

  busStop(-92, -178, 0.5);
  busStop(245, 300, -0.15);
  busStop(375, 185, 0.15);
  busStop(-300, 405, -0.7);

  [
    [-25, 16], [22, 16], [-330, -105], [-350, -105],
    [395, 230], [375, 230], [-90, 430], [-65, 430]
  ].forEach(([x, z]) => streetBin(x, z));

  [
    [-35, 19, 0], [35, 19, 0], [-350, -95, 0],
    [410, 235, 0], [-90, 445, 0]
  ].forEach(([x, z, rotation]) => bench(x, z, rotation));

  // Pequenas ilhas ajardinadas em pontos de encontro.
  const gardenMat = mat(0x557a45);
  [[-15, 18], [18, 18], [175, 58], [210, 305], [-305, 410]].forEach(([x, z]) => {
    const island = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.18, 12), gardenMat);
    island.position.set(x, 0.04, z);
    scene.add(island);
    palm(x, z, 0.72);
  });

  // Parque da Cidade: relvado, caminhos, bancos, palmeiras e fonte central.
  const park = new THREE.Group();
  const lawn = mat(0x477b43, 0.96);
  const path = mat(0xd0c5ad, 0.92);
  const water = new THREE.MeshStandardMaterial({ color: 0x38a7bb, roughness: 0.22, metalness: 0.12 });
  addBox(park, 0, 0.02, 0, 54, 0.12, 42, lawn);
  addBox(park, 0, 0.09, 0, 3.4, 0.08, 42, path);
  addBox(park, 0, 0.09, 0, 54, 0.08, 3.4, path);
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.42, 24), concrete);
  fountainBase.position.set(0, 0.25, 0);
  park.add(fountainBase);
  const fountainWater = new THREE.Mesh(new THREE.CylinderGeometry(3.75, 3.75, 0.12, 24), water);
  fountainWater.position.set(0, 0.52, 0);
  park.add(fountainWater);
  addCylinder(park, 0, 0.58, 0, 0.35, 0.55, 2.2, concrete, 12);
  for (const [x,z] of [[-21,-15],[21,-15],[-21,15],[21,15],[-12,0],[12,0]]) {
    bench(205 + x, 305 + z, 0);
    palm(205 + x + 3.2, 305 + z + 1.8, 0.72);
  }
  park.position.set(205, 0, 305);
  scene.add(park);
  world.destinations.push({ name:'Parque da Cidade', x:205, z:305, category:'lazer' });

  // Passeio da Marginal da Ilha: calçadão, guarda-corpos e iluminação costeira.
  const waterfront = new THREE.Group();
  const promenade = mat(0xd4c9b5, 0.92);
  addBox(waterfront, 0, 0.04, 0, 110, 0.18, 13, promenade);
  addBox(waterfront, 0, 0.28, -6.2, 110, 0.48, 0.18, metal);
  for (let x = -50; x <= 50; x += 10) {
    addBox(waterfront, x, 0.18, -6.2, 0.12, 0.9, 0.12, metal);
    bench(-430 + x, -20 + 2.5, 0);
    streetLamp(-430 + x, -20 + 5.5, Math.PI);
  }
  waterfront.position.set(-430, 0, -20);
  scene.add(waterfront);
  world.destinations.push({ name:'Marginal da Ilha de Luanda', x:-430, z:-20, category:'lazer' });

  world.streetLife = true;
  world.publicSpaces = ['Parque da Cidade', 'Marginal da Ilha de Luanda'];
  return world;
}
