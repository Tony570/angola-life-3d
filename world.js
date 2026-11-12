import * as THREE from 'three';

export function createWorld(scene) {
  // --- 1. ILUMINAÇÃO (Céu, Luz Solar e Ambientação) ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  sunLight.position.set(50, 80, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 250;
  const d = 60;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  // --- 2. TERRENO / CHÃO BASE (Zona urbana de Luanda) ---
  const groundGeo = new THREE.PlaneGeometry(300, 300);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x2a303c,
    roughness: 0.9 
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- 3. ESTRADAS PRINCIPAIS (Cruzamento estrutural) ---
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1c23, roughness: 0.8 });
  
  // Avenida Principal (Eixo Norte-Sul)
  const roadNorthSouth = new THREE.Mesh(new THREE.PlaneGeometry(16, 300), roadMat);
  roadNorthSouth.rotation.x = -Math.PI / 2;
  roadNorthSouth.position.y = 0.01;
  scene.add(roadNorthSouth);

  // Avenida Transversal (Eixo Este-Oeste)
  const roadEastWest = new THREE.Mesh(new THREE.PlaneGeometry(300, 16), roadMat);
  roadEastWest.rotation.x = -Math.PI / 2;
  roadEastWest.position.y = 0.02;
  scene.add(roadEastWest);

  // --- 4. EDÍFICIOS REPRESENTATIVOS DO CENTRO DE LUANDA ---
  const buildingColors = [0x5c677d, 0x3b4252, 0x4c566a, 0x81a1c1, 0x2e3440];
  
  // Função para criar blocos de edifícios urbanos funcionais
  function createBuilding(x, z, width, depth, height, colorIndex = 0) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: buildingColors[colorIndex % buildingColors.length],
      roughness: 0.4,
      metalness: 0.2
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    return building;
  }

  // Blocos urbanos ao redor das avenidas principais
  const blockSize = 25;
  const gap = 8;
  const gridRange = 3;

  for (let x = -gridRange; x <= gridRange; x++) {
    for (let z = -gridRange; z <= gridRange; z++) {
      // Ignorar o cruzamento central das estradas
      if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue;

      const posX = x * (blockSize + gap);
      const posZ = z * (blockSize + gap);
      const height = 15 + Math.abs(Math.sin(x * z) * 35); // Alturas variadas para realismo

      createBuilding(posX, posZ, blockSize, blockSize, height, x + z);
    }
  }

  // --- 5. MARCO DE REFERÊNCIA (Praça / Centro de Luanda) ---
  const plazaGeo = new THREE.CylinderGeometry(8, 8, 0.1, 32);
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0x88c0d0 });
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.set(0, 0.03, 0);
  scene.add(plaza);
}
