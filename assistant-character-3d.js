(() => {
  "use strict";

  const VERTEX_SHADER = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform mat4 uModel;
    uniform mat4 uViewProjection;
    uniform mat3 uNormalMatrix;
    varying vec3 vNormal;
    varying vec3 vWorld;
    void main() {
      vec4 world = uModel * vec4(aPosition, 1.0);
      vWorld = world.xyz;
      vNormal = normalize(uNormalMatrix * aNormal);
      gl_Position = uViewProjection * world;
    }
  `;

  const FRAGMENT_SHADER = `
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vWorld;
    uniform vec3 uColor;
    uniform vec3 uCamera;
    uniform float uMetallic;
    uniform float uGlow;
    void main() {
      vec3 n = normalize(vNormal);
      vec3 viewDir = normalize(uCamera - vWorld);
      vec3 keyDir = normalize(vec3(-0.55, 0.8, 0.75));
      vec3 rimDir = normalize(vec3(0.75, 0.25, -0.65));
      float diffuse = max(dot(n, keyDir), 0.0);
      float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.8);
      float spec = pow(max(dot(reflect(-keyDir, n), viewDir), 0.0), mix(28.0, 72.0, uMetallic));
      float goldRim = pow(max(dot(n, rimDir), 0.0), 3.0);
      vec3 color = uColor * (0.18 + diffuse * 0.72);
      color += vec3(1.0, 0.72, 0.32) * rim * (0.16 + uMetallic * 0.28);
      color += vec3(1.0, 0.82, 0.5) * spec * (0.2 + uMetallic * 0.7);
      color += vec3(0.95, 0.58, 0.2) * goldRim * uMetallic * 0.12;
      color += uColor * uGlow;
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const mat4 = {
    identity() {
      return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    },
    multiply(a, b) {
      const out = new Float32Array(16);
      for (let c = 0; c < 4; c += 1) {
        for (let r = 0; r < 4; r += 1) {
          out[c * 4 + r] =
            a[r] * b[c * 4] +
            a[4 + r] * b[c * 4 + 1] +
            a[8 + r] * b[c * 4 + 2] +
            a[12 + r] * b[c * 4 + 3];
        }
      }
      return out;
    },
    translation(x, y, z) {
      const m = mat4.identity();
      m[12] = x; m[13] = y; m[14] = z;
      return m;
    },
    scale(x, y, z) {
      const m = mat4.identity();
      m[0] = x; m[5] = y; m[10] = z;
      return m;
    },
    rotationX(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    },
    rotationY(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    },
    rotationZ(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
    },
    perspective(fov, aspect, near, far) {
      const f = 1 / Math.tan(fov / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect,0,0,0, 0,f,0,0,
        0,0,(far + near) * nf,-1,
        0,0,(2 * far * near) * nf,0
      ]);
    },
    lookAt(eye, target, up) {
      let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
      let len = Math.hypot(zx, zy, zz) || 1;
      zx /= len; zy /= len; zz /= len;
      let xx = up[1] * zz - up[2] * zy;
      let xy = up[2] * zx - up[0] * zz;
      let xz = up[0] * zy - up[1] * zx;
      len = Math.hypot(xx, xy, xz) || 1;
      xx /= len; xy /= len; xz /= len;
      const yx = zy * xz - zz * xy;
      const yy = zz * xx - zx * xz;
      const yz = zx * xy - zy * xx;
      return new Float32Array([
        xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
        -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
        -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
        -(zx*eye[0]+zy*eye[1]+zz*eye[2]),1
      ]);
    }
  };

  function compose(position, rotation, scale) {
    let m = mat4.translation(position[0], position[1], position[2]);
    m = mat4.multiply(m, mat4.rotationY(rotation[1]));
    m = mat4.multiply(m, mat4.rotationX(rotation[0]));
    m = mat4.multiply(m, mat4.rotationZ(rotation[2]));
    return mat4.multiply(m, mat4.scale(scale[0], scale[1], scale[2]));
  }

  function normalMatrix(model) {
    const a00=model[0], a01=model[1], a02=model[2];
    const a10=model[4], a11=model[5], a12=model[6];
    const a20=model[8], a21=model[9], a22=model[10];
    const b01=a22*a11-a12*a21, b11=-a22*a10+a12*a20, b21=a21*a10-a11*a20;
    let det=a00*b01+a01*b11+a02*b21;
    det = det ? 1/det : 1;
    return new Float32Array([
      b01*det,(-a22*a01+a02*a21)*det,(a12*a01-a02*a11)*det,
      b11*det,(a22*a00-a02*a20)*det,(-a12*a00+a02*a10)*det,
      b21*det,(-a21*a00+a01*a20)*det,(a11*a00-a01*a10)*det
    ]);
  }

  function sphereGeometry(lat = 20, lon = 28) {
    const positions = [], normals = [], indices = [];
    for (let y = 0; y <= lat; y += 1) {
      const v = y / lat, phi = v * Math.PI;
      for (let x = 0; x <= lon; x += 1) {
        const u = x / lon, theta = u * Math.PI * 2;
        const sx = Math.sin(phi) * Math.cos(theta);
        const sy = Math.cos(phi);
        const sz = Math.sin(phi) * Math.sin(theta);
        positions.push(sx, sy, sz);
        normals.push(sx, sy, sz);
      }
    }
    for (let y = 0; y < lat; y += 1) {
      for (let x = 0; x < lon; x += 1) {
        const a = y * (lon + 1) + x, b = a + lon + 1;
        indices.push(a,b,a+1, b,b+1,a+1);
      }
    }
    return { positions, normals, indices };
  }

  function cylinderGeometry(segments = 28) {
    const positions = [], normals = [], indices = [];
    for (let y = 0; y <= 1; y += 1) {
      for (let i = 0; i <= segments; i += 1) {
        const a = i / segments * Math.PI * 2;
        const x = Math.cos(a), z = Math.sin(a);
        positions.push(x, y * 2 - 1, z);
        normals.push(x, 0, z);
      }
    }
    for (let i = 0; i < segments; i += 1) {
      const a=i, b=i+segments+1;
      indices.push(a,b,a+1, b,b+1,a+1);
    }
    return { positions, normals, indices };
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  class LenaAssistant3D {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.compact = Boolean(options.compact);
      this.gl = canvas.getContext("webgl", {
        alpha: true, antialias: true, premultipliedAlpha: true
      });
      if (!this.gl) throw new Error("WebGL is not supported");
      this.lookX = -.56;
      this.lookY = .42;
      this.targetX = -.56;
      this.targetY = .42;
      this.blink = 0;
      this.nextBlink = performance.now() + 1600 + Math.random() * 2600;
      this.start = performance.now();
      this.setup();
      this.resize();
      this.frame = this.frame.bind(this);
      requestAnimationFrame(this.frame);
    }

    setup() {
      const gl = this.gl;
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      this.program = program;
      this.locations = {
        position: gl.getAttribLocation(program, "aPosition"),
        normal: gl.getAttribLocation(program, "aNormal"),
        model: gl.getUniformLocation(program, "uModel"),
        viewProjection: gl.getUniformLocation(program, "uViewProjection"),
        normalMatrix: gl.getUniformLocation(program, "uNormalMatrix"),
        color: gl.getUniformLocation(program, "uColor"),
        camera: gl.getUniformLocation(program, "uCamera"),
        metallic: gl.getUniformLocation(program, "uMetallic"),
        glow: gl.getUniformLocation(program, "uGlow")
      };
      this.meshes = {
        sphere: this.createMesh(sphereGeometry()),
        cylinder: this.createMesh(cylinderGeometry())
      };
      gl.enable(gl.DEPTH_TEST);
      // The procedural sphere/cylinder strips intentionally remain double-sided.
      // This also avoids disappearing meshes on WebGL implementations that
      // disagree about the winding of pole triangles.
      gl.disable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
    }

    createMesh(data) {
      const gl = this.gl;
      const position = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, position);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.positions), gl.STATIC_DRAW);
      const normal = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normal);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);
      const index = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);
      return { position, normal, index, count: data.indices.length };
    }

    setLook(x, y) {
      this.targetX = Math.max(-1, Math.min(1, x));
      this.targetY = Math.max(-1, Math.min(1, y));
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
    }

    draw(meshName, position, rotation, scale, color, metallic = .7, glow = 0, parent = null) {
      const gl = this.gl, mesh = this.meshes[meshName];
      const local = compose(position, rotation, scale);
      const model = parent ? mat4.multiply(parent, local) : local;
      gl.uniformMatrix4fv(this.locations.model, false, model);
      gl.uniformMatrix3fv(this.locations.normalMatrix, false, normalMatrix(model));
      gl.uniform3fv(this.locations.color, color);
      gl.uniform1f(this.locations.metallic, metallic);
      gl.uniform1f(this.locations.glow, glow);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.position);
      gl.enableVertexAttribArray(this.locations.position);
      gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normal);
      gl.enableVertexAttribArray(this.locations.normal);
      gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.index);
      gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }

    frame(now) {
      this.resize();
      const gl = this.gl;
      const widget = this.canvas.closest(".lena-assistant");
      const speaking = widget?.classList.contains("is-speaking");
      const thinking = widget?.classList.contains("is-thinking");
      this.lookX += (this.targetX - this.lookX) * .07;
      this.lookY += (this.targetY - this.lookY) * .07;
      if (now >= this.nextBlink) {
        this.blink = 1;
        this.nextBlink = now + 2600 + Math.random() * 4300;
      }
      this.blink = Math.max(0, this.blink - .1);
      const t = (now - this.start) / 1000;
      const breath = Math.sin(t * 1.15) * .025;
      const talk = speaking ? Math.abs(Math.sin(t * 12.5)) : 0;
      const think = thinking ? Math.sin(t * 2.2) * .055 : 0;

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      const aspect = this.canvas.width / this.canvas.height;
      const camera = this.compact ? [0, .76, 4.5] : [0, .04, 5.02];
      const cameraTarget = this.compact ? [0, .69, 0] : [0, .02, 0];
      const projection = mat4.perspective(this.compact ? .55 : .5, aspect, .1, 30);
      const view = mat4.lookAt(camera, cameraTarget, [0, 1, 0]);
      gl.uniformMatrix4fv(this.locations.viewProjection, false, mat4.multiply(projection, view));
      gl.uniform3fv(this.locations.camera, camera);

      const graphite = [.024, .027, .032];
      const graphiteSoft = [.065, .07, .082];
      const graphiteLight = [.12, .125, .14];
      const gold = [.76, .43, .12];
      const goldLight = [1.0, .68, .25];
      const amber = [1.0, .34, .018];
      const black = [.006, .006, .007];

      const bodyYaw = this.lookX * .17;
      const bodyPitch = this.lookY * -.045;
      const headYaw = this.lookX * .58;
      const headPitch = this.lookY * -.36 + think;
      const baseY = -.82 + breath;

      const body = compose([0, baseY, 0], [bodyPitch, bodyYaw, this.lookX * -.012], [1,1,1]);
      // Tapered torso and layered breastplate.
      this.draw("sphere", [0, 0, 0], [0,0,0], [1.12,.57,.5], graphite, .95, 0, body);
      this.draw("sphere", [0, .2, .38], [-.04,0,0], [.72,.3,.11], graphiteSoft, .82, 0, body);
      this.draw("sphere", [0, .03, .48], [0,0,0], [.12,.43,.055], gold, 1, .025, body);
      this.draw("sphere", [-.45,.19,.43], [0,0,-.34], [.5,.07,.06], gold, 1, .015, body);
      this.draw("sphere", [.45,.19,.43], [0,0,.34], [.5,.07,.06], gold, 1, .015, body);
      // Shoulder shells plus dark joints keep the silhouette mechanical.
      this.draw("sphere", [-.9,.09,-.015], [0,0,-.17], [.43,.36,.4], gold, 1, 0, body);
      this.draw("sphere", [.9,.09,-.015], [0,0,.17], [.43,.36,.4], gold, 1, 0, body);
      this.draw("sphere", [-.91,.03,.31], [0,0,-.17], [.29,.24,.12], graphite, .9, 0, body);
      this.draw("sphere", [.91,.03,.31], [0,0,.17], [.29,.24,.12], graphite, .9, 0, body);

      const neck = compose([0, .68, 0], [0, bodyYaw*.25, 0], [1,1,1]);
      this.draw("cylinder", [0,-.08,0], [0,0,0], [.245,.48,.245], graphite, .94, 0, neck);
      for (let i=0;i<5;i+=1) {
        this.draw("cylinder", [0,-.37+i*.155,.005], [0,0,0], [.275-i*.01,.028,.275-i*.01], gold, 1, .012, neck);
      }
      this.draw("sphere", [0,-.18,.22], [0,0,0], [.13,.37,.07], graphiteLight, .75, 0, neck);

      const hx = this.lookX * .075;
      const hy = .74 + this.lookY * .045 + breath;
      const head = compose([hx, hy, 0], [headPitch, headYaw, this.lookX * -.025], [1,1,1]);

      // Cranium, temple shells and a narrower jaw create a feminine android head.
      this.draw("sphere", [0,.14,-.01], [0,0,0], [.64,.75,.59], graphiteSoft, .9, 0, head);
      this.draw("sphere", [0,.46,-.025], [-.08,0,0], [.61,.48,.57], graphite, .98, 0, head);
      this.draw("sphere", [0,-.43,.035], [0,0,0], [.43,.34,.43], graphiteSoft, .88, 0, head);
      this.draw("sphere", [-.51,.05,-.015], [0,0,0], [.145,.27,.17], gold, 1, .012, head);
      this.draw("sphere", [.51,.05,-.015], [0,0,0], [.145,.27,.17], gold, 1, .012, head);
      this.draw("sphere", [-.515,.05,.075], [0,0,0], [.085,.17,.055], black, .4, 0, head);
      this.draw("sphere", [.515,.05,.075], [0,0,0], [.085,.17,.055], black, .4, 0, head);

      // Crown plates and gold seams.
      this.draw("sphere", [0,.69,.015], [0,0,0], [.17,.24,.53], gold, 1, .018, head);
      this.draw("sphere", [0,.67,.095], [0,0,0], [.1,.21,.49], graphite, .95, 0, head);
      this.draw("sphere", [-.31,.55,.005], [0,-.08,-.16], [.25,.16,.5], graphite, .98, 0, head);
      this.draw("sphere", [.31,.55,.005], [0,.08,.16], [.25,.16,.5], graphite, .98, 0, head);
      this.draw("sphere", [-.37,.45,.46], [0,0,-.15], [.24,.035,.055], gold, 1, .012, head);
      this.draw("sphere", [.37,.45,.46], [0,0,.15], [.24,.035,.055], gold, 1, .012, head);

      const eyeY = .14;
      const eyeZ = .548;
      const eyeOffset = .235;
      const eyeScaleY = Math.max(.018, .075 * (1 - this.blink));
      const gazeX = this.lookX * .055;
      const gazeY = -this.lookY * .035;
      // Recessed sockets, luminous eyes and independent pupils.
      this.draw("sphere", [-eyeOffset,eyeY,eyeZ-.018], [0,0,-.04], [.19,.105,.045], black, .25, 0, head);
      this.draw("sphere", [eyeOffset,eyeY,eyeZ-.018], [0,0,.04], [.19,.105,.045], black, .25, 0, head);
      this.draw("sphere", [-eyeOffset,eyeY,eyeZ], [0,0,-.04], [.145,eyeScaleY,.038], goldLight, .55, .22, head);
      this.draw("sphere", [eyeOffset,eyeY,eyeZ], [0,0,.04], [.145,eyeScaleY,.038], goldLight, .55, .22, head);
      this.draw("sphere", [-eyeOffset+gazeX,eyeY+gazeY,eyeZ+.04], [0,0,0], [.043,.052,.018], black, .2, 0, head);
      this.draw("sphere", [eyeOffset+gazeX,eyeY+gazeY,eyeZ+.04], [0,0,0], [.043,.052,.018], black, .2, 0, head);
      // Brows are armor seams; nose and cheek plates sit on the same head rig.
      this.draw("sphere", [-.235,.285,.525], [0,0,-.14], [.22,.034,.035], graphite, .8, 0, head);
      this.draw("sphere", [.235,.285,.525], [0,0,.14], [.22,.034,.035], graphite, .8, 0, head);
      this.draw("sphere", [0,-.045,.575], [.04,0,0], [.095,.225,.09], graphiteLight, .7, 0, head);
      this.draw("sphere", [-.31,-.105,.5], [0,0,-.22], [.22,.16,.035], graphite, .82, 0, head);
      this.draw("sphere", [.31,-.105,.5], [0,0,.22], [.22,.16,.035], graphite, .82, 0, head);
      // A separate lower jaw and inner mouth provide real speech articulation.
      this.draw("sphere", [0,-.31-talk*.012,.53], [0,0,0], [.255,.055+talk*.035,.03], black, .3, speaking ? .045 : 0, head);
      this.draw("sphere", [0,-.39-talk*.035,.32], [talk*.035,0,0], [.37,.16,.24], graphiteSoft, .84, 0, head);
      this.draw("sphere", [0,-.27-talk*.017,.555], [0,0,0], [.27,.035,.025], gold, .92, .01, head);

      requestAnimationFrame(this.frame);
    }
  }

  window.LenaAssistant3D = LenaAssistant3D;
})();
