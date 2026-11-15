/**
 * public/js/core_mcu.js
 *
 * J.A.R.V.I.S. — 1:1 Marvel Cinematic Universe Holographic Neural Sphere Core
 * Exact recreation of the iconic golden/amber spherical AI core from Avengers: Age of Ultron:
 *
 * 1. Central Radiant Fusion Core & White-Hot Iris with Additive Glow Sprite
 *    - All depthWrite & depthTest configured to false to completely eliminate black box clipping
 * 2. Dynamic Processing Architecture:
 *    - When processing a query, all 3D armillary rings, astrolabe calipers, and synaptic filaments
 *      twist, turn, and precess rapidly along independent gyroscopic axes
 * 3. Film-Accurate Spoken Vocal Pulsing:
 *    - Whenever J.A.R.V.I.S. speaks (via PC audio or Google Nest Mini), the core expands rhythmically,
 *      flares with incandescent brilliance, and radiates concentric acoustic shockwave ripples
 * 4. Volumetric Golden Starlight Matrix (4,200+ neural photon particles)
 * 5. Interactive Touch/Mouse Orbit Drag with Inertia Damping
 */

(function () {
  'use strict';

  const container = document.getElementById('webgl-core-container');
  const canvas = document.getElementById('three-core-canvas');

  if (!container || !canvas || !(window.THREE || (typeof THREE !== 'undefined' ? THREE : null))) {
    console.warn('[CoreMCU] WebGL container or Three.js library not available.');
    return;
  }

  // ==========================================================
  // 1. SCENE, CAMERA & RENDERER SETUP
  // ==========================================================
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 29);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Master Stage Group
  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  // Cinematic 1:1 Stark Amber / Gold Palette
  let primaryHex = 0xffaa00;    // Rich glowing amber
  let lightHex = 0xffe082;      // Bright golden yellow
  let deepHex = 0xff6f00;       // Deep incandescent orange
  let coreWhiteHex = 0xffffff;  // Blazing core white

  // Particle Glow Texture Canvas (100% transparent background with smooth radial falloff)
  function createParticleTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 235, 160, 0.95)');
    grad.addColorStop(0.45, 'rgba(255, 170, 0, 0.55)');
    grad.addColorStop(0.75, 'rgba(255, 110, 0, 0.15)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  const glowTex = createParticleTexture();

  // ==========================================================
  // 2. CENTRAL INCANDESCENT FUSION CORE & IRIS
  // ==========================================================
  const irisGroup = new THREE.Group();
  stageGroup.add(irisGroup);

  // Core Corona Glow Sprite (depthWrite: false, depthTest: false to eliminate any black box occlusion)
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: primaryHex,
    transparent: true,
    opacity: 0.96,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const coreSprite = new THREE.Sprite(spriteMat);
  coreSprite.scale.set(7.5, 7.5, 1.0);
  irisGroup.add(coreSprite);

  // Inner White-Hot Fusion Iris Sphere
  const coreGeo = new THREE.SphereGeometry(0.9, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: coreWhiteHex,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  irisGroup.add(coreMesh);

  // Concentric Aperture Rings (high-speed counter-rotating polygon iris)
  const irisRings = [];
  const ringFacets = [6, 8, 12, 16, 24, 32];
  const ringRadii = [1.3, 1.9, 2.6, 3.4, 4.3, 5.2];

  ringRadii.forEach((r, idx) => {
    const facets = ringFacets[idx];
    const pts = [];
    for (let i = 0; i <= facets; i++) {
      const theta = (i / facets) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color: idx % 2 === 0 ? lightHex : primaryHex,
      transparent: true,
      opacity: 0.75 - idx * 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1
    });
    const line = new THREE.Line(g, m);
    irisGroup.add(line);
    irisRings.push({ line, speed: (idx % 2 === 0 ? 1 : -1) * (0.012 + idx * 0.005) });
  });

  // ==========================================================
  // 3. 3D GYROSCOPIC ARMILLARY GREAT CIRCLES (SPHERICAL SHELL)
  // ==========================================================
  const gimbalGroup = new THREE.Group();
  stageGroup.add(gimbalGroup);
  const gimbalRings = [];

  const armillaryConfigs = [
    { radius: 6.8, axis: new THREE.Vector3(1, 0.25, 0).normalize(), speed: 0.007, opacity: 0.65 },
    { radius: 8.2, axis: new THREE.Vector3(0, 1, 0.35).normalize(), speed: -0.006, opacity: 0.60 },
    { radius: 9.2, axis: new THREE.Vector3(0.5, 0.8, 0.4).normalize(), speed: 0.005, opacity: 0.70 },
    { radius: 10.2, axis: new THREE.Vector3(0.8, -0.5, 0.3).normalize(), speed: -0.004, opacity: 0.65 },
    { radius: 10.8, axis: new THREE.Vector3(0.2, 0.3, 1.0).normalize(), speed: 0.006, opacity: 0.75 },
    { radius: 11.4, axis: new THREE.Vector3(-0.7, 0.6, 0.3).normalize(), speed: -0.005, opacity: 0.55 },
    { radius: 11.8, axis: new THREE.Vector3(0.4, -0.8, 0.4).normalize(), speed: 0.004, opacity: 0.50 }
  ];

  armillaryConfigs.forEach(cfg => {
    const pts = [];
    const segs = 120;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * cfg.radius, Math.sin(a) * cfg.radius, 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Line(g, m);
    gimbalGroup.add(ring);
    gimbalRings.push({ ring, axis: cfg.axis, speed: cfg.speed });
  });

  // ==========================================================
  // 4. PRECISION CALIPER SCALES WITH TICK MARKS & DEGREE INDICES
  // ==========================================================
  const caliperGroup = new THREE.Group();
  stageGroup.add(caliperGroup);

  function createCaliperScale(radius, tickCount, tickLength, rotSpeed, is3D = false, axis = null) {
    const positions = [];
    for (let i = 0; i < tickCount; i++) {
      const angle = (i / tickCount) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const len = isMajor ? tickLength * 2.0 : tickLength;
      const r1 = radius;
      const r2 = radius + len;
      positions.push(
        Math.cos(angle) * r1, Math.sin(angle) * r1, 0,
        Math.cos(angle) * r2, Math.sin(angle) * r2, 0
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const m = new THREE.LineBasicMaterial({
      color: lightHex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const segments = new THREE.LineSegments(g, m);
    caliperGroup.add(segments);
    return { segments, rotSpeed, axis };
  }

  const calipers = [
    createCaliperScale(5.8, 72, 0.25, 0.005),
    createCaliperScale(7.6, 96, 0.32, -0.004),
    createCaliperScale(9.6, 128, 0.38, 0.003),
    createCaliperScale(11.2, 144, 0.45, -0.0025)
  ];

  // ==========================================================
  // 5. STEPPED CIRCUITRY ARCS & HOLOGRAPHIC DATA BRACKETS
  // ==========================================================
  const circuitGroup = new THREE.Group();
  stageGroup.add(circuitGroup);

  function createSteppedCircuitArcs() {
    const circuitPoints = [];
    const arcBands = [
      { r: 7.0, startAngle: 0.2, endAngle: 1.8, steps: 24, zOffset: 1.5 },
      { r: 7.0, startAngle: 3.4, endAngle: 5.0, steps: 24, zOffset: -1.5 },
      { r: 8.8, startAngle: 1.0, endAngle: 2.6, steps: 32, zOffset: 2.2 },
      { r: 8.8, startAngle: 4.2, endAngle: 5.8, steps: 32, zOffset: -2.2 },
      { r: 10.4, startAngle: 0.5, endAngle: 2.1, steps: 40, zOffset: 3.0 },
      { r: 10.4, startAngle: 3.7, endAngle: 5.3, steps: 40, zOffset: -3.0 },
      { r: 11.6, startAngle: 2.0, endAngle: 3.6, steps: 36, zOffset: 1.0 },
      { r: 11.6, startAngle: 5.2, endAngle: 6.8, steps: 36, zOffset: -1.0 }
    ];

    arcBands.forEach(band => {
      const angleSpan = band.endAngle - band.startAngle;
      for (let i = 0; i < band.steps; i++) {
        const a1 = band.startAngle + (i / band.steps) * angleSpan;
        const a2 = band.startAngle + ((i + 1) / band.steps) * angleSpan;

        // Base circular arc segment
        const x1 = Math.cos(a1) * band.r;
        const y1 = Math.sin(a1) * band.r;
        const x2 = Math.cos(a2) * band.r;
        const y2 = Math.sin(a2) * band.r;
        circuitPoints.push(x1, y1, band.zOffset, x2, y2, band.zOffset);

        // Radial stepped circuit traces (every 3rd step)
        if (i % 3 === 0) {
          const stepR = band.r + 0.45;
          const sx = Math.cos(a1) * stepR;
          const sy = Math.sin(a1) * stepR;
          circuitPoints.push(x1, y1, band.zOffset, sx, sy, band.zOffset);

          // Horizontal bracket cap
          const capAngle = a1 + 0.04;
          circuitPoints.push(
            sx, sy, band.zOffset,
            Math.cos(capAngle) * stepR, Math.sin(capAngle) * stepR, band.zOffset
          );
        }
      }
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(circuitPoints, 3));
    const m = new THREE.LineBasicMaterial({
      color: primaryHex,
      transparent: true,
      opacity: 0.70,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    return new THREE.LineSegments(g, m);
  }

  const circuitMesh = createSteppedCircuitArcs();
  circuitGroup.add(circuitMesh);

  // ==========================================================
  // 6. VOLUMETRIC SYNAPTIC NEURAL FILAMENTS (BRAIN ARCS)
  // ==========================================================
  const filamentGroup = new THREE.Group();
  stageGroup.add(filamentGroup);

  const filamentCount = 42;
  const filamentLines = [];

  for (let i = 0; i < filamentCount; i++) {
    const innerRadius = 2.0 + Math.random() * 1.5;
    const outerRadius = 8.5 + Math.random() * 3.0;

    const phi1 = Math.random() * Math.PI * 2;
    const theta1 = (Math.random() - 0.5) * Math.PI;
    const p1 = new THREE.Vector3(
      innerRadius * Math.cos(theta1) * Math.cos(phi1),
      innerRadius * Math.cos(theta1) * Math.sin(phi1),
      innerRadius * Math.sin(theta1)
    );

    const phi2 = phi1 + (Math.random() - 0.5) * 1.8;
    const theta2 = theta1 + (Math.random() - 0.5) * 1.5;
    const p2 = new THREE.Vector3(
      outerRadius * Math.cos(theta2) * Math.cos(phi2),
      outerRadius * Math.cos(theta2) * Math.sin(phi2),
      outerRadius * Math.sin(theta2)
    );

    const midPoint = p1.clone().add(p2).multiplyScalar(0.5);
    midPoint.normalize().multiplyScalar(outerRadius * 0.75 + Math.random() * 2.0);

    const curve = new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
    const curvePoints = curve.getPoints(24);
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({
      color: i % 3 === 0 ? lightHex : primaryHex,
      transparent: true,
      opacity: 0.35 + Math.random() * 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const curveLine = new THREE.Line(curveGeo, curveMat);
    filamentGroup.add(curveLine);
    filamentLines.push({ line: curveLine, baseOpacity: curveMat.opacity });
  }

  // ==========================================================
  // 7. 24 RADIAL ASTROLABE SPINES WITH CROSSBAR CALIPERS
  // ==========================================================
  const spokeGroup = new THREE.Group();
  stageGroup.add(spokeGroup);
  const spokePositions = [];

  const spokeCount = 24;
  const innerR = 1.6;
  const outerR = 11.6;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const x1 = Math.cos(angle) * innerR;
    const y1 = Math.sin(angle) * innerR;
    const x2 = Math.cos(angle) * outerR;
    const y2 = Math.sin(angle) * outerR;
    spokePositions.push(x1, y1, 0, x2, y2, 0);

    const crossbarRadii = [3.6, 5.6, 7.8, 9.8, 11.0];
    crossbarRadii.forEach(d => {
      const cx = Math.cos(angle) * d;
      const cy = Math.sin(angle) * d;
      const perpAngle = angle + Math.PI / 2;
      const hlen = 0.28;
      spokePositions.push(
        cx - Math.cos(perpAngle) * hlen, cy - Math.sin(perpAngle) * hlen, 0,
        cx + Math.cos(perpAngle) * hlen, cy + Math.sin(perpAngle) * hlen, 0
      );
    });
  }

  const spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokePositions, 3));
  const spokeMat = new THREE.LineBasicMaterial({
    color: lightHex,
    transparent: true,
    opacity: 0.50,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const spokes = new THREE.LineSegments(spokeGeo, spokeMat);
  spokeGroup.add(spokes);

  // ==========================================================
  // 8. ACOUSTIC SHOCKWAVE WAVEFRONT RIPPLES (VOICE PULSE SYSTEM)
  // ==========================================================
  const shockwaveGroup = new THREE.Group();
  stageGroup.add(shockwaveGroup);

  const shockwavePoolSize = 10;
  const shockwaves = [];

  for (let i = 0; i < shockwavePoolSize; i++) {
    const pts = [];
    const segs = 96;
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({
      color: lightHex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 2
    });
    const ring = new THREE.Line(g, m);
    // Alternate tilt slightly for rich 3D acoustic ripples
    ring.rotation.x = (i % 3 - 1) * 0.25;
    ring.rotation.y = ((i % 4) - 1.5) * 0.25;
    shockwaveGroup.add(ring);
    shockwaves.push({
      mesh: ring,
      currentRadius: 1.0 + (i / shockwavePoolSize) * 13.0,
      speed: 0.16 + (i % 3) * 0.02
    });
  }

  // ==========================================================
  // 9. VOLUMETRIC GOLDEN STARLIGHT MATRIX (NEURAL PHOTONS)
  // ==========================================================
  const particleCount = 4200;
  const pPositions = new Float32Array(particleCount * 3);
  const pScales = new Float32Array(particleCount);
  const pBaseRadii = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(1 - 2 * (i / particleCount));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.4 + Math.pow(Math.random(), 0.7) * 9.6;
    pBaseRadii[i] = r;

    pPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pPositions[i * 3 + 2] = r * Math.cos(phi);
    pScales[i] = 0.5 + Math.random() * 1.6;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  particleGeo.setAttribute('scale', new THREE.BufferAttribute(pScales, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.50,
    map: glowTex,
    color: primaryHex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleCloud = new THREE.Points(particleGeo, particleMat);
  stageGroup.add(particleCloud);

  // ==========================================================
  // 10. REAL-TIME AUDIO IMPULSE & PROCESSING CONTROLLERS
  // ==========================================================
  let vocalImpulse = 0.0;
  let targetVocalImpulse = 0.0;
  let simulatedSpeechTimer = 0.0;

  // Processing Controller (makes components twist and turn rapidly)
  let isProcessing = false;
  let processingImpulse = 0.0;

  window.jarvisCoreSetAudioPulsing = function (val) {
    targetVocalImpulse = Math.max(0, Math.min(1.0, val));
  };

  window.jarvisCoreTriggerSpeechAnimation = function (durationSec = 3.5) {
    simulatedSpeechTimer = durationSec;
  };

  window.jarvisCoreSetProcessing = function (val) {
    isProcessing = !!val;
  };

  window.jarvisCoreSetTheme = function (theme) {
    if (theme === 'arc_cyan') {
      primaryHex = 0x00f0ff;
      lightHex = 0xbbf7fd;
      deepHex = 0x0284c7;
    } else if (theme === 'obsidian') {
      primaryHex = 0x38bdf8;
      lightHex = 0xe0f2fe;
      deepHex = 0x0369a1;
    } else {
      primaryHex = 0xffaa00;
      lightHex = 0xffe082;
      deepHex = 0xff6f00;
    }
    spriteMat.color.setHex(primaryHex);
    particleMat.color.setHex(primaryHex);
    spokeMat.color.setHex(lightHex);
    circuitMesh.material.color.setHex(primaryHex);
    calipers.forEach(c => c.segments.material.color.setHex(lightHex));
    gimbalRings.forEach(g => g.ring.material.color.setHex(primaryHex));
  };

  // ==========================================================
  // 11. INTERACTIVE MOUSE / TOUCH ORBIT MOMENTUM DRAG
  // ==========================================================
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;

  window.addEventListener('mousedown', (e) => {
    if (e.target.id === 'three-core-canvas' || e.target.id === 'webgl-core-container') {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    targetRotY += dx * 0.005;
    targetRotX += dy * 0.005;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mouseleave', () => { isDragging = false; });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && (e.target.id === 'three-core-canvas' || e.target.id === 'webgl-core-container')) {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - prevMouseX;
    const dy = e.touches[0].clientY - prevMouseY;
    prevMouseX = e.touches[0].clientX;
    prevMouseY = e.touches[0].clientY;
    targetRotY += dx * 0.006;
    targetRotX += dy * 0.006;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // ==========================================================
  // 12. ANIMATION LOOP (MCU 1:1 AGE OF ULTRON CORE DYNAMICS)
  // ==========================================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // 1. Process Simulated Speech Waveform for Nest Speaker mode
    if (simulatedSpeechTimer > 0) {
      simulatedSpeechTimer -= delta;
      // Multi-harmonic vocal waveform rhythm
      const simAmp = 0.50 + Math.sin(time * 16.0) * 0.30 + Math.sin(time * 28.0) * 0.20;
      targetVocalImpulse = Math.max(targetVocalImpulse, Math.max(0.15, simAmp));
    }

    // Smooth vocal impulse transition
    vocalImpulse += (targetVocalImpulse - vocalImpulse) * 0.20;

    // Smooth processing impulse transition (0.0 idle to 1.0 active)
    const targetProcessing = isProcessing ? 1.0 : 0.0;
    processingImpulse += (targetProcessing - processingImpulse) * 0.12;

    // Interactive rotation with smooth damping + idle spherical drift + processing tumbling
    curRotX += (targetRotX - curRotX) * 0.08;
    curRotY += (targetRotY - curRotY) * 0.08;

    const driftSpeed = 0.045 + processingImpulse * 0.09;
    stageGroup.rotation.x = curRotX + Math.sin(time * (0.35 + processingImpulse * 1.5)) * (0.07 + processingImpulse * 0.22);
    stageGroup.rotation.y = curRotY + time * driftSpeed;
    if (processingImpulse > 0.01) {
      stageGroup.rotation.z = Math.sin(time * 2.2) * 0.12 * processingImpulse;
    }

    // ==========================================================
    // FILM-ACCURATE CORE EXPANSION & PULSE OUT
    // ==========================================================
    // The entire spherical lattice pulses outward when J.A.R.V.I.S. speaks
    const spherePulseScale = 1.0 + vocalImpulse * 0.20 + (processingImpulse > 0.01 ? Math.sin(time * 8.0) * 0.04 * processingImpulse : 0.0);
    stageGroup.scale.set(spherePulseScale, spherePulseScale, spherePulseScale);

    // Central Radiant Iris Core Scaling & Incandescent Flaring
    const irisPulse = 1.0 + Math.sin(time * 2.8) * 0.05 + vocalImpulse * 0.90 + processingImpulse * 0.35;
    irisGroup.scale.set(irisPulse, irisPulse, irisPulse);
    coreSprite.scale.set(7.5 * irisPulse, 7.5 * irisPulse, 1.0);
    spriteMat.opacity = 0.85 + vocalImpulse * 0.15;

    // 1. Concentric Iris Aperture Counter-Spinning
    irisRings.forEach(r => {
      r.line.rotation.z += r.speed * (1.0 + vocalImpulse * 3.5 + processingImpulse * 7.0);
    });

    // 2. Armillary Great Circles Gyroscopic Tumbling & Twisting (Age of Ultron mechanics)
    gimbalRings.forEach((g, idx) => {
      const ringSpeed = g.speed * (1.0 + vocalImpulse * 2.5 + processingImpulse * 5.5);
      g.ring.rotateOnAxis(g.axis, ringSpeed);

      // Components twist and turn dynamically on multiple axes during processing
      if (processingImpulse > 0.01) {
        g.ring.rotation.x += Math.sin(time * 3.2 + idx * 1.2) * 0.03 * processingImpulse;
        g.ring.rotation.y += Math.cos(time * 2.7 + idx * 0.9) * 0.025 * processingImpulse;
        g.ring.rotation.z += Math.sin(time * 3.8 + idx * 1.5) * 0.02 * processingImpulse;
      }
    });

    // 3. Caliper Scales Counter-Rotation & Processing Oscillation
    calipers.forEach((c, idx) => {
      c.segments.rotation.z += c.rotSpeed * (1.0 + vocalImpulse * 2.2 + processingImpulse * 4.5);
      if (processingImpulse > 0.01) {
        c.segments.rotation.x = Math.sin(time * 3.5 + idx) * 0.15 * processingImpulse;
      }
    });

    // 4. Stepped Circuitry Group Rotation
    circuitGroup.rotation.z = -time * 0.02 * (1.0 + vocalImpulse * 1.5 + processingImpulse * 4.0);
    circuitGroup.rotation.y = Math.sin(time * (0.2 + processingImpulse * 2.0)) * (0.08 + processingImpulse * 0.18);

    // 5. Synaptic Neural Filaments Undulation & Thought Flickers
    filamentGroup.rotation.y = time * (0.015 + processingImpulse * 0.07);
    if (processingImpulse > 0.01) {
      filamentGroup.rotation.z = Math.sin(time * 2.8) * 0.1 * processingImpulse;
    }
    filamentLines.forEach((f, idx) => {
      const flicker = processingImpulse > 0.01 ? (0.5 + Math.sin(time * 16.0 + idx * 2.5) * 0.5) * 0.45 : 0;
      f.line.material.opacity = f.baseOpacity * (0.8 + Math.sin(time * 3.0 + idx) * 0.2 + vocalImpulse * 0.8 + flicker);
    });

    // 6. Astrolabe Spokes Caliper Wobble & Twisting
    spokeGroup.rotation.z = Math.sin(time * (0.25 + processingImpulse * 3.5)) * (0.05 + processingImpulse * 0.25);
    if (processingImpulse > 0.01) {
      spokeGroup.rotation.x = Math.cos(time * 2.5) * 0.12 * processingImpulse;
    }

    // 7. Dynamic Acoustic Shockwave Wavefront Ripples (Radiates out when speaking)
    shockwaves.forEach((sw, idx) => {
      const swSpeed = sw.speed * (1.0 + vocalImpulse * 3.2 + processingImpulse * 1.4);
      sw.currentRadius += swSpeed;
      if (sw.currentRadius > 13.5) {
        sw.currentRadius = 1.0;
      }
      sw.mesh.scale.set(sw.currentRadius, sw.currentRadius, 1.0);

      // Acoustic envelope: burst bright near center, fade out towards the outer shell
      const progress = (sw.currentRadius - 1.0) / (13.5 - 1.0);
      let op = Math.sin(progress * Math.PI) * (0.25 + vocalImpulse * 0.85);
      sw.mesh.material.opacity = Math.max(0.0, Math.min(1.0, op));
      sw.mesh.rotation.z += 0.005 * (1.0 + processingImpulse * 2.0);
    });

    // 8. Volumetric Golden Particle Swarm (expands radially with speech)
    particleCloud.rotation.y = -time * (0.038 + processingImpulse * 0.08);
    particleCloud.rotation.x = Math.cos(time * (0.22 + processingImpulse * 1.5)) * (0.06 + processingImpulse * 0.15);
    particleCloud.scale.setScalar(1.0 + vocalImpulse * 0.18);
    particleMat.size = 0.50 + vocalImpulse * 0.35 + processingImpulse * 0.15;

    renderer.render(scene, camera);
  }

  animate();
  console.log('[CoreMCU] 1:1 Marvel Cinematic Holographic Neural Core Active.');
})();
