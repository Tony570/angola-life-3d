
import * as THREE from 'three';

export function createWorld(scene) {
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 130, 420);

  scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x806044, 2));

  const sun = new THREE.DirectionalLight(0xffedcf, 2.2);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const material = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  function box(x, y, z, w, h, d, color, parent = scene) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material(color)
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Terreno
  box(0, -0.3, 0, 500, 0.5, 500, 0xc5a477);

  // Estradas
  const roadMat = material(0x30343a);
  const roads = [];

  function road(x, z, w, d) {
    const r = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.12, d),
      roadMat
    );
    r.position.set(x, 0.02, z);
    scene.add(r);
    roads.push(r);
  }

  road(0, 0, 18, 420);
  road(0, 0, 420, 18);

  for (let p = -180; p <= 180; p += 60) {
    if (p !== 0) {
      road(p, 0, 12, 420);
      road(0, p, 420, 12);
    }
  }

  // Marcas rodoviárias
  const lineMat = material(0xf5e8b2);

  for (let p = -195; p <= 195; p += 12) {
    for (const x of [-4, 4]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.03, 5),
        lineMat
      );
      line.position.set(x, 0.1, p);
      scene.add(line);
    }

    for (const z of [-4, 4]) {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.03, 0.18),
        lineMat
      );
      line.position.set(p, 0.1, z);
      scene.add(line);
    }
  }

  // Passeios
  for (let p = -180; p <= 180; p += 60) {
    for (const side of [-1, 1]) {
      box(p + side * 9, 0.13, 0, 3, 0.2, 420, 0xb5a99a);
      box(0, 0.13, p + side * 9, 420, 0.2, 3, 0xb5a99a);
    }
  }

  // Edifícios
  const colors = [
    0xe2b17d, 0xd9c2a0, 0xe8d6b9,
    0xc98256, 0xd8d0bd, 0xb8c6c5,
    0xe9c58c
  ];

  function building(x, z, w, d, h, color) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material(color)
    );
    body.position.y = h / 2;
    body.castShadow = true;
    group.add(body);

    // Janelas
    const windowMat = material(0x304e60);

    for (let y = 2.2; y < h - 1; y += 3) {
      for (let a = -w / 2 + 1.3; a < w / 2 - 0.5; a += 2.5) {
        const win = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 1.2, 0.08),
          windowMat
        );
        win.position.set(a, y, d / 2 + 0.05);
        group.add(win);

        const win2 = win.clone();
        win2.position.z = -d / 2 - 0.05;
        group.add(win2);
      }
    }

    // Telhado
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.5, 0.25, d + 0.5),
      material(0x8d5c42)
    );
    roof.position.y = h + 0.12;
    group.add(roof);

    group.position.set(x, 0, z);
    scene.add(group);
  }

  for (let x = -180; x <= 180; x += 60) {
    for (let z = -180; z <= 180; z += 60) {
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;

      building(
        x + 20, z + 20,
        18, 18,
        8 + Math.random() * 25,
        colors[Math.floor(Math.random() * colors.length)]
      );

      building(
        x - 20, z - 20,
        15, 15,
        6 + Math.random() * 12,
        colors[Math.floor(Math.random() * colors.length)]
      );
    }
  }

  // Árvores
  const trees = [];

  function tree(x, z) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, 3, 8),
      material(0x76502e)
    );
    trunk.position.y = 1.5;
    group.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 10, 8),
      material(0x347c3b)
    );
    leaves.position.y = 4;
    leaves.castShadow = true;
    group.add(leaves);

    group.position.set(x, 0, z);
    scene.add(group);
    trees.push(group);
  }

  for (let p = -180; p <= 180; p += 25) {
    tree(p, 12);
    tree(p, -12);
    tree(12, p);
    tree(-12, p);
  }

  // Carros
  const vehicles = [];

  function createCar(x, z, color) {
    const group = new THREE.Group();

    const paint = material(color, 0.35);

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.75, 4.2),
      paint
    );
    chassis.position.y = 0.9;
    chassis.castShadow = true;
    group.add(chassis);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.85, 2.1),
      material(0x344c5b, 0.3)
    );
    cabin.position.set(0, 1.65, -0.15);
    group.add(cabin);

    const wheels = [];

    for (const wx of [-1.15, 1.15]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.43, 0.43, 0.25, 16),
          material(0x171717)
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.45, wz);
        group.add(wheel);
        wheels.push(wheel);
      }
    }

    group.position.set(x, 0, z);
    scene.add(group);

    const vehicle = {
      group,
      wheels,
      speed: 0,
      occupied: false
    };

    vehicles.push(vehicle);
    return vehicle;
  }

  createCar(3, 24, 0xd32f2f);
  createCar(-3, 70, 0xffffff);
  createCar(3, -65, 0x202c43);
  createCar(60, 3, 0xe3b329);
  createCar(-65, -3, 0xeeeeee);

  // Moradores com aparência humana
  const pedestrians = [];

  function createPerson(x, z, skin, shirt, pants) {
    const group = new THREE.Group();

    function sphere(radius, color, x, y, z) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 12, 10),
        material(color)
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      group.add(mesh);
      return mesh;
    }

    function limb(radiusTop, radiusBottom, height, color, x, y, z) {
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(radiusTop, height, 5, 8),
        material(color)
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      group.add(mesh);
      return mesh;
    }

    sphere(0.34, skin, 0, 1.65, 0);
    sphere(0.13, skin, 0, 2.15, 0);

    // Tronco
    limb(0.28, 0.28, 0.45, shirt, 0, 1.05, 0);

    // Braços
    const leftArm = limb(0.09, 0.09, 0.42, skin, -0.38, 1.05, 0);
    const rightArm = limb(0.09, 0.09, 0.42, skin, 0.38, 1.05, 0);

    // Pernas
    const leftLeg = limb(0.12, 0.12, 0.55, pants, -0.15, 0.42, 0);
    const rightLeg = limb(0.12, 0.12, 0.55, pants, 0.15, 0.42, 0);

    group.position.set(x, 0, z);
    scene.add(group);

    pedestrians.push({
      group,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      originX: x,
      originZ: z,
      phase: Math.random() * 6,
      direction: Math.random() * Math.PI * 2
    });
  }

  const skins = [0x8b5236, 0x603b2c, 0xb77a52];
  const shirts = [0x1e88e5, 0xe6b33d, 0xececec, 0x34844b];
  const pants = [0x303b4d, 0x454545, 0x222222];

  for (let i = 0; i < 24; i++) {
    createPerson(
      -20 + Math.random() * 40,
      -90 + Math.random() * 180,
      skins[i % skins.length],
      shirts[i % shirts.length],
      pants[i % pants.length]
    );
  }

  // Praça central
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 10, 0.3, 32),
    material(0xd2b48c)
  );
  plaza.position.set(0, 0.2, 0);
  scene.add(plaza);

  return { vehicles, pedestrians };
}
