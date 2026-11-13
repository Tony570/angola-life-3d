
import * as THREE from 'three';

export class Player {
  constructor(scene, camera, vehicles) {
    this.scene = scene;
    this.camera = camera;
    this.vehicles = vehicles;

    this.group = new THREE.Group();
    this.input = { x: 0, z: 0 };
    this.speed = 8;
    this.vehicle = null;
    this.keys = {};

    const mat = color =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

    const skin = mat(0x8b5236);
    const shirt = mat(0x1976d2);
    const pants = mat(0x242c3a);
    const shoes = mat(0x171717);

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.55, 5, 10),
      shirt
    );
    body.position.y = 1.1;
    body.castShadow = true;
    this.group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 16, 16),
      skin
    );
    head.position.y = 1.85;
    this.group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.275, 16, 8, 0, Math.PI * 2, 0, 1.3),
      mat(0x17120f)
    );
    hair.position.y = 1.95;
    this.group.add(hair);

    this.limbs = [];

    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.48, 5, 8),
        skin
      );
      arm.position.set(side * 0.4, 1.12, 0);
      arm.rotation.z = -side * 0.12;
      this.group.add(arm);

      const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.13, 0.5, 5, 8),
        pants
      );
      leg.position.set(side * 0.16, 0.42, 0);
      this.group.add(leg);

      this.limbs.push({ arm, leg, side });
    }

    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.14, 0.4),
      shoes
    );

    for (const side of [-1, 1]) {
      const f = foot.clone();
      f.position.set(side * 0.16, 0.12, 0.08);
      this.group.add(f);
    }

    this.group.position.set(0, 0, 0);
    this.scene.add(this.group);

    this.setupControls();
    this.setupJoystick();

    this.camera.position.set(0, 6, 12);
  }

  setupControls() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE' && !e.repeat) {
        this.toggleVehicle();
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  setupJoystick() {
    const base = document.createElement('div');
    base.id = 'joystick';
    base.innerHTML = '<div id="joystick-knob"></div>';
    document.body.appendChild(base);

    const knob = base.firstElementChild;
    let active = false;
    const radius = 42;

    const move = (x, y) => {
      const rect = base.getBoundingClientRect();
      let dx = x - (rect.left + rect.width / 2);
      let dy = y - (rect.top + rect.height / 2);

      const length = Math.hypot(dx, dy);

      if (length > radius) {
        dx = dx / length * radius;
        dy = dy / length * radius;
      }

      this.input.x = dx / radius;
      this.input.z = dy / radius;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    base.addEventListener('pointerdown', e => {
      active = true;
      base.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });

    base.addEventListener('pointermove', e => {
      if (active) move(e.clientX, e.clientY);
    });

    const stop = () => {
      active = false;
      this.input.x = 0;
      this.input.z = 0;
      knob.style.transform = 'translate(0, 0)';
    };

    base.addEventListener('pointerup', stop);
    base.addEventListener('pointercancel', stop);
  }

  toggleVehicle() {
    if (this.vehicle) {
      this.vehicle.occupied = false;
      this.group.visible = true;
      this.group.position.copy(this.vehicle.group.position);
      this.group.position.x += 3;
      this.vehicle = null;
      return;
    }

    let nearest = null;
    let distance = 5;

    for (const v of this.vehicles) {
      const d = this.group.position.distanceTo(v.group.position);

      if (d < distance) {
        nearest = v;
        distance = d;
      }
    }

    if (nearest) {
      this.vehicle = nearest;
      nearest.occupied = true;
      this.group.visible = false;
    }
  }

  setPosition(x, z) {
    if (this.vehicle) return;

    this.group.position.set(x, 0, z);
  }

  update(delta = 0.016) {
    let x = this.input.x;
    let z = this.input.z;

    if (this.keys.ArrowLeft || this.keys.KeyA) x -= 1;
    if (this.keys.ArrowRight || this.keys.KeyD) x += 1;
    if (this.keys.ArrowUp || this.keys.KeyW) z -= 1;
    if (this.keys.ArrowDown || this.keys.KeyS) z += 1;

    const length = Math.hypot(x, z);

    if (length > 1) {
      x /= length;
      z /= length;
    }

    const moving = length > 0.05;

    if (this.vehicle) {
      const v = this.vehicle;

      if (this.keys.ArrowUp || this.keys.KeyW || z < -0.1) {
        v.speed = Math.min(v.speed + delta * 12, 24);
      } else if (this.keys.ArrowDown || this.keys.KeyS || z > 0.1) {
        v.speed = Math.max(v.speed - delta * 18, -8);
      } else {
        v.speed *= 0.97;
      }

      if (Math.abs(x) > 0.05) {
        v.group.rotation.y -= x * delta * 1.5 * Math.sign(v.speed || 1);
      }

      const direction = new THREE.Vector3(
        Math.sin(v.group.rotation.y),
        0,
        Math.cos(v.group.rotation.y)
      );

      v.group.position.addScaledVector(direction, -v.speed * delta);

      for (const wheel of v.wheels) {
        wheel.rotation.x += v.speed * delta;
      }

      this.group.position.copy(v.group.position);
      this.camera.position.lerp(
        new THREE.Vector3(
          v.group.position.x,
          7,
          v.group.position.z + 12
        ),
        0.08
      );
    } else {
      this.group.position.x += x * this.speed * delta;
      this.group.position.z += z * this.speed * delta;

      if (moving) {
        this.group.rotation.y = Math.atan2(x, z);
        const t = performance.now() * 0.012;

        for (const limb of this.limbs) {
          limb.leg.rotation.x = Math.sin(t) * 0.5 * limb.side;
          limb.arm.rotation.x = -Math.sin(t) * 0.4 * limb.side;
        }
      } else {
        for (const limb of this.limbs) {
          limb.leg.rotation.x = 0;
          limb.arm.rotation.x = 0;
        }
      }

      const desired = new THREE.Vector3(
        this.group.position.x,
        5,
        this.group.position.z + 9
      );

      this.camera.position.lerp(desired, 0.09);
    }

    const target = this.vehicle
      ? this.vehicle.group.position
      : this.group.position;

    this.camera.lookAt(
      target.x,
      this.vehicle ? 1.3 : 1.2,
      target.z
    );
  }
}
