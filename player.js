
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MODEL_URL = 'https://models.codelove.in/models/male-adult-02.glb';
const HUMAN_HEIGHT = 2.5;

export class Player {
  constructor(scene, camera, vehicles = []) {
    this.scene = scene;
    this.camera = camera;
    this.vehicles = vehicles;
    this.group = new THREE.Group();

    this.speed = 5;
    this.keys = {};
    this.currentVehicle = null;
    this.nearVehicle = null;
    this.joystick = { x: 0, y: 0 };
    this.onInteract = null;
    this.colliders = [];
    this.indoor = false;
    this.radius = 0.38;

    this.mixer = null;
    this.idleAction = null;
    this.walkAction = null;
    this.currentAnimation = '';

    this.cameraDistance = 7;
    this.cameraMinDistance = 3;
    this.cameraMaxDistance = 14;
    this.cameraHeightAngle = 0.42;
    this.cameraYawOffset = 0;
    this.cameraPitch = 0;
    this.cameraPointers = new Map();
    this.lastPinchDistance = 0;
    this.cameraDragging = false;

    this.group.position.set(0, 0, 18);
    this.scene.add(this.group);

    this.createCharacter();
    this.setupControls();
    this.setupJoystick();
    this.setupCameraControls();
  }

  async createCharacter() {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

    try {
      const gltf = await loader.loadAsync(MODEL_URL);
      const model = gltf.scene;

      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.updateMatrixWorld(true);

      const bounds = new THREE.Box3();

      model.traverse(object => {
        if (!object.isMesh || !object.geometry) return;

        if (!object.geometry.boundingBox) {
          object.geometry.computeBoundingBox();
        }

        if (object.geometry.boundingBox) {
          const meshBounds = object.geometry.boundingBox.clone();
          meshBounds.applyMatrix4(object.matrixWorld);
          bounds.union(meshBounds);
        }
      });

      if (bounds.isEmpty()) bounds.setFromObject(model);

      const originalHeight = bounds.max.y - bounds.min.y;

      if (!Number.isFinite(originalHeight) || originalHeight <= 0) {
        throw new Error('Altura do personagem inválida.');
      }

      const scaleFactor = HUMAN_HEIGHT / originalHeight;

      const visualRoot = new THREE.Group();
      visualRoot.scale.setScalar(scaleFactor);
      visualRoot.position.y = -bounds.min.y * scaleFactor;

      model.rotation.y = Math.PI;
      visualRoot.add(model);
      this.group.add(visualRoot);

      this.model = model;
      this.normalizedModel = visualRoot;

      model.traverse(object => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          if (object.material) object.material.needsUpdate = true;
        }
      });

      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(model);

        const idleClip = gltf.animations.find(clip =>
          /idle|stand|breath/i.test(clip.name)
        );

        const walkClip = gltf.animations.find(clip =>
          /walk|walking|run|running/i.test(clip.name)
        );

        if (idleClip) {
          this.idleAction = this.mixer.clipAction(idleClip);
          this.idleAction.play();
          this.currentAnimation = 'idle';
        }

        if (walkClip) {
          this.walkAction = this.mixer.clipAction(walkClip);
        }

        if (!this.idleAction && this.walkAction) {
          this.walkAction.play();
          this.walkAction.paused = true;
        }

