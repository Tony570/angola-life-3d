// Realismo visual de Angola Life 3D.
// Fotografias reais de Luanda usadas em painéis de referência no cenário; créditos em assets/PHOTO_CREDITS.md.
export function applyCityRealism({ THREE, target, scene, compactDevice = false }) {
  if (!target || target.userData.cityRealismApplied) return;
  target.userData.cityRealismApplied = true;

  const makeMat = (color, roughness = 0.9, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const addBox = (w, h, d, material, x, y, z, parent = target) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Asfalto com variação procedural, sem depender de downloads de texturas.
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 512;
  asphaltCanvas.height = 512;
  const ctx = asphaltCanvas.getContext('2d');
  ctx.fillStyle = '#353a3b';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 78321;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 12500; i++) {
    const value = random();
    ctx.fillStyle = value > 0.52 ? 'rgba(205,205,194,.12)' : 'rgba(8,12,13,.2)';
    const radius = 0.25 + random() * 1.55;
    ctx.beginPath();
    ctx.arc(random() * 512, random() * 512, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 45; i++) {
    ctx.fillStyle = 'rgba(18,22,23,.12)';
    ctx.fillRect(random() * 512, random() * 512, 8 + random() * 40, 1 + random() * 3);
  }
  const asphaltTexture = new THREE.CanvasTexture(asphaltCanvas);
  asphaltTexture.colorSpace = THREE.SRGBColorSpace;
  asphaltTexture.wrapS = THREE.RepeatWrapping;
  asphaltTexture.wrapT = THREE.RepeatWrapping;
  asphaltTexture.repeat.set(2, 18);
  const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTexture, color: '#d1d0c9', roughness: 0.98 });
  asphalt.name = 'AngolaLifeAsphalt';
  const concrete = makeMat('#aaa99f', 0.96);
  const curb = makeMat('#d2cfc4', 0.95);
  const whitePaint = makeMat('#eee9dc', 0.9);
  const yellowPaint = makeMat('#d9b64e', 0.88);

  // Camadas de asfalto e passeios na malha urbana de Angola.
  const streets = [-70, -42, -14, 14, 42, 70];
  const roadWidth = value => Math.abs(value) === 70 || value === 14 ? 8.2 : 6.4;
  streets.forEach(x => {
    const width = roadWidth(x);
    addBox(width, 0.028, 144, asphalt, x, -0.029, 0);
    for (const side of [-1, 1]) {
      const edge = width / 2 + 0.48;
      addBox(0.92, 0.1, 144, concrete, x + side * edge, -0.015, 0);
      addBox(0.14, 0.16, 144, curb, x + side * (width / 2 + 0.02), 0.015, 0);
    }
  });
  streets.forEach(z => {
    const width = roadWidth(z);
    addBox(144, 0.028, width, asphalt, 0, -0.029, z);
    for (const side of [-1, 1]) {
      const edge = width / 2 + 0.48;
      addBox(144, 0.1, 0.92, concrete, 0, -0.015, z + side * edge);
      addBox(144, 0.16, 0.14, curb, 0, 0.015, z + side * (width / 2 + 0.02));
    }
  });

  // Marcas rodoviárias instanciadas: leves para telemóveis e computadores.
  const dashGeometry = new THREE.BoxGeometry(0.12, 0.022, 2.25);
  const dashInstances = new THREE.InstancedMesh(dashGeometry, yellowPaint, 240);
  const dummy = new THREE.Object3D();
  let dashCount = 0;
  for (const x of streets) {
    for (let z = -66; z <= 66; z += 8) {
      if (streets.some(cross => Math.abs(z - cross) < 5)) continue;
      dummy.position.set(x, -0.006, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      dashInstances.setMatrixAt(dashCount++, dummy.matrix);
    }
  }
  dashInstances.count = dashCount;
  dashInstances.instanceMatrix.needsUpdate = true;
  target.add(dashInstances);

  const crossGeometry = new THREE.BoxGeometry(0.28, 0.024, 2.3);
  const crossInstances = new THREE.InstancedMesh(crossGeometry, whitePaint, 160);
  let crossCount = 0;
  for (const x of [-42, -14, 14, 42]) {
    for (const z of [-42, -14, 14, 42]) {
      for (let stripe = -3; stripe <= 3; stripe++) {
        dummy.position.set(x + stripe * 0.48, -0.004, z - 5.05);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        crossInstances.setMatrixAt(crossCount++, dummy.matrix);
      }
    }
  }
  crossInstances.count = crossCount;
  crossInstances.instanceMatrix.needsUpdate = true;
  target.add(crossInstances);

  // Palmeiras de porte natural para os passeios e pequenos jardins.
  const palmTrunk = makeMat('#79553a', 1);
  const palmLeaf = makeMat('#356d3d', 0.94);
  const palmLeafLight = makeMat('#54874a', 0.95);
  const bladeGeometry = new THREE.ConeGeometry(0.12, 0.95, 5);
  const bladeInstances = new THREE.InstancedMesh(bladeGeometry, palmLeafLight, 252);
  const bladeDummy = new THREE.Object3D();
  let bladeCount = 0;
  const addPalm = (x, z, scale = 1) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.19 * scale, 0.29 * scale, 5.1 * scale, 9), palmTrunk);
    trunk.position.set(x, 2.55 * scale, z);
    trunk.castShadow = true;
    target.add(trunk);
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x, 4.75 * scale, z),
        new THREE.Vector3(x + dx * 1.55 * scale, 5.5 * scale, z + dz * 1.55 * scale),
        new THREE.Vector3(x + dx * 3.0 * scale, 3.95 * scale, z + dz * 3.0 * scale)
      );
      const frond = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.075 * scale, 5, false), i % 2 ? palmLeaf : palmLeafLight);
      frond.castShadow = true;
      target.add(frond);
      for (let leaf = 1; leaf <= 3; leaf++) {
        const t = leaf / 4;
        bladeDummy.position.copy(curve.getPoint(t));
        bladeDummy.scale.setScalar(scale);
        bladeDummy.rotation.set(0.2 + t * 0.8, -angle, Math.PI / 2 + (t - 0.4) * 0.75);
        bladeDummy.updateMatrix();
        bladeInstances.setMatrixAt(bladeCount++, bladeDummy.matrix);
      }
    }
  };
  [
    [-78, -48, 0.9], [-78, 48, 0.9], [78, -48, 0.9], [78, 48, 0.9],
    [-48, -78, 0.9], [48, -78, 0.9], [-48, 78, 0.9], [48, 78, 0.9],
    [133, -64, 1.0], [133, 64, 1.0], [285, -62, 1.0], [245, 110, 0.9]
  ].forEach(([x, z, scale]) => addPalm(x, z, scale));
  bladeInstances.count = bladeCount;
  bladeInstances.instanceMatrix.needsUpdate = true;
  target.add(bladeInstances);

  // Postes e cabos eléctricos, detalhes urbanos comuns nos bairros angolanos.
  const poleMaterial = makeMat('#59615f', 0.76, 0.28);
  const wireMaterial = makeMat('#343b3b', 0.72, 0.22);
  const polePositions = [[-64, -62], [-8, -62], [48, -62], [-64, 62], [-8, 62], [48, 62]];
  const poles = [];
  polePositions.forEach(([x, z]) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 7.2, 8), poleMaterial);
    pole.position.set(x, 3.6, z);
    target.add(pole);
    addBox(1.35, 0.12, 0.12, poleMaterial, x, 6.85, z);
    poles.push(new THREE.Vector3(x, 6.9, z));
  });
  for (let i = 0; i < poles.length - 1; i++) {
    if (i === 2) continue;
    const start = poles[i], end = poles[i + 1];
    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3((start.x + end.x) / 2, 6.0, (start.z + end.z) / 2),
      end
    ]);
    target.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.025, 5, false), wireMaterial));
  }

  // Painéis com fotografias verdadeiras de Luanda; se a rede falhar, o cenário continua funcional.
  const photoPanels = [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Luanda_Panorama.jpg', x: 14, z: -88, rotation: 0 },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Rua_cirilo_Luanda.JPG', x: 86, z: 14, rotation: -Math.PI / 2 },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Largo_Lumeji_Luanda.JPG', x: 205, z: 112, rotation: Math.PI }
  ];
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  photoPanels.forEach((photo, index) => {
    const group = new THREE.Group();
    group.position.set(photo.x, 0, photo.z);
    group.rotation.y = photo.rotation;
    target.add(group);
    const frame = makeMat('#343d3e', 0.72, 0.25);
    addBox(13.4, 7.5, 0.3, frame, 0, 5.2, 0, group);
    addBox(0.2, 8.3, 0.24, poleMaterial, -6.25, 4.1, 0, group);
    addBox(0.2, 8.3, 0.24, poleMaterial, 6.25, 4.1, 0, group);
    addBox(13.5, 0.22, 0.35, poleMaterial, 0, 9.05, 0, group);
    const pictureMaterial = new THREE.MeshStandardMaterial({ color: ['#a9b6b5', '#b9b5a7', '#aebbc0'][index], roughness: 0.95, side: THREE.DoubleSide });
    const picture = new THREE.Mesh(new THREE.PlaneGeometry(12.9, 6.95), pictureMaterial);
    picture.position.set(0, 5.2, 0.17);
    group.add(picture);
    loader.load(photo.url, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      pictureMaterial.map = texture;
      pictureMaterial.color.set('#ffffff');
      pictureMaterial.needsUpdate = true;
    }, undefined, error => {
      console.warn('Fotografia de referência indisponível; a manter painel de reserva.', error);
    });
    addBox(13.8, 0.32, 0.55, makeMat('#4b5150', 0.8), 0, 0.16, 0, group);
  });

  // Céu com atmosfera ligeiramente quente e distância suavizada.
  scene.background = new THREE.Color('#c9dce7');
  scene.fog = new THREE.FogExp2('#c9dce7', compactDevice ? 0.00034 : 0.00042);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#fff0c9', transparent: true, opacity: 0.72, depthWrite: false })
  );
  sunGlow.name = 'AngolaLifeSunGlow';
  sunGlow.position.set(-95, 78, -115);
  scene.add(sunGlow);
}
