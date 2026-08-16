import * as THREE from "./assets/vendor/three.module.min.js";
import { GLTFLoader } from "./assets/vendor/GLTFLoader.js";

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

class LenaAssistant3D {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.canvas.lenaRenderer = this;
    this.compact = Boolean(options.compact);
    this.lookX = -0.56;
    this.lookY = 0.42;
    this.targetX = -0.56;
    this.targetY = 0.42;
    this.start = performance.now();
    this.nextBlink = this.start + 1700 + Math.random() * 2400;
    this.blinkStart = 0;
    this.loaded = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      premultipliedAlpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.compact ? 27 : 25, 1, 0.1, 100);
    this.camera.position.set(0, this.compact ? 0.25 : -0.2, 8);

    const ambient = new THREE.HemisphereLight(0xffe3bd, 0x111827, 2.0);
    const key = new THREE.DirectionalLight(0xffcc91, 4.4);
    const fill = new THREE.DirectionalLight(0x9db9ff, 2.6);
    const rim = new THREE.DirectionalLight(0xff8b2f, 3.5);
    key.position.set(-3.5, 3.8, 5.5);
    fill.position.set(3.2, 1.6, 4.2);
    rim.position.set(3.6, 3.2, -3.5);
    this.scene.add(ambient, key, fill, rim);

    this.frame = this.frame.bind(this);
    this.load();
    requestAnimationFrame(this.frame);
  }

  load() {
    new GLTFLoader().load(
      new URL("./assets/assistant/lena-robot-production.glb", import.meta.url).href,
      (gltf) => {
        this.model = gltf.scene;
        this.scene.add(this.model);

        this.head = this.model.getObjectByName("Head_Rig");
        this.eye = this.model.getObjectByName("Eye_Rig");
        this.jaw = this.model.getObjectByName("Jaw_Rig");
        this.lidL = this.model.getObjectByName("Eyelid_L");
        this.lidR = this.model.getObjectByName("Eyelid_R");
        this.body = this.model.getObjectByName("Body_Rig");
        this.neck = this.model.getObjectByName("Neck_Rig");

        this.model.traverse((node) => {
          if (/^(Crown_Center|Crown_Arch_|Temple_Seam_|Chest_Trim_)/.test(node.name)) {
            node.visible = false;
          }
          if (!node.isMesh) return;
          if (node.name === "Face_Shell" || node.name === "FBHead_mesh") {
            this.faceMesh = node;
            this.jawMorphIndex = node.morphTargetDictionary?.JawOpen;
          }
          node.frustumCulled = false;
          node.castShadow = false;
          node.receiveShadow = false;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => {
            if (!material) return;
            material.transparent = false;
            material.depthWrite = true;
            if (material.map) {
              material.map.colorSpace = THREE.SRGBColorSpace;
              material.map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
            }
          });
        });

        const focusObject = this.head || this.model;
        const focusBounds = new THREE.Box3().setFromObject(focusObject);
        const focusCenter = focusBounds.getCenter(new THREE.Vector3());
        const focusSize = focusBounds.getSize(new THREE.Vector3());
        const desiredHeadHeight = this.compact ? 3.35 : 3.12;
        const scale = desiredHeadHeight / Math.max(focusSize.y, 0.001);
        this.model.scale.setScalar(scale);
        this.model.position.set(
          -focusCenter.x * scale,
          -focusCenter.y * scale + (this.compact ? 0.10 : 0.22),
          -focusCenter.z * scale
        );
        this.modelBaseY = this.model.position.y;
        this.loaded = true;
        this.canvas.dispatchEvent(new CustomEvent("lena-model-ready"));
      },
      undefined,
      (error) => {
        this.canvas.closest(".lena-assistant")?.classList.add("has-character-fallback");
        console.warn("Lena GLB load failed:", error);
      }
    );
  }

  setLook(x, y) {
    this.targetX = clamp(x, -1, 1);
    this.targetY = clamp(y, -1, 1);
  }

  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(width * pixelRatio);
    const targetHeight = Math.round(height * pixelRatio);
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  frame(now) {
    this.resize();
    const dt = Math.min(0.05, (now - (this.lastFrame || now)) / 1000);
    this.lastFrame = now;
    const widget = this.canvas.closest(".lena-assistant");
    const speaking = widget?.classList.contains("is-speaking");
    const thinking = widget?.classList.contains("is-thinking");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.lookX = damp(this.lookX, this.targetX, 5.2, dt);
    this.lookY = damp(this.lookY, this.targetY, 5.2, dt);
    const t = (now - this.start) / 1000;
    const breath = reduced ? 0 : Math.sin(t * 1.08) * 0.012;
    const microYaw = reduced ? 0 : Math.sin(t * 0.42) * 0.008;
    const talk = speaking ? (0.5 + 0.5 * Math.sin(t * 13.2)) : 0;
    const think = thinking ? Math.sin(t * 1.9) * 0.025 : 0;

    if (now >= this.nextBlink && !this.blinkStart) {
      this.blinkStart = now;
      this.nextBlink = now + 2800 + Math.random() * 3900;
    }
    let blink = 0;
    if (this.blinkStart) {
      const phase = (now - this.blinkStart) / 180;
      blink = phase < 0.5 ? phase * 2 : Math.max(0, 2 - phase * 2);
      if (phase >= 1) this.blinkStart = 0;
    }

    if (this.loaded) {
      if (this.body) {
        this.body.rotation.y = this.lookX * 0.055 + microYaw;
        this.body.rotation.x = -this.lookY * 0.018 + breath;
      }
      if (this.neck) this.neck.rotation.y = this.lookX * 0.075;
      if (this.head) {
        this.head.rotation.y = this.lookX * 0.34 + microYaw;
        this.head.rotation.x = -this.lookY * 0.20 + think + breath;
        this.head.rotation.z = -this.lookX * 0.012;
      }
      if (this.eye) {
        this.eye.rotation.y = this.lookX * 0.13;
        this.eye.rotation.x = -this.lookY * 0.09;
      }
      [this.lidL, this.lidR].forEach((lid) => {
        if (lid) lid.scale.y = Math.max(0.06, 1 - blink * 0.94);
      });
      if (this.jaw) {
        this.jaw.rotation.x = speaking ? talk * 0.045 : 0;
        this.jaw.position.y = speaking ? -talk * 0.018 : 0;
      }
      if (
        this.faceMesh?.morphTargetInfluences &&
        Number.isInteger(this.jawMorphIndex)
      ) {
        this.faceMesh.morphTargetInfluences[this.jawMorphIndex] = speaking
          ? 0.28 + talk * 0.58
          : 0;
      }
      this.model.position.y = this.modelBaseY + breath;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.frame);
  }
}

window.LenaAssistant3D = LenaAssistant3D;
