import * as THREE from 'three';

export function createWorld(scene) {
  const world = {
    vehicles: [],
    npcs: [],
    destinations: [
      { name: 'Praça da Cidade', x: 0, z: 0 },
      { name: 'Centro de Luanda', x: 35, z: -35 },
      { name: 'Zona Comercial', x: -40, z: -35 },
      { name: 'Bairro Residencial', x: 40, z: 40 },
      { name: 'Marginal', x: -35, z: 40 }
    ]
  };

  const mat = (color, roughness = 0.85) =>
    new THREE.MeshStandardMaterial({ color, roughness });

  const groundMat = mat('#b7a58a');
  const roadMat = mat('#34383d');
  const sidewalkMat = mat('#aaa49a');
  const buildingMats = [
    mat('#d8b58b'), mat('#c98762'), mat('#e4d6bd'),
    mat('#b7b9ae'), mat('#d5c29d'), mat('#bd8067')
  ];
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#83b7c9',
    metalness: 0.25,
    roughness: 0.2
  });

  function addBox(x, y, z, w, h, d, material, parent = scene) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      material
    );
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Terreno
  addBox(0, -0.7, 0, 240, 1, 240, groundMat);

  // Estradas principais
  addBox(0, 0, 0, 15, 0.12, 220, roadMat);
  addBox(0, 0, 0, 220, 0.12, 15, roadMat);

  // Estradas secundárias
  for (const p of [-75, -38, 38, 75]) {
    addBox(p, 0.02, 0, 8, 0.12, 220, roadMat);
    addBox(0, 0.02, p, 220, 0.12, 8, roadMat);
  }

  // Passeios
  for (const p of [-9, 9]) {
    addBox(p, 0.08, 0, 2, 0.2, 220, sidewalkMat);
    addBox(0, 0.08, p, 220, 0.2, 2, sidewalkMat);
  }

  // Linhas centrais das estradas
  const lineMat = mat('#e8d58c');
  for (let i = -100; i <= 100; i += 8) {
    addBox(0, 0.08, i, 0.22, 0.025, 3, lineMat);
    addBox(i, 0.08, 0, 3, 0.025, 0.22, lineMat);
  }

  // Edifícios e casas
  const blocks = [-92, -55, -20, 20, 55, 92];

  for (const x of blocks) {
    for (const z of blocks) {
      if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;

      const w = 12 + Math.random() * 8;
      const d = 12 + Math.random() * 8;
      const h = 5 + Math.random() * 20;
      const color = buildingMats[
        Math.floor(Math.random() * buildingMats.length)
      ];

      addBox(x, 0.15, z, w, h, d, color);

      // Janelas na fachada frontal
      const rows = Math.max(1, Math.floor(h / 3));
      for (let r = 0; r < rows; r++) {
        for (let c = -1; c <= 1; c++) {
          addBox(
            x + c * 3,
            1.2 + r * 2.6,
            z + d / 2 + 0.015,
            1.35, 1.1, 0.06,
            windowMat
          );
        }
      }

      // Porta
      addBox(x, 0.15, z + d / 2 + 0.05, 1.5, 2.3, 0.12, mat('#65432e'));
    }
  }

  // Praça central
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(11, 32),
    mat('#c8b99e')
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.08;
  scene.add(plaza);

  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3.5, 1, 24),
    mat('#9eb8bd')
  );
  fountain.position.set(0, 0.6, 0);
  scene.add(fountain);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.12, 24),
    mat('#4b9eae')
  );
  water.position.set(0, 1.15, 0);
  scene.add(water);

  // Árvores
  function makeTree(x, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.4, 2.5, 7),
      mat('#765039')
    );
    trunk.position.set(x, 1.25, z);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 8, 7),
      mat('#397849')
    );
    leaves.position.set(x, 3.1, z);
    leaves.scale.y = 1.15;
    leaves.castShadow = true;
    scene.add(leaves);
  }

  for (let i = -90; i <= 90; i += 18) {
    makeTree(i, -12);
    makeTree(i, 12);
    makeTree(-12, i);
    makeTree(12, i);
  }

  // Veículos
  function makeCar(x, z, color, rotation = 0) {
    const car = new THREE.Group();
    car.position.set(x, 0.15, z);
    car.rotation.y = rotation;

    const bodyMat = mat(color);
    const dark = mat('#20252a');
    const glass = mat('#8bb7c6');

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.85, 4.2),
      bodyMat
    );
    body.position.y = 0.9;
    body.castShadow = true;
    car.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.8, 2.1),
      glass
    );
    cabin.position.set(0, 1.65, -0.2);
    car.add(cabin);

    for (const wx of [-1.08, 1.08]) {
      for (const wz of [-1.35, 1.35]) {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12),
          dark
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.55, wz);
        car.add(wheel);
      }
    }

    const headlightMat = mat('#fff0b0');
    addBox(0.7, 0.85, 2.1, 0.35, 0.25, 0.08, headlightMat, car);
    addBox(-0.7, 0.85, 2.1, 0.35, 0.25, 0.08, headlightMat, car);

    scene.add(car);
    world.vehicles.push({
      group: car,
      speed: 0,
      occupied: false
    });
  }

  makeCar(5, 25, '#c7352d');
  makeCar(-5, -25, '#e2e0d7');
  makeCar(25, 5, '#245b9a', Math.PI / 2);
  makeCar(-25, -5, '#d6a52e', Math.PI / 2);

  // Pessoas low-poly
  function makePerson(x, z, color) {
    const person = new THREE.Group();
    person.position.set(x, 0, z);

    const skin = mat('#925f42');
    const clothes = mat(color);
    const pants = mat('#303746');

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.65, 3, 7),
      clothes
    );
    torso.position.y = 1.15;
    person.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 10, 8),
      skin
    );
    head.position.y = 1.95;
    person.add(head);

    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.55, 3, 6),
        pants
      );
      leg.position.set(side * 0.16, 0.42, 0);
      person.add(leg);

      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.48, 3, 6),
        clothes
      );
      arm.position.set(side * 0.42, 1.15, 0);
      arm.rotation.z = side * -0.15;
      person.add(arm);
    }

    scene.add(person);
    world.npcs.push({
      group: person,
      originX: x,
      originZ: z,
      phase: Math.random() * Math.PI * 2
    });
  }

  const npcColors = ['#b84b38', '#236a9b', '#d6a33c', '#49815b'];
  for (let i = 0; i < 18; i++) {
    makePerson(
      -30 + Math.random() * 60,
      -30 + Math.random() * 60,
      npcColors[i % npcColors.length]
    );
  }

  return world;
}
