
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

    this.createCharacter();
    this.group.position.set(0, 0, 18);
    scene.add(this.group);

    this.setupControls();
    this.setupJoystick();
  }

  material(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8
    });
  }

  createCharacter() {
    const skin = this.material('#925d40');
    const shirt = this.material('#e7e0d2');
    const trousers = this.material('#26364c');
    const shoes = this.material('#202020');

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.38, 0.65, 4, 8),
      shirt
    );
    torso.position.y = 1.35;
    this.group.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.29, 14, 12),
      skin
    );
    head.position.y = 2.15;
    this.group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2
      ),
      this.material('#171513')
    );
    hair.position.y = 2.28;
    this.group.add(hair);

    this.legs = [];
    this.arms = [];

    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.19, 0.75, 0);

      const legMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.14, 0.58, 4, 7),
        trousers
      );
      legMesh.position.y = -0.28;
      leg.add(legMesh);

      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.13, 0.38),
        shoes
      );
      shoe.position.set(0, -0.65, 0.08);
      leg.add(shoe);

      this.group.add(leg);
      this.legs.push(leg);

      const arm = new THREE.Group();
      arm.position.set(side * 0.43, 1.65, 0);

      const armMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.11, 0.52, 4, 7),
        shirt
      );
      armMesh.position.y = -0.28;
      arm.add(armMesh);

      this.group.add(arm);
      this.arms.push(arm);
    }

    this.group.traverse(obj => {
      if (obj.isMesh) obj.castShadow = true;
    });
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

      this.group.position.addScaledVector(
        direction,
        forward * this.speed * delta
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

    const distance = this.currentVehicle ? 10 : 7;
    const height = this.currentVehicle ? 5 : 4;

    const desired = new THREE.Vector3(
      target.x - Math.sin(rotation) * distance,
      target.y + height,
      target.z - Math.cos(rotation) * distance
    );

    this.camera.position.lerp(desired, 0.12);

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
