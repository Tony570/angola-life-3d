
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const MODEL_URL = 'https://models.codelove.in/models/male-adult-02.glb';
const IDLE_URL = 'https://models.codelove.in/animations/m_idle_neutral_01.glb';
const WALK_URL = 'https://models.codelove.in/animations/m_walk_neutral_01.glb';
const HUMAN_HEIGHT = 2.5;

export class Player {
  constructor(scene, camera, vehicles = []) {
    this.scene = scene;
    this.camera = camera;
    this.vehicles = vehicles;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, 18);
    this.scene.add(this.group);

    this.speed = 5.8;
    this.keys = {};
    this.currentVehicle = null;
    this.nearVehicle = null;
    this.onInteract = null;
    this.colliders = [];
    this.indoor = false;
    this.groundY = 0;
    this.radius = 0.38;

    this.moveTarget = null;
    this.sitting = false;
    this.previousSitPosition = null;
    this.previousSitRotation = 0;

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    );

    this.mixer = null;
    this.idleAction = null;
    this.walkAction = null;
    this.currentAnimation = '';
    this.walkPhase = 0;

    this.proceduralEuler = new THREE.Euler(0, 0, 0);
    this.proceduralQuaternion = new THREE.Quaternion();

    this.proceduralBones = {
      leftLeg: [],
      rightLeg: [],
      leftArm: [],
      rightArm: []
    };

    this.cameraDistance = 7;
    this.cameraMinDistance = 3;
    this.cameraMaxDistance = 14;
    this.cameraHeightAngle = 0.42;
    this.cameraYawOffset = 0;
    this.cameraPitch = 0;

    this.cameraDesired = new THREE.Vector3();
    this.vehicleDirection = new THREE.Vector3();
    this.vehicleUp = new THREE.Vector3(0, 1, 0);
    this.exitOffset = new THREE.Vector3(2.8, 0, 0);

    this.vehicleScanTimer = 0;
    this.nearbyColliderBuffer = [];
    this.colliderQueryId = 0;

    this.cameraPointers = new Map();
    this.pointerStart = new Map();
    this.lastPinchDistance = 0;
    this.cameraDragging = false;

    this.createCharacter();
    this.setupControls();
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

      const bounds = new THREE.Box3().setFromObject(model);
      const originalHeight = bounds.max.y - bounds.min.y;

      if (!Number.isFinite(originalHeight) || originalHeight <= 0) {
        throw new Error('Altura do personagem inválida.');
      }

      const scaleFactor = HUMAN_HEIGHT / originalHeight;
      const visualRoot = new THREE.Group();

      visualRoot.rotation.y = 0;
      visualRoot.scale.setScalar(scaleFactor);
      visualRoot.position.y = -bounds.min.y * scaleFactor;
      visualRoot.add(model);

      this.group.add(visualRoot);
      this.model = model;
      this.normalizedModel = visualRoot;
      this.applyAppearance();
      this.applyClothing();

      model.traverse(object => {
        if (object.isMesh) {
          object.castShadow = false;
          object.receiveShadow = false;
        }

        if (object.isBone) {
          const name = (object.name || '').toLowerCase();

          const entry = {
            bone: object,
            rest: object.quaternion.clone()
          };

          if (/left.*(upleg|upperleg|thigh|leg)|(?:upleg|upperleg|thigh|leg).*left|leg_l|thigh_l/.test(name)) {
            this.proceduralBones.leftLeg.push(entry);
          } else if (/right.*(upleg|upperleg|thigh|leg)|(?:upleg|upperleg|thigh|leg).*right|leg_r|thigh_r/.test(name)) {
            this.proceduralBones.rightLeg.push(entry);
          } else if (/left.*(arm|shoulder)|(?:arm|shoulder).*left|arm_l/.test(name)) {
            this.proceduralBones.leftArm.push(entry);
          } else if (/right.*(arm|shoulder)|(?:arm|shoulder).*right|arm_r/.test(name)) {
            this.proceduralBones.rightArm.push(entry);
          }
        }
      });

      this.mixer = new THREE.AnimationMixer(visualRoot);

      const results = await Promise.allSettled([
        loader.loadAsync(IDLE_URL),
        loader.loadAsync(WALK_URL)
      ]);

      if (results[0].status === 'fulfilled') {
        const clip = results[0].value.animations[0];
        this.idleClip = clip || null;

        if (clip) {
          this.idleAction = this.mixer.clipAction(clip);
          this.idleAction.play();
          this.currentAnimation = 'idle';
        }
      }

      if (results[1].status === 'fulfilled') {
        const clip = results[1].value.animations[0];

        if (clip) {
          this.walkAction = this.mixer.clipAction(clip);
        }
      }

      if (!this.idleAction && this.walkAction) {
        this.walkAction.play();
        this.walkAction.paused = true;
      }

      console.log('Personagem carregado.');
      if (typeof this.onModelReady === 'function') this.onModelReady();
    } catch (error) {
      console.error('Erro ao carregar personagem:', error);
    }
  }

  createResident(parent, x, y, z, rotationY = 0) {
    if (!this.normalizedModel || !parent) return null;
    const group = new THREE.Group();
    const visual = cloneSkeleton(this.normalizedModel);
    group.add(visual);
    group.position.set(x, y, z);
    group.rotation.y = rotationY;
    parent.add(group);
    let mixer = null;
    if (this.idleClip) {
      mixer = new THREE.AnimationMixer(visual);
      const idle = mixer.clipAction(this.idleClip);
      idle.play();
    }
    return { group, mixer };
  }

  setAppearance(appearance = {}) {
    this.appearance = {
      skin: appearance.skin || '#8d5524',
      hair: appearance.hair || '#21160f',
      eyes: appearance.eyes || '#3b2418',
      hairstyle: appearance.hairstyle || 'curto'
    };
    if (appearance.clothing) this.clothing = { ...appearance.clothing };
    this.applyAppearance();
    this.applyClothing();
  }

  applyAppearance() {
    if (!this.model || !this.appearance) return;
    const colors = {
      skin: new THREE.Color(this.appearance.skin),
      hair: new THREE.Color(this.appearance.hair),
      eyes: new THREE.Color(this.appearance.eyes)
    };
    this.model.traverse(object => {
      if (!object.isMesh || !object.material) return;
      const name = (object.name || '').toLowerCase();
      let key = null;
      if (/hair|cabelo|beard|barba/.test(name)) {
        key = 'hair';
        if (!object.userData.baseHairScale) object.userData.baseHairScale = object.scale.clone();
        const styleScale = this.appearance.hairstyle === 'rapado' ? 0.78
          : this.appearance.hairstyle === 'comprido' ? 1.18
          : this.appearance.hairstyle === 'encaracolado' ? 1.08 : 1;
        object.scale.copy(object.userData.baseHairScale);
        object.scale.y *= styleScale;
      }
      else if (/eye|iris|pupil|olho/.test(name)) key = 'eyes';
      else if (/skin|face|head|body|arm|hand|leg|neck|pele|rosto/.test(name)) key = 'skin';
      if (!key) return;
      const source = Array.isArray(object.material) ? object.material : [object.material];
      const changed = source.map(material => {
        const clone = material.clone();
        if (clone.color) clone.color.copy(colors[key]);
        return clone;
      });
      object.material = Array.isArray(object.material) ? changed : changed[0];
    });
  }

  equipClothing(itemName) {
    this.clothing = { ...(this.clothing || {}), [this.clothingSlot(itemName)]: itemName };
    this.applyClothing();
  }

  clothingSlot(itemName = '') {
    const value = String(itemName).toLowerCase();
    if (/calça|jeans|short|saia/.test(value)) return 'bottom';
    if (/sapato|ténis|sapatilha|bota/.test(value)) return 'shoes';
    if (/vestido/.test(value)) return 'outfit';
    if (/casaco|jaqueta|blusão/.test(value)) return 'outer';
    return 'top';
  }

  applyClothing() {
    if (!this.model || !this.clothing) return;

    const colorFor = (name, slot) => {
      const value = String(name || '').toLowerCase();
      if (/branc/.test(value)) return 0xf1eee7;
      if (/pret|negro/.test(value)) return 0x202020;
      if (/vermelh|red/.test(value)) return 0xb52e35;
      if (/azul|jeans/.test(value)) return 0x285d91;
      if (/verde/.test(value)) return 0x286344;
      if (/amarel|dourad/.test(value)) return 0xd6a52e;
      if (/african|estampad/.test(value)) return 0x9a3c32;
      if (slot === 'bottom') return 0x26344c;
      if (slot === 'shoes') return 0x282828;
      if (slot === 'outfit') return 0x8e3154;
      if (slot === 'outer') return 0x343b45;
      return 0x2877a8;
    };

    const patterns = {
      top: /shirt|top|torso|upper|tshirt|camisa|roupa_superior|outfit_top|upperbody/,
      bottom: /pant|trouser|jean|short|skirt|bottom|calça|outfit_bottom|lowerbody/,
      shoes: /shoe|boot|sneaker|footwear|feet|sapato|outfit_footwear/,
      outfit: /dress|vestido/,
      outer: /jacket|coat|blazer|casaco|outerwear/
    };

    this.model.traverse(object => {
      if (!object.isMesh || !object.material) return;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      const objectName = (object.name || '').toLowerCase();
      const materialNames = materials.map(material => (material.name || '').toLowerCase());
      const combinedName = [objectName, ...materialNames].join(' ');

      for (const [slot, pattern] of Object.entries(patterns)) {
        const itemName = this.clothing[slot];
        if (!itemName || !pattern.test(combinedName)) continue;

        const tint = colorFor(itemName, slot);
        const changed = materials.map(material => {
          const clone = material.clone();
          if (clone.color) clone.color.setHex(tint);
          return clone;
        });

        object.material = Array.isArray(object.material) ? changed : changed[0];
        object.userData.angolaLifeClothingSlot = slot;
        break;
      }
    });
  }

  setAnimation(name) {
    if (this.currentAnimation === name) return;

    const next = name === 'walk' ? this.walkAction : this.idleAction;
    const previous = name === 'walk' ? this.idleAction : this.walkAction;

    if (next) {
      next.reset();
      next.enabled = true;
      next.paused = false;
      next.fadeIn(0.2).play();
    }

    if (previous) previous.fadeOut(0.2);

    this.currentAnimation = name;
  }

  updateProceduralAnimation(delta, moving) {
    if (!this.normalizedModel || this.sitting) return;

    if (moving) this.walkPhase += delta * 8.5;

    const swing = moving ? Math.sin(this.walkPhase) * 0.62 : 0;
    const armSwing = moving
      ? Math.sin(this.walkPhase + Math.PI) * 0.38
      : 0;

    const apply = (entries, angle) => {
      for (const entry of entries) {
        this.proceduralEuler.set(angle, 0, 0);
        this.proceduralQuaternion.setFromEuler(this.proceduralEuler);
        entry.bone.quaternion.copy(entry.rest).multiply(this.proceduralQuaternion);
      }
    };

    apply(this.proceduralBones.leftLeg, swing);
    apply(this.proceduralBones.rightLeg, -swing);
    apply(this.proceduralBones.leftArm, armSwing);
    apply(this.proceduralBones.rightArm, -armSwing);
  }

  sitAt(x, z, rotationY = 0) {
    if (this.currentVehicle || this.sitting) return false;

    this.moveTarget = null;
    this.keys = {};

    this.previousSitPosition = this.group.position.clone();
    this.previousSitRotation = this.group.rotation.y;

    this.group.position.set(x, this.groundY, z);
    this.group.rotation.y = rotationY;
    this.sitting = true;

    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    const pose = (entries, angle) => {
      for (const entry of entries) {
        const offset = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(angle, 0, 0)
        );

        entry.bone.quaternion.copy(entry.rest).multiply(offset);
      }
    };

    pose(this.proceduralBones.leftLeg, -1.05);
    pose(this.proceduralBones.rightLeg, -1.05);
    pose(this.proceduralBones.leftArm, -0.18);
    pose(this.proceduralBones.rightArm, -0.18);

    this.currentAnimation = 'sit';
    this.updateCamera();

    return true;
  }

  standUp() {
    if (!this.sitting) return false;

    this.sitting = false;

    if (this.previousSitPosition) {
      this.group.position.copy(this.previousSitPosition);
    }

    this.group.position.y = this.groundY;
    this.group.rotation.y = this.previousSitRotation;

    this.previousSitPosition = null;
    this.moveTarget = null;

    const resetBones = entries => {
      for (const entry of entries) {
        entry.bone.quaternion.copy(entry.rest);
      }
    };

    resetBones(this.proceduralBones.leftLeg);
    resetBones(this.proceduralBones.rightLeg);
    resetBones(this.proceduralBones.leftArm);
    resetBones(this.proceduralBones.rightArm);

    this.currentAnimation = '';

    if (this.idleAction) {
      this.idleAction.reset();
      this.idleAction.enabled = true;
      this.idleAction.play();
      this.currentAnimation = 'idle';
    }

    this.updateCamera();
    return true;
  }

  setIndoor(value) {
    this.indoor = Boolean(value);
    if (!this.indoor) {
      this.groundY = 0;
      this.cameraDistance = 7;
    } else {
      this.groundY = 0.16;
      this.cameraDistance = 3.8;
    }
    this.group.position.y = this.groundY;
    this.updateCamera();
  }

  setIndoorFloor(height = 0.16) {
    this.indoor = true;
    this.groundY = Math.max(0.16, Number(height) || 0.16);
    this.group.position.y = this.groundY;
    this.cameraDistance = 3.8;
    this.updateCamera();
  }

  setColliders(colliders = []) {
    this.colliders = Array.isArray(colliders) ? colliders : [];
    this.colliderCellSize = 12;
    this.colliderGrid = new Map();
    this.nearbyColliderBuffer.length = 0;

    let colliderId = 0;

    for (const wall of this.colliders) {
      wall._playerColliderId = ++colliderId;
      wall._playerQueryStamp = 0;

      const minCellX = Math.floor(wall.minX / this.colliderCellSize);
      const maxCellX = Math.floor(wall.maxX / this.colliderCellSize);
      const minCellZ = Math.floor(wall.minZ / this.colliderCellSize);
      const maxCellZ = Math.floor(wall.maxZ / this.colliderCellSize);

      for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
        for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
          const key = cellX + ',' + cellZ;
          let bucket = this.colliderGrid.get(key);

          if (!bucket) {
            bucket = [];
            this.colliderGrid.set(key, bucket);
          }

          bucket.push(wall);
        }
      }
    }
  }

  getNearbyColliders(x, z, padding = this.radius) {
    const nearby = this.nearbyColliderBuffer;
    nearby.length = 0;

    if (!this.colliderGrid || this.colliderGrid.size === 0) {
      for (const wall of this.colliders) nearby.push(wall);
      return nearby;
    }

    const size = this.colliderCellSize;
    const minCellX = Math.floor((x - padding) / size);
    const maxCellX = Math.floor((x + padding) / size);
    const minCellZ = Math.floor((z - padding) / size);
    const maxCellZ = Math.floor((z + padding) / size);
    const stamp = ++this.colliderQueryId;

    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
        const bucket = this.colliderGrid.get(cellX + ',' + cellZ);
        if (!bucket) continue;

        for (const wall of bucket) {
          if (wall._playerQueryStamp === stamp) continue;
          wall._playerQueryStamp = stamp;
          nearby.push(wall);
        }
      }
    }

    return nearby;
  }

  isBlocked(x, z) {
    const nearby = this.getNearbyColliders(x, z);

    for (const wall of nearby) {
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

  resolveCollisionOverlap() {
    const p = this.group.position;

    for (let pass = 0; pass < 2; pass++) {
      let corrected = false;
      const nearby = this.getNearbyColliders(p.x, p.z, this.radius + 0.05);

      for (const wall of nearby) {
        const closestX = THREE.MathUtils.clamp(p.x, wall.minX, wall.maxX);
        const closestZ = THREE.MathUtils.clamp(p.z, wall.minZ, wall.maxZ);
        const dx = p.x - closestX;
        const dz = p.z - closestZ;
        const distanceSq = dx * dx + dz * dz;

        if (distanceSq >= this.radius * this.radius) continue;

        if (distanceSq > 0.000001) {
          const distance = Math.sqrt(distanceSq);
          const push = this.radius - distance + 0.012;
          p.x += (dx / distance) * push;
          p.z += (dz / distance) * push;
        } else {
          const left = Math.abs(p.x - wall.minX);
          const right = Math.abs(wall.maxX - p.x);
          const back = Math.abs(p.z - wall.minZ);
          const front = Math.abs(wall.maxZ - p.z);
          const nearest = Math.min(left, right, back, front);

          if (nearest === left) p.x = wall.minX - this.radius - 0.012;
          else if (nearest === right) p.x = wall.maxX + this.radius + 0.012;
          else if (nearest === back) p.z = wall.minZ - this.radius - 0.012;
          else p.z = wall.maxZ + this.radius + 0.012;
        }

        corrected = true;
      }

      if (!corrected) break;
    }

    p.y = this.groundY;
  }

  moveWithCollision(dx, dz) {
    const distance = Math.hypot(dx, dz);
    if (distance < 0.00001) return;

    this.resolveCollisionOverlap();

    const maxStep = 0.45;
    const steps = Math.max(1, Math.ceil(distance / maxStep));
    const stepX = dx / steps;
    const stepZ = dz / steps;

    for (let i = 0; i < steps; i++) {
      const currentX = this.group.position.x;
      const currentZ = this.group.position.z;
      const nextX = currentX + stepX;
      const nextZ = currentZ + stepZ;

      if (!this.isBlocked(nextX, nextZ)) {
        this.group.position.x = nextX;
        this.group.position.z = nextZ;
        continue;
      }

      const canMoveX = !this.isBlocked(nextX, currentZ);
      const canMoveZ = !this.isBlocked(currentX, nextZ);

      if (canMoveX) this.group.position.x = nextX;
      if (canMoveZ) this.group.position.z = nextZ;
    }

    this.group.position.y = this.groundY;
  }

  setupControls() {
    window.addEventListener('keydown', e => {
      const key = e.key.toLowerCase();

      if (key === 'e' && !e.repeat) {
        if (this.onInteract) this.onInteract();
        else this.toggleVehicle();
        return;
      }

      if (this.sitting) return;

      this.keys[key] = true;
    });

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.moveTarget = null;
    });
  }

  setDestinationFromScreen(clientX, clientY) {
    if (this.sitting) return;

    const canvas = this.camera && document.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    this.camera.updateMatrixWorld(true);
    this.groundPlane.constant = -this.groundY;
    this.raycaster.setFromCamera(mouse, this.camera);

    const destination = new THREE.Vector3();

    const hit = this.raycaster.ray.intersectPlane(
      this.groundPlane,
      destination
    );

    if (!hit) return;

    const distance = Math.hypot(
      destination.x - this.group.position.x,
      destination.z - this.group.position.z
    );

    if (distance < 0.5) {
      this.moveTarget = null;
      return;
    }

    this.moveTarget = new THREE.Vector3(
      destination.x,
      0,
      destination.z
    );

    console.log('Novo destino:', destination.x, destination.z);
  }

  setupCameraControls() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // O ecrã fica reservado à câmara: um toque não desloca o jogador
    // nem dispara movimentos acidentais.
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.addEventListener('contextmenu', event => event.preventDefault());

    const positionOf = event => ({ x: event.clientX, y: event.clientY });
    const pinchDistance = () => {
      const points = [...this.cameraPointers.values()];
      if (points.length < 2) return 0;
      return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    };

    const finishPointer = event => {
      if (!this.cameraPointers.has(event.pointerId)) return;
      this.cameraPointers.delete(event.pointerId);
      this.pointerStart.delete(event.pointerId);
      if (this.cameraPointers.size < 2) this.lastPinchDistance = 0;
      this.cameraDragging = this.cameraPointers.size === 1;
    };

    canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
      const point = positionOf(event);
      this.cameraPointers.set(event.pointerId, point);
      this.pointerStart.set(event.pointerId, point);
      this.cameraDragging = this.cameraPointers.size === 1;
      if (this.cameraPointers.size >= 2) {
        this.lastPinchDistance = pinchDistance();
        this.cameraDragging = false;
      }
    }, { passive: false });

    canvas.addEventListener('pointermove', event => {
      if (!this.cameraPointers.has(event.pointerId)) return;
      event.preventDefault();
      const previous = this.cameraPointers.get(event.pointerId);
      const current = positionOf(event);
      this.cameraPointers.set(event.pointerId, current);

      if (this.cameraPointers.size === 1 && this.cameraDragging) {
        const start = this.pointerStart.get(event.pointerId);
        const totalMovement = start
          ? Math.hypot(current.x - start.x, current.y - start.y)
          : 0;
        if (totalMovement > 3) {
          this.cameraYawOffset -= (current.x - previous.x) * 0.0065;
          this.cameraYawOffset = Math.atan2(
            Math.sin(this.cameraYawOffset),
            Math.cos(this.cameraYawOffset)
          );
          this.cameraPitch = THREE.MathUtils.clamp(
            this.cameraPitch + (current.y - previous.y) * 0.0045,
            -0.28,
            0.62
          );
        }
      } else if (this.cameraPointers.size >= 2) {
        const nextDistance = pinchDistance();
        if (this.lastPinchDistance > 0 && nextDistance > 0) {
          this.cameraDistance = THREE.MathUtils.clamp(
            this.cameraDistance + (this.lastPinchDistance - nextDistance) * 0.022,
            this.cameraMinDistance,
            this.cameraMaxDistance
          );
        }
        this.lastPinchDistance = nextDistance;
      }
    }, { passive: false });

    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);
    canvas.addEventListener('lostpointercapture', finishPointer);

    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.cameraDistance = THREE.MathUtils.clamp(
        this.cameraDistance + event.deltaY * 0.012,
        this.cameraMinDistance,
        this.cameraMaxDistance
      );
    }, { passive: false });
  }

  toggleVehicle() {
    if (this.sitting) return;

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
    if (!vehicle || vehicle.occupied || this.sitting) return;

    this.moveTarget = null;
    this.currentVehicle = vehicle;
    vehicle.occupied = true;
    this.group.visible = false;
    this.group.position.copy(vehicle.group.position);
    this.cameraDistance = 10;
  }

  exitVehicle() {
    if (!this.currentVehicle) return;

    const vehicle = this.currentVehicle;

    this.exitOffset.set(2.8, 0, 0);
    this.exitOffset.applyAxisAngle(this.vehicleUp, vehicle.group.rotation.y);

    this.group.position.copy(vehicle.group.position).add(this.exitOffset);
    this.group.position.y = this.groundY;
    this.group.visible = true;

    vehicle.occupied = false;
    vehicle.speed = 0;
    this.currentVehicle = null;
    this.cameraDistance = 7;
  }

  update(delta) {
    this.group.position.y = this.groundY;

    if (this.mixer) this.mixer.update(delta);

    if (this.sitting) {
      this.updateCamera();
      return;
    }

    if (this.currentVehicle) {
      const vehicle = this.currentVehicle;

      const forward =
        (this.keys.s || this.keys.arrowdown ? 1 : 0) -
      (this.keys.w || this.keys.arrowup ? 1 : 0);

      const sideways =
        (this.keys.d || this.keys.arrowright ? 1 : 0) -
        (this.keys.a || this.keys.arrowleft ? 1 : 0);

      vehicle.speed += forward * 18 * delta;
      vehicle.speed *= Math.pow(0.94, delta * 60);
      vehicle.speed = THREE.MathUtils.clamp(vehicle.speed, -9, 22);
      vehicle.group.rotation.y -= sideways * delta * 1.8;

      this.vehicleDirection.set(
        Math.sin(vehicle.group.rotation.y),
        0,
        Math.cos(vehicle.group.rotation.y)
      );

      vehicle.group.position.addScaledVector(
        this.vehicleDirection,
        vehicle.speed * delta
      );

      this.group.position.copy(vehicle.group.position);
      this.updateCamera();
      return;
    }

    const forward =
      (this.keys.s || this.keys.arrowdown ? 1 : 0) -
      (this.keys.w || this.keys.arrowup ? 1 : 0);

    const sideways =
      (this.keys.d || this.keys.arrowright ? 1 : 0) -
      (this.keys.a || this.keys.arrowleft ? 1 : 0);

    let moving = false;
    let directionX = 0;
    let directionZ = 0;

    if (forward !== 0 || sideways !== 0) {
      this.moveTarget = null;

      const length = Math.hypot(forward, sideways);
      const f = forward / length;
      const side = sideways / length;
      const yaw = this.cameraYawOffset;

      // A frente do personagem aponta para longe da câmara.
      // Mantém esquerda/direita alinhadas com a vista do jogador.
      directionX = Math.sin(yaw) * f + Math.cos(yaw) * side;
      directionZ = Math.cos(yaw) * f - Math.sin(yaw) * side;

      moving = true;
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.group.position.x;
      const dz = this.moveTarget.z - this.group.position.z;
      const distance = Math.hypot(dx, dz);

      if (distance < 0.2) {
        this.moveTarget = null;
      } else {
        directionX = dx / distance;
        directionZ = dz / distance;
        moving = true;
      }
    }

    if (moving) {
      const targetRotation = Math.atan2(directionX, directionZ);
      let angleDifference = targetRotation - this.group.rotation.y;

      angleDifference = Math.atan2(
        Math.sin(angleDifference),
        Math.cos(angleDifference)
      );

      this.group.rotation.y += angleDifference * Math.min(1, delta * 10);

      const step = this.speed * delta;
      const oldX = this.group.position.x;
      const oldZ = this.group.position.z;

      this.moveWithCollision(
        directionX * step,
        directionZ * step
      );

      const actuallyMoved = Math.hypot(
        this.group.position.x - oldX,
        this.group.position.z - oldZ
      );

      if (actuallyMoved < 0.001) {
        this.resolveCollisionOverlap();

        if (this.moveTarget) this.moveTarget = null;

        moving = false;
      }
    }

    this.setAnimation(moving ? 'walk' : 'idle');
    this.updateProceduralAnimation(delta, moving);

    this.vehicleScanTimer += delta;

    if (this.vehicleScanTimer >= 0.25) {
      this.vehicleScanTimer = 0;
      this.findNearestVehicle();
    }

    this.updateCamera();
  }

  updateCamera(delta = 1 / 60) {
    const target = this.currentVehicle
      ? this.currentVehicle.group.position
      : this.group.position;

    const yaw = this.currentVehicle
      ? this.currentVehicle.group.rotation.y + this.cameraYawOffset
      : this.cameraYawOffset;

    const distance = this.currentVehicle
      ? Math.max(this.cameraDistance, 8)
      : THREE.MathUtils.clamp(
          this.cameraDistance,
          this.indoor ? 2.35 : this.cameraMinDistance,
          this.cameraMaxDistance
        );

    const pitch = THREE.MathUtils.clamp(
      this.cameraHeightAngle + this.cameraPitch,
      -0.12,
      0.9
    );
    const horizontalDistance = distance * Math.cos(pitch);
    const verticalDistance = distance * Math.sin(pitch);

    this.cameraDesired.set(
      target.x + Math.sin(yaw) * horizontalDistance,
      target.y + verticalDistance + 1.2,
      target.z + Math.cos(yaw) * horizontalDistance
    );

    // Suavização independente da taxa de fotogramas.
    const smoothing = 1 - Math.exp(-12 * Math.max(0, Math.min(delta, 0.1)));
    this.camera.position.lerp(this.cameraDesired, smoothing);
    this.camera.lookAt(
      target.x,
      target.y + (this.currentVehicle ? 1.5 : 1.35),
      target.z
    );
  }

  teleport(x, z) {
    if (this.sitting) this.standUp();
    if (this.currentVehicle) this.exitVehicle();

    this.moveTarget = null;

    if (!this.indoor) {
      this.groundY = 0;
    } else if (!Number.isFinite(this.groundY)) {
      this.groundY = 0.16;
    }

    this.group.position.set(x, this.groundY, z);
    this.updateCamera();
  }
}
