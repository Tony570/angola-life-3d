import * as THREE from 'three';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // --- 1. CRIAR O MODELO 3D DO PERSONAGEM ---
    this.group = new THREE.Group();

    // Corpo (Tronco)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    this.group.add(body);

    // Cabeça
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xd08770, roughness: 0.6 }); // Tom de pele
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.05;
    head.castShadow = true;
    this.group.add(head);

    // Pernas
    const legGeo = new THREE.BoxGeometry(0.32, 1.0, 0.35);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x4c566a });
    
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.5, 0);
    leftLeg.castShadow = true;
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.5, 0);
    rightLeg.castShadow = true;
    this.group.add(rightLeg);

    // Posicionar o jogador no centro de Luanda (Praça inicial)
    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    // --- 2. CONFIGURAÇÕES DE MOVIMENTO ---
    this.moveSpeed = 0.12;
    this.inputVector = { x: 0, z: 0 };
    this.rotationAngle = 0;

    // Configurar o Joystick Tátil na UI
    this.setupJoystickUI();
  }

  // Criar interface visual do Joystick para Android / Navegador
  setupJoystickUI() {
    // Container do Joystick
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'joystick-container';
    joystickContainer.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 40px;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      z-index: 100;
      pointer-events: auto;
      touch-action: none;
    `;

    // Botão / Pega móvel do Joystick
    const joystickKnob = document.createElement('div');
    joystickKnob.id = 'joystick-knob';
    joystickKnob.style.cssText = `
      position: absolute;
      top: 35px;
      left: 35px;
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      pointer-events: none;
      transition: transform 0.05s ease-out;
    `;
    joystickContainer.appendChild(joystickKnob);
    document.body.appendChild(joystickContainer);

    // Gestão de Eventos Táctil e Rato
    let isDragging = false;
    const maxRadius = 35;

    const handleStart = (clientX, clientY) => {
      isDragging = true;
      updateJoystick(clientX, clientY);
    };

    const handleMove = (clientX, clientY) => {
      if (!isDragging) return;
      updateJoystick(clientX, clientY);
    };

    const handleEnd = () => {
      isDragging = false;
      this.inputVector = { x: 0, z: 0 };
      joystickKnob.style.transform = `translate(0px, 0px)`;
    };

    const updateJoystick = (clientX, clientY) => {
      const rect = joystickContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > maxRadius) {
        dx = (dx / distance) * maxRadius;
        dy = (dy / distance) * maxRadius;
      }

      joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalizar input (-1 a 1)
      this.inputVector.x = dx / maxRadius;
      this.inputVector.z = dy / maxRadius;
    };

    // Listeners para Mobile (Touch) e PC (Mouse)
    joystickContainer.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY));
    window.addEventListener('touchmove', (e) => {
      if(e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchend', handleEnd);

    joystickContainer.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);
  }

  // Atualização de posições a cada frame
  update() {
    if (this.inputVector.x !== 0 || this.inputVector.z !== 0) {
      // Movimentar com base no input do joystick
      this.group.position.x += this.inputVector.x * this.moveSpeed;
      this.group.position.z += this.inputVector.z * this.moveSpeed;

      // Calcular rotação para o personagem olhar na direção do movimento
      const angle = Math.atan2(this.inputVector.x, this.inputVector.z);
      this.group.rotation.y = angle;
    }

    // --- 3. CÂMARA EM TERCEIRA PESSOA ACOMPANHANDO O JOGADOR ---
    const targetCameraPos = new THREE.Vector3(
      this.group.position.x,
      this.group.position.y + 8,
      this.group.position.z + 14
    );

    // Suavizar movimento da câmara (Lerp)
    this.camera.position.lerp(targetCameraPos, 0.1);
    this.camera.lookAt(
      this.group.position.x,
      this.group.position.y + 1.5,
      this.group.position.z
    );
  }
  }
