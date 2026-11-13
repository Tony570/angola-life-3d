
import * as THREE from 'three';

export class Player {
  constructor(scene, camera, vehicles = []) {
    this.scene = scene;
    this.camera = camera;
    this.vehicles = vehicles;
    this.group = new THREE.Group();

    this.speed = 10;
    this.rotationSpeed = 2.8;
    this.keys = {};
    this.currentVehicle = null;
    this.nearVehicle = null;
    this.joystick = { x: 0, y: 0 };
    this.walkTime = 0;
    this.onInteract = null;

    this.colliders = [];
    this.indoor = false;
    this.radius = 0.48;

    this.createCharacter();
    this.group.position.set(0, 0, 18);
    scene.add(this.group);

    this.setupControls();
    this.setupJoystick();
  }

  material(color, roughness = 0.8) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness
    });
  }

  createCharacter() {
    const skin = this.material('#925d40');
    const skinLight = this.material('#a96f50');
    const shirt = this.material('#e7e0d2');
    const trousers = this.material('#26364c');
    const shoes = this.material('#202020');
    const hair = this.material('#171513');
    const eyes = this.material('#ffffff');
    const pupils = this.material('#17100c');
    const mouth = this.material('#48251e');

    const sphere = (name, geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      this.group.add(mesh);
      return mesh;
    };

    // Corpo e roupa
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.62, 5, 12),
      shirt
    );
    torso.name = 'body';
    torso.position.y = 1.35;
    torso.scale.set(1, 1, 0.78);
    this.group.add(torso);

    // Pescoço
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.2, 12),
      skin
    );
    neck.position.set(0, 1.88, 0);
    this.group.add(neck);

    // Cabeça
    sphere(
      'head',
      new THREE.SphereGeometry(0.29, 24, 20),
      skin,
      0, 2.15, 0
    );

    // Orelhas
    for (const side of [-1, 1]) {
      sphere(
        'ear',
        new THREE.SphereGeometry(0.075, 14, 12),
        skinLight,
        side * 0.285, 2.15, 0
      );

      sphere(
        'ear-inner',
        new THREE.SphereGeometry(0.035, 12, 10),
        skin,
        side * 0.306, 2.15, 0.035
      );
    }

    // Cabelo no topo da cabeça
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.298, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2
      ),
      hair
    );
    hairCap.position.set(0, 2.25, 0);
    this.group.add(hairCap);

    // Laterais do cabelo
    for (const side of [-1, 1]) {
      sphere(
        'side-hair',
        new THREE.SphereGeometry(0.105, 14, 12),
        hair,
        side * 0.22, 2.22, -0.015
      );
    }

    // Olhos
    for (const side of [-1, 1]) {
      sphere(
        'eye-white',
        new THREE.SphereGeometry(0.052, 16, 12),
        eyes,
        side * 0.105, 2.19, 0.251
      );

      sphere(
        'eye-pupil',
        new THREE.SphereGeometry(0.027, 14, 12),
        pupils,
        side * 0.105, 2.19, 0.294
      );

      // Sobrancelhas
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.105, 0.025, 0.025),
        hair
      );
      brow.position.set(side * 0.105, 2.27, 0.255);
      brow.rotation.z = side * -0.08;
      this.group.add(brow);
    }

    // Nariz
    sphere(
      'nose',
      new THREE.SphereGeometry(0.055, 14, 12),
      skinLight,
      0, 2.105, 0.285
    );

    // Boca
    const lips = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.018, 0.018),
      mouth
    );
    lips.position.set(0, 2.015, 0.277);
    this.group.add(lips);

    // Braços, mãos e pernas
    this.legs = [];
    this.arms = [];

    for (const side of [-1, 1]) {
      // Pernas
      const leg = new THREE.Group();
      leg.position.set(side * 0.19, 0.78, 0);

      const legMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.135, 0.57, 5, 10),
        trousers
      );
      legMesh.position.y = -0.29;
      leg.add(legMesh);

      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.13, 0.38),
        shoes
      );
      shoe.position.set(0, -0.65, 0.08);
      leg.add(shoe);

      this.group.add(leg);
      this.legs.push(leg);

      // Braços
      const arm = new THREE.Group();
      arm.position.set(side * 0.39, 1.65, 0);

      const upperArm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.105, 0.43, 5, 10),
        shirt
      );
      upperArm.position.y = -0.23;
      arm.add(upperArm);

      const forearm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.085, 0.27, 5, 10),
        skin
      );
      forearm.position.y = -0.58;
      arm.add(forearm);

      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 14, 12),
        skin
      );
      hand.position.set(0, -0.79, 0);
      arm.add(hand);

      this.group.add(arm);
      this.arms.push(arm);
    }

    this.group.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  setColliders(colliders = []) {
    this.colliders = colliders;
  }

  setIndoor(value) {
    this.indoor = value;
    this.updateCamera();
  }

  isBlocked(x, z) {
    for (const wall of this.colliders) {
      const closestX = THREE.MathUtils.clamp(
        x, wall.minX, wall.maxX
      );

      const closestZ = THREE.MathUtils.clamp(
        z, wall.minZ, wall.maxZ
      );

      const dx = x - closestX;
      const dz = z - closestZ;

      if (dx * dx + dz * dz < this.radius * this.radius) {
        return true;
      }
    }

    return false;
  }

  moveWithCollision(dx, dz) {
    const x = this.group.position.x;
    const z = this.group.position.z;

    if (!this.isBlocked(x + dx, z)) {
      this.group.position.x += dx;
    }

    if (!this.isBlocked(this.group.position.x, z + dz)) {
      this.group.position.z += dz;
    }
  }

  setupControls() {
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();

      if (key === 'e' && !e.repeat) {
        if (this.onInteract) {
          this.onInteract();
        } else {
          this.toggleVehicle();
        }
        return;
      }

      this.keys[key] = true;
    });

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setupJoystick() {
    const joystick = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');

    if (!joystick || !knob) return;

    let active = false;

    const move = e => {
      if (!active) return;

      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = e.clientX - cx;
      let dy = e.clientY - cy;

      const max = rect.width * 0.32;
      const length = Math.hypot(dx, dy);

      if (length > max) {
        dx = dx / length * max;
        dy = dy / length * max;
      }

      this.joystick.x = dx / max;
      this.joystick.y = dy / max;

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const stop = () => {
      active = false;
      this.joystick.x = 0;
      this.joystick.y = 0;
      knob.style.transform = 'translate(0, 0)';
    };

    joystick.addEventListener('pointerdown', e => {
      active = true;
      joystick.setPointerCapture(e.pointerId);
      move(e);
    });

    joystick.addEventListener('pointermove', move);
    joystick.addEventListener('pointerup', stop);
    joystick.addEventListener('pointercancel', stop);
  }

  toggleVehicle() {
    if (this.currentVehicle) {
      this.exitVehicle();
      return;
    }

    this.findNearestVehicle();

    if (this.nearVehicle) {
      this.enterVehicle(this.nearVehicle);
    }
  }

  findNearestVehicle() {
    let nearest = null;
    let distance = Infinity;

    for (const vehicle of this.vehicles) {
      if (vehicle.occupied) continue;

      const d = this.group.position.distanceTo(
        vehicle.group.position
      );

      if (d < distance) {
        distance = d;
        nearest = vehicle;
      }
    }

    this.nearVehicle = distance < 5 ? nearest : null;
    return this.nearVehicle;
  }

  enterVehicle(vehicle) {
    if (!vehicle || vehicle.occupied) return;

    this.currentVehicle = vehicle;
    vehicle.occupied = true;
    this.group.visible = false;
    this.group.position.copy(vehicle.group.position);
  }

  exitVehicle() {
    if (!this.currentVehicle) return;

    const vehicle = this.currentVehicle;
    const offset = new THREE.Vector3(2.8, 0, 0);

    offset.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      vehicle.group.rotation.y
    );

    this.group.position.copy(vehicle.group.position).add(offset);
    this.group.visible = true;

    vehicle.occupied = false;
    vehicle.speed = 0;
    this.currentVehicle = null;
  }

  update(delta) {
    const forward =
      (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) -
      (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0) -
      this.joystick.y;

    const turn =
      (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) -
      (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0) +
      this.joystick.x;

    if (this.currentVehicle) {
      const vehicle = this.currentVehicle;

      vehicle.speed += forward * 18 * delta;
      vehicle.speed *= Math.pow(0.94, delta * 60);
      vehicle.speed = THREE.MathUtils.clamp(
        vehicle.speed, -9, 22
      );

      vehicle.group.rotation.y -= turn * delta * 1.8 *
        (Math.abs(vehicle.speed) > 0.5 ? 1 : 0);

      const direction = new THREE.Vector3(
        Math.sin(vehicle.group.rotation.y),
        0,
        Math.cos(vehicle.group.rotation.y)
      );

      vehicle.group.position.addScaledVector(
        direction,
        vehicle.speed * delta
      );

      this.group.position.copy(vehicle.group.position);
      this.updateCamera();
      return;
    }

    const moving =
      Math.abs(forward) > 0.05 ||
      Math.abs(turn) > 0.05;

    if (moving) {
      this.group.rotation.y -=
        turn * this.rotationSpeed * delta;

      const direction = new THREE.Vector3(
        Math.sin(this.group.rotation.y),
        0,
        Math.cos(this.group.rotation.y)
      );

      const distance = forward * this.speed * delta;

      this.moveWithCollision(
        direction.x * distance,
        direction.z * distance
      );

      this.walkTime += delta * 10;

      this.legs[0].rotation.x = Math.sin(this.walkTime) * 0.55;
      this.legs[1].rotation.x = -Math.sin(this.walkTime) * 0.55;
      this.arms[0].rotation.x = -Math.sin(this.walkTime) * 0.35;
      this.arms[1].rotation.x = Math.sin(this.walkTime) * 0.35;
    } else {
      this.legs.forEach(leg => leg.rotation.x *= 0.8);
      this.arms.forEach(arm => arm.rotation.x *= 0.8);
    }

    this.findNearestVehicle();
    this.updateCamera();
  }

  updateCamera() {
    const target = this.currentVehicle
      ? this.currentVehicle.group.position
      : this.group.position;

    const rotation = this.currentVehicle
      ? this.currentVehicle.group.rotation.y
      : this.group.rotation.y;

    const distance = this.currentVehicle
      ? 10
      : this.indoor
        ? 3.2
        : 7;

    const height = this.currentVehicle
      ? 5
      : this.indoor
        ? 2.8
        : 4;

    const desired = new THREE.Vector3(
      target.x - Math.sin(rotation) * distance,
      target.y + height,
      target.z - Math.cos(rotation) * distance
    );

    this.camera.position.lerp(desired, 0.2);

    this.camera.lookAt(
      target.x,
      target.y + (this.currentVehicle ? 1.5 : 1.4),
      target.z
    );
  }

  teleport(x, z) {
    if (this.currentVehicle) this.exitVehicle();

    this.group.position.set(x, 0, z);
    this.updateCamera();
  }
}