        console.log('Animações:', gltf.animations.map(a => a.name));
      }

      console.log('Personagem carregado:', HUMAN_HEIGHT, 'metros');

    } catch (error) {
      console.error('Erro ao carregar personagem:', error);
    }
  }

  setAnimation(name) {
    const next = name === 'walk' ? this.walkAction : this.idleAction;
    const previous = name === 'walk' ? this.idleAction : this.walkAction;

    if (!next || this.currentAnimation === name) return;

    next.reset();
    next.fadeIn(0.2).play();

    if (previous) previous.fadeOut(0.2);

    this.currentAnimation = name;
  }

  setColliders(colliders = []) {
    this.colliders = colliders;
  }

  setIndoor(value) {
    this.indoor = value;

    if (value) {
      this.cameraDistance = THREE.MathUtils.clamp(
        this.cameraDistance, 3, 5
      );
    }

    this.updateCamera();
  }

  isBlocked(x, z) {
    for (const wall of this.colliders) {
      const closestX = THREE.MathUtils.clamp(x, wall.minX, wall.maxX);
      const closestZ = THREE.MathUtils.clamp(z, wall.minZ, wall.maxZ);

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
    const startsBlocked = this.isBlocked(x, z);

    if (startsBlocked || !this.isBlocked(x + dx, z)) {
      this.group.position.x += dx;
    }

    if (startsBlocked || !this.isBlocked(this.group.position.x, z + dz)) {
      this.group.position.z += dz;
    }

    this.group.position.y = 0;
  }

  setupControls() {
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();

      if (key === 'e' && !e.repeat) {
        if (this.onInteract) this.onInteract();
        else this.toggleVehicle();
        return;
      }

      this.keys[key] = true;
    });

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.joystick.x = 0;
      this.joystick.y = 0;
    });
  }

  setupJoystick() {
    const joystick = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');

    if (!joystick || !knob) return;

    let active = false;

    const move = e => {
      if (!active) return;

      e.preventDefault();

      const rect = joystick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let dx = e.clientX - cx;
      let dy = e.clientY - cy;

      const max = Math.max(1, rect.width * 0.32);
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
      e.preventDefault();
      active = true;
      joystick.setPointerCapture(e.pointerId);
      move(e);
    });

    joystick.addEventListener('pointermove', move);
    joystick.addEventListener('pointerup', stop);
    joystick.addEventListener('pointercancel', stop);
    joystick.addEventListener('lostpointercapture', stop);
  }

  setupCameraControls() {
    const canvas = document.querySelector('canvas');

    if (!canvas) return;

    canvas.style.touchAction = 'none';

    const pointerPosition = e => ({
      x: e.clientX,
      y: e.clientY
    });

    const getPinchDistance = () => {
      const points = [...this.cameraPointers.values()];

      if (points.length < 2) return 0;

      return Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
      );
    };

    canvas.addEventListener('pointerdown', e => {
      if (e.target !== canvas) return;

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      this.cameraPointers.set(e.pointerId, pointerPosition(e));

      if (this.cameraPointers.size === 1) {
        this.cameraDragging = true;
      }

      if (this.cameraPointers.size === 2) {
        this.lastPinchDistance = getPinchDistance();
        this.cameraDragging = false;
      }
    });

    canvas.addEventListener('pointermove', e => {
      if (!this.cameraPointers.has(e.pointerId)) return;

      e.preventDefault();

      const previous = this.cameraPointers.get(e.pointerId);
      const current = pointerPosition(e);

      this.cameraPointers.set(e.pointerId, current);

      if (this.cameraPointers.size === 1 && this.cameraDragging) {
        this.cameraYawOffset -= (current.x - previous.x) * 0.006;

        this.cameraPitch = THREE.MathUtils.clamp(
          this.cameraPitch + (current.y - previous.y) * 0.004,
          -0.35,
          0.65
        );
      }

      if (this.cameraPointers.size >= 2) {
        const newDistance = getPinchDistance();

        if (this.lastPinchDistance > 0) {
          this.cameraDistance = THREE.MathUtils.clamp(
            this.cameraDistance +
              (this.lastPinchDistance - newDistance) * 0.025,
            this.cameraMinDistance,
            this.cameraMaxDistance
          );
        }

        this.lastPinchDistance = newDistance;
      }
    });

    const releasePointer = e => {
      this.cameraPointers.delete(e.pointerId);

      if (this.cameraPointers.size === 0) {
        this.cameraDragging = false;
        this.lastPinchDistance = 0;
      } else if (this.cameraPointers.size === 1) {
        this.lastPinchDistance = 0;
        this.cameraDragging = true;
      }
    };

    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('lostpointercapture', releasePointer);

    canvas.addEventListener('wheel', e => {
      e.preventDefault();

      this.cameraDistance = THREE.MathUtils.clamp(
        this.cameraDistance + e.deltaY * 0.01,
        this.cameraMinDistance,
        this.cameraMaxDistance
      );
    }, { passive: false });
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

      const d = this.group.position.distanceTo(vehicle.group.position);

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
    this.cameraDistance = 10;
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
    this.group.position.y = 0;
    this.group.visible = true;

    vehicle.occupied = false;
    vehicle.speed = 0;
    this.currentVehicle = null;
    this.cameraDistance = 7;
  }

  update(delta) {
    this.group.position.y = 0;

    if (this.mixer) {
      this.mixer.update(delta);
    }

    const forward =
      (this.keys.w || this.keys.arrowup ? 1 : 0) -
      (this.keys.s || this.keys.arrowdown ? 1 : 0) -
      this.joystick.y;

    const sideways =
      (this.keys.d || this.keys.arrowright ? 1 : 0) -
      (this.keys.a || this.keys.arrowleft ? 1 : 0) +
      this.joystick.x;

    if (this.currentVehicle) {
      const vehicle = this.currentVehicle;

      vehicle.speed += forward * 18 * delta;
      vehicle.speed *= Math.pow(0.94, delta * 60);
      vehicle.speed = THREE.MathUtils.clamp(vehicle.speed, -9, 22);
      vehicle.group.rotation.y -= sideways * delta * 1.8;

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

    const cameraYaw = this.cameraYawOffset;

    const forwardDirection = new THREE.Vector3(
      -Math.sin(cameraYaw),
      0,
      -Math.cos(cameraYaw)
    );

    const rightDirection = new THREE.Vector3(
      Math.cos(cameraYaw),
      0,
      -Math.sin(cameraYaw)
    );

    const movement = new THREE.Vector3()
      .addScaledVector(forwardDirection, forward)
      .addScaledVector(rightDirection, sideways);

    if (movement.lengthSq() > 0.01) {
      movement.normalize();

      const targetRotation = Math.atan2(
        -movement.x,
        -movement.z
      );

      let angleDifference = targetRotation - this.group.rotation.y;

      angleDifference = Math.atan2(
        Math.sin(angleDifference),
        Math.cos(angleDifference)
      );

      this.group.rotation.y +=
        angleDifference * Math.min(1, delta * 10);

      const distance = this.speed * delta;

      this.moveWithCollision(
        movement.x * distance,
        movement.z * distance
      );

      this.setAnimation('walk');
    } else {
      this.setAnimation('idle');
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
      ? Math.max(this.cameraDistance, 8)
      : THREE.MathUtils.clamp(
          this.cameraDistance,
          this.indoor ? 2.5 : this.cameraMinDistance,
          this.cameraMaxDistance
        );

    const yaw = rotation + this.cameraYawOffset;
    const pitch = this.cameraHeightAngle + this.cameraPitch;

    const horizontalDistance = distance * Math.cos(pitch);
    const verticalDistance = distance * Math.sin(pitch);

    const desired = new THREE.Vector3(
      target.x - Math.sin(yaw) * horizontalDistance,
      target.y + verticalDistance + 1.2,
      target.z - Math.cos(yaw) * horizontalDistance
    );

    this.camera.position.lerp(desired, 0.18);

    this.camera.lookAt(
      target.x,
      target.y + (this.currentVehicle ? 1.5 : 1.35),
      target.z
    );
  }

  teleport(x, z) {
    if (this.currentVehicle) this.exitVehicle();

    this.group.position.set(x, 0, z);
    this.updateCamera();
  }
}
