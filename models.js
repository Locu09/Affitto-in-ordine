(() => {
  'use strict';

  const wrappers = [...document.querySelectorAll('[data-3d-scene]')];
  if (!wrappers.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const THREE = window.THREE;

  if (!THREE || !hasWebGL()) {
    wrappers.forEach(markFailed);
    return;
  }

  const INK = '#0a0d0a';
  const WALL = '#f7f2e7';
  const GLASS = '#bde8ed';
  const PATH = '#303a33';
  const SHADOW = '#0b100b';

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = (value, target, speed) => value + (target - value) * speed;

  let viewers = [];

  function cssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function palette() {
    return {
      lime: cssVar('--lime', '#dcff45'),
      lime2: cssVar('--lime-2', '#c2ed00'),
      violet: cssVar('--violet', '#8367ff'),
      coral: cssVar('--coral', '#ff6b4a'),
      mint: cssVar('--mint-strong', '#6ef0c0')
    };
  }

  function hasWebGL() {
    try {
      const probe = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (probe.getContext('webgl') || probe.getContext('experimental-webgl')));
    } catch (_) {
      return false;
    }
  }

  function failureTarget(wrapper) {
    return wrapper.classList.contains('model-feature')
      ? (wrapper.querySelector('.model-stage') || wrapper)
      : wrapper;
  }

  function markFailed(wrapper) {
    const target = failureTarget(wrapper);
    target.classList.add('is-3d-failed');
    const pause = wrapper.querySelector('[data-model-pause]');
    if (pause) pause.hidden = true;
  }

  function markReady(wrapper) {
    const target = failureTarget(wrapper);
    target.classList.add('is-3d-ready');
  }

  function makeMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.68,
      metalness: 0.02,
      flatShading: true,
      ...options
    });
  }

  function addEdges(mesh, opacity = 0.5, color = INK) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 24),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    edges.renderOrder = 2;
    mesh.add(edges);
    return mesh;
  }

  function addBox(parent, width, height, depth, material, x = 0, y = 0, z = 0, edges = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    if (edges) addEdges(mesh);
    parent.add(mesh);
    return mesh;
  }

  function addCylinder(parent, radiusTop, radiusBottom, height, material, x = 0, y = 0, z = 0, segments = 12) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
      material
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function roundedRectShape(width, height, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  function radialTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 126);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.46, 'rgba(255,255,255,0.28)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  const glowMap = radialTexture();

  function addGlow(parent, color, width = 4.8, opacity = 0.3) {
    const material = new THREE.MeshBasicMaterial({
      map: glowMap,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(width, width), material);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.205;
    glow.renderOrder = -1;
    parent.add(glow);
    return glow;
  }

  function coinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, 128, 128);
    context.translate(64, 64);
    context.rotate(-0.08);
    context.fillStyle = '#0a0d0a';
    context.font = '900 78px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('€', 0, 4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 4;
    return texture;
  }

  function makeCoin(radius, thickness, material, symbolMaterial) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, thickness, 32),
      material
    );
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius, thickness * 0.22, 6, 30),
      new THREE.MeshStandardMaterial({
        color: INK,
        roughness: 0.7,
        metalness: 0,
        transparent: true,
        opacity: 0.58
      })
    );
    group.add(rim);

    const faceGeometry = new THREE.CircleGeometry(radius * 0.66, 24);
    const front = new THREE.Mesh(faceGeometry, symbolMaterial);
    front.position.z = thickness * 0.52;
    group.add(front);

    const back = new THREE.Mesh(faceGeometry, symbolMaterial);
    back.position.z = -thickness * 0.52;
    back.rotation.y = Math.PI;
    group.add(back);

    return group;
  }

  function makeKey(accentMaterial, tagMaterial, trimMaterial, symbolMaterial) {
    const group = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.058, 9, 26),
      accentMaterial
    );
    ring.position.y = 0.39;
    group.add(ring);

    addBox(group, 0.085, 0.6, 0.085, accentMaterial, 0, 0.06, 0);
    addBox(group, 0.2, 0.078, 0.085, accentMaterial, 0.08, -0.19, 0);
    addBox(group, 0.145, 0.078, 0.085, accentMaterial, 0.045, -0.3, 0);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.09, 12),
      trimMaterial
    );
    collar.position.y = 0.27;
    group.add(collar);

    const tagShape = new THREE.Shape();
    tagShape.moveTo(-0.16, -0.13);
    tagShape.lineTo(-0.16, 0.03);
    tagShape.lineTo(0, 0.18);
    tagShape.lineTo(0.16, 0.03);
    tagShape.lineTo(0.16, -0.13);
    tagShape.closePath();
    const tagGeometry = new THREE.ExtrudeGeometry(tagShape, { depth: 0.065, bevelEnabled: false });
    tagGeometry.center();
    const tag = new THREE.Mesh(tagGeometry, tagMaterial);
    tag.position.set(0, 0.61, 0);
    addEdges(tag, 0.45);
    group.add(tag);

    const tagHole = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.012, 6, 16),
      trimMaterial
    );
    tagHole.position.set(0, 0.72, 0.035);
    group.add(tagHole);

    return group;
  }

  function makeSparkle(material, size, x, y, z) {
    const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), material);
    sparkle.position.set(x, y, z);
    return sparkle;
  }

  function buildHouse() {
    const group = new THREE.Group();
    const colors = palette();

    const wallMaterial = makeMaterial(WALL, { roughness: 0.8 });
    const roofMaterial = makeMaterial(colors.lime, { roughness: 0.52 });
    const trimMaterial = makeMaterial(INK, { roughness: 0.82 });
    const glassMaterial = makeMaterial(GLASS, { roughness: 0.22, metalness: 0.1 });
    const doorMaterial = makeMaterial(colors.violet, { roughness: 0.58 });
    const awningMaterial = makeMaterial(colors.coral, { roughness: 0.58 });
    const treeMaterial = makeMaterial(colors.mint, { roughness: 0.72 });
    const treeLightMaterial = makeMaterial(colors.lime, { roughness: 0.65 });
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: '#161a2f',
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true
    });
    const pathMaterial = makeMaterial(PATH, { roughness: 0.88 });
    const accentMaterial = makeMaterial(colors.lime, { roughness: 0.34, metalness: 0.32 });
    const coralMaterial = makeMaterial(colors.coral, { roughness: 0.5 });
    const violetMaterial = makeMaterial(colors.violet, { roughness: 0.55 });
    const coinMaterial = makeMaterial(colors.lime, { roughness: 0.35, metalness: 0.4 });
    const violetCoinMaterial = makeMaterial(colors.violet, { roughness: 0.4, metalness: 0.4 });
    const coinSymbol = new THREE.MeshBasicMaterial({
      map: coinTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false
    });
    const sparkleMaterial = new THREE.MeshBasicMaterial({ color: colors.lime, toneMapped: false });
    const sparkleCoral = new THREE.MeshBasicMaterial({ color: colors.coral, toneMapped: false });
    const smokeMaterial = new THREE.MeshStandardMaterial({
      color: '#f7f2e7',
      roughness: 1,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });

    /* Piattaforma arrotondata con griglia luminosa. */
    const platformShape = roundedRectShape(4.15, 3.12, 0.34);
    const platformGeometry = new THREE.ExtrudeGeometry(platformShape, {
      depth: 0.18,
      bevelEnabled: false
    });
    platformGeometry.rotateX(-Math.PI / 2);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.18;
    addEdges(platform, 0.38, colors.lime);
    group.add(platform);

    const grid = new THREE.GridHelper(2.85, 8, colors.lime, colors.lime);
    grid.position.y = 0.018;
    grid.material.transparent = true;
    grid.material.opacity = 0.15;
    grid.material.depthWrite = false;
    group.add(grid);

    const glow = addGlow(group, colors.lime, 5.5, 0.26);
    glow.userData.noFit = true;
    grid.userData.noFit = true;

    /* Casa. */
    const house = new THREE.Group();
    house.position.y = 0.02;
    group.add(house);

    addBox(house, 2.28, 1.53, 1.76, wallMaterial, 0, 0.765, 0);
    addBox(house, 0.18, 0.2, 1.8, trimMaterial, -1.1, 0.1, 0);
    addBox(house, 2.45, 0.12, 1.91, trimMaterial, 0, 0.06, 0);

    const roofShape = new THREE.Shape();
    roofShape.moveTo(-1.32, 0);
    roofShape.lineTo(0, 0.93);
    roofShape.lineTo(1.32, 0);
    roofShape.closePath();
    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
      depth: 1.98,
      bevelEnabled: false
    });
    roofGeometry.translate(0, 0, -0.99);
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.53;
    addEdges(roof, 0.52);
    house.add(roof);

    addBox(house, 2.48, 0.055, 0.08, trimMaterial, 0, 2.43, 0, false);
    addBox(house, 0.31, 0.62, 0.31, wallMaterial, 0.68, 2.03, -0.44);
    addBox(house, 0.41, 0.075, 0.41, trimMaterial, 0.68, 2.37, -0.44);

    /* Porta, gradino e tenda. */
    addBox(house, 0.52, 0.79, 0.08, trimMaterial, 0, 0.49, 0.89);
    addBox(house, 0.41, 0.68, 0.07, doorMaterial, 0, 0.47, 0.94);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), accentMaterial);
    handle.position.set(0.13, 0.47, 0.985);
    house.add(handle);
    addBox(house, 0.78, 0.1, 0.42, platformMaterial, 0, 0.06, 1.09);
    addBox(house, 1.03, 0.06, 0.4, awningMaterial, 0, 1.05, 1.02);

    /* Finestre frontali con telaio a croce. */
    [-0.64, 0.64].forEach((x) => {
      addBox(house, 0.47, 0.5, 0.08, trimMaterial, x, 1.09, 0.89);
      addBox(house, 0.34, 0.37, 0.025, glassMaterial, x, 1.09, 0.939);
      addBox(house, 0.035, 0.37, 0.03, trimMaterial, x, 1.09, 0.955, false);
      addBox(house, 0.34, 0.035, 0.03, trimMaterial, x, 1.09, 0.955, false);
    });

    /* Finestra laterale. */
    const sideWindow = new THREE.Group();
    sideWindow.position.set(1.146, 1.09, 0.08);
    sideWindow.rotation.y = Math.PI / 2;
    addBox(sideWindow, 0.46, 0.48, 0.07, trimMaterial, 0, 0, 0);
    addBox(sideWindow, 0.33, 0.35, 0.025, glassMaterial, 0, 0, 0.048);
    house.add(sideWindow);

    addBox(house, 0.22, 0.11, 0.03, accentMaterial, 0.66, 0.77, 0.94, false);

    /* Alberi bassi ai lati. */
    const treeOne = new THREE.Group();
    treeOne.position.set(-1.55, 0.02, -0.55);
    addCylinder(treeOne, 0.055, 0.07, 0.35, trimMaterial, 0, 0.175, 0, 6);
    const foliageOne = new THREE.Mesh(new THREE.IcosahedronGeometry(0.33, 0), treeMaterial);
    foliageOne.position.set(0, 0.53, 0);
    foliageOne.scale.set(1, 1.16, 0.94);
    addEdges(foliageOne, 0.34);
    treeOne.add(foliageOne);
    const foliageTwo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), treeLightMaterial);
    foliageTwo.position.set(0.2, 0.64, 0.06);
    addEdges(foliageTwo, 0.3);
    treeOne.add(foliageTwo);
    group.add(treeOne);

    const treeTwo = new THREE.Group();
    treeTwo.position.set(1.58, 0.02, -0.92);
    treeTwo.scale.setScalar(0.82);
    addCylinder(treeTwo, 0.05, 0.065, 0.32, trimMaterial, 0, 0.16, 0, 6);
    const foliageThree = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), treeLightMaterial);
    foliageThree.position.set(0, 0.48, 0);
    addEdges(foliageThree, 0.32);
    treeTwo.add(foliageThree);
    group.add(treeTwo);

    /* Sentiero e dettagli. */
    addBox(group, 0.58, 0.035, 0.85, pathMaterial, 0, 0.022, 1.12, false);
    addBox(group, 0.22, 0.05, 0.11, accentMaterial, -1.15, 0.025, 1.18, false);

    /* Chiave e monete che orbitano attorno alla casa. */
    const key = makeKey(accentMaterial, coralMaterial, trimMaterial, coinSymbol);
    key.position.set(-1.82, 1.92, 0.45);
    key.rotation.set(0.12, 0.26, -0.38);
    key.scale.setScalar(0.88);
    group.add(key);

    const coinOne = makeCoin(0.25, 0.06, coinMaterial, coinSymbol);
    coinOne.position.set(1.62, 1.62, 0.62);
    coinOne.rotation.set(0.25, 0.45, -0.18);
    group.add(coinOne);

    const coinTwo = makeCoin(0.18, 0.055, violetCoinMaterial, coinSymbol);
    coinTwo.position.set(1.83, 0.82, 0.92);
    coinTwo.rotation.set(0.52, -0.22, 0.3);
    group.add(coinTwo);

    const coinThree = makeCoin(0.15, 0.05, coralMaterial, coinSymbol);
    coinThree.position.set(1.55, 1.13, 1.06);
    coinThree.rotation.set(0.12, 0.25, 0.48);
    group.add(coinThree);

    const sparkles = [
      makeSparkle(sparkleMaterial, 0.075, -1.15, 2.25, 0.35),
      makeSparkle(sparkleCoral, 0.06, 1.35, 2.12, 0.2),
      makeSparkle(sparkleMaterial, 0.045, 0.25, 2.75, -0.25),
      makeSparkle(sparkleCoral, 0.05, -0.45, 1.95, 0.9)
    ];
    sparkles.forEach((sparkle) => group.add(sparkle));

    const smokePuffs = [];
    for (let i = 0; i < 3; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 7), smokeMaterial.clone());
      puff.position.set(0.68, 2.55 + i * 0.2, -0.44);
      puff.renderOrder = 1;
      group.add(puff);
      smokePuffs.push(puff);
    }

    const baseKeyY = key.position.y;
    const baseCoinPositions = [coinOne, coinTwo, coinThree].map((coin) => coin.position.clone());

    function tick(time) {
      const wave = time * 0.001;

      key.position.y = baseKeyY + Math.sin(wave * 1.6) * 0.09;
      key.rotation.z = -0.38 + Math.sin(wave * 0.9) * 0.08;
      key.rotation.y = 0.26 + Math.cos(wave * 0.72) * 0.15;

      [coinOne, coinTwo, coinThree].forEach((coin, index) => {
        const base = baseCoinPositions[index];
        coin.position.y = base.y + Math.sin(wave * 1.25 + index * 1.7) * 0.07;
        coin.rotation.y += 0.008 + index * 0.002;
        coin.rotation.z = base.z + Math.sin(wave * 0.8 + index) * 0.08;
      });

      sparkles.forEach((sparkle, index) => {
        sparkle.position.y += Math.sin(wave * 1.8 + index) * 0.00045;
        sparkle.rotation.y += 0.008;
        sparkle.rotation.x += 0.005;
      });

      smokePuffs.forEach((puff, index) => {
        const progress = (wave * 0.1 + index * 0.32) % 1;
        puff.position.y = 2.5 + progress * 0.72;
        puff.position.x = 0.68 + Math.sin(progress * 6.3) * 0.08;
        puff.scale.setScalar(0.7 + progress * 0.9);
        puff.material.opacity = 0.22 * (1 - progress);
      });
    }

    function updateColors() {
      const next = palette();
      roofMaterial.color.set(next.lime);
      doorMaterial.color.set(next.violet);
      awningMaterial.color.set(next.coral);
      treeMaterial.color.set(next.mint);
      treeLightMaterial.color.set(next.lime);
      accentMaterial.color.set(next.lime);
      coralMaterial.color.set(next.coral);
      violetMaterial.color.set(next.violet);
      coinMaterial.color.set(next.lime);
      violetCoinMaterial.color.set(next.violet);
      sparkleMaterial.color.set(next.lime);
      sparkleCoral.color.set(next.coral);
      glow.material.color.set(next.lime);
    }

    tick(0);
    updateColors();

    return { group, tick, updateColors, padding: 0.8 };
  }

  function buildKeyScene() {
    const group = new THREE.Group();
    const colors = palette();

    const keyMaterial = new THREE.MeshStandardMaterial({
      color: colors.lime,
      roughness: 0.36,
      metalness: 0.32,
      flatShading: true
    });
    const tagMaterial = makeMaterial(colors.coral, { roughness: 0.48 });
    const trimMaterial = makeMaterial(INK, { roughness: 0.78 });
    const violetMaterial = makeMaterial(colors.violet, { roughness: 0.44, metalness: 0.12 });
    const coralMaterial = makeMaterial(colors.coral, { roughness: 0.44, metalness: 0.12 });
    const coinMaterial = makeMaterial(colors.lime, { roughness: 0.32, metalness: 0.42 });
    const coinSymbol = new THREE.MeshBasicMaterial({
      map: coinTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false
    });
    const sparkleMaterial = new THREE.MeshBasicMaterial({ color: colors.lime, toneMapped: false });
    const sparkleViolet = new THREE.MeshBasicMaterial({ color: colors.violet, toneMapped: false });
    const glow = addGlow(group, colors.lime, 2.5, 0.24);
    glow.position.y = -0.58;
    glow.userData.noFit = true;

    const key = makeKey(keyMaterial, tagMaterial, trimMaterial, coinSymbol);
    key.position.set(-0.02, 0.04, 0);
    key.rotation.set(0.08, 0.28, -0.2);
    key.scale.setScalar(1.32);
    group.add(key);

    const coinOne = makeCoin(0.27, 0.065, coinMaterial, coinSymbol);
    coinOne.position.set(0.72, 0.2, 0.2);
    coinOne.rotation.set(0.32, 0.7, -0.28);
    group.add(coinOne);

    const coinTwo = makeCoin(0.19, 0.055, violetMaterial, coinSymbol);
    coinTwo.position.set(0.58, -0.31, 0.48);
    coinTwo.rotation.set(0.45, -0.2, 0.2);
    group.add(coinTwo);

    const coinThree = makeCoin(0.13, 0.05, coralMaterial, coinSymbol);
    coinThree.position.set(0.6, 0.53, 0.13);
    coinThree.rotation.set(0.1, 0.4, 0.6);
    group.add(coinThree);

    const sparkles = [
      makeSparkle(sparkleMaterial, 0.045, -0.65, 0.68, 0.12),
      makeSparkle(sparkleViolet, 0.04, 0.25, 0.72, 0.32),
      makeSparkle(sparkleMaterial, 0.035, -0.12, -0.52, 0.39)
    ];
    sparkles.forEach((sparkle) => group.add(sparkle));

    const baseKeyY = key.position.y;
    const coins = [coinOne, coinTwo, coinThree];
    const baseCoinPositions = coins.map((coin) => coin.position.clone());

    function tick(time) {
      const wave = time * 0.001;
      key.position.y = baseKeyY + Math.sin(wave * 1.7) * 0.055;
      key.rotation.z = -0.2 + Math.sin(wave * 1.1) * 0.07;
      key.rotation.y = 0.28 + Math.cos(wave * 0.85) * 0.1;

      coins.forEach((coin, index) => {
        const base = baseCoinPositions[index];
        coin.position.y = base.y + Math.sin(wave * 1.4 + index * 1.8) * 0.045;
        coin.rotation.y += 0.009 + index * 0.002;
        coin.rotation.z = base.z + Math.sin(wave * 0.9 + index) * 0.08;
      });

      sparkles.forEach((sparkle, index) => {
        sparkle.position.y += Math.sin(wave * 1.9 + index) * 0.0004;
        sparkle.rotation.y += 0.01;
      });
    }

    function updateColors() {
      const next = palette();
      keyMaterial.color.set(next.lime);
      tagMaterial.color.set(next.coral);
      violetMaterial.color.set(next.violet);
      coralMaterial.color.set(next.coral);
      coinMaterial.color.set(next.lime);
      sparkleMaterial.color.set(next.lime);
      sparkleViolet.color.set(next.violet);
      glow.material.color.set(next.lime);
    }

    tick(0);
    updateColors();

    return { group, tick, updateColors, padding: 0.92 };
  }

  function fitCamera(camera, object, aspect, padding = 1.12) {
    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3();
    const childBox = new THREE.Box3();
    object.traverse((child) => {
      if (!child.isMesh || child.userData.noFit || !child.geometry) return;
      child.geometry.computeBoundingBox();
      childBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
      box.union(childBox);
    });
    if (box.isEmpty()) box.setFromObject(object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 0.25));
    const distance = Math.max(
      sphere.radius / Math.sin(vFov / 2),
      sphere.radius / Math.sin(hFov / 2)
    ) * padding;
    const direction = new THREE.Vector3(0.92, 0.6, 1.15).normalize();

    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center.x, center.y - 0.06, center.z);
    camera.near = Math.max(0.05, distance - sphere.radius * 5);
    camera.far = distance + sphere.radius * 8;
    camera.updateProjectionMatrix();
  }

  class ModelViewer {
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.type = wrapper.getAttribute('data-3d-scene');
      this.isHouse = this.type === 'house';
      this.isAuto = wrapper.getAttribute('data-3d-mode') === 'auto';
      this.isDraggable = wrapper.hasAttribute('data-3d-drag');
      this.canvas = wrapper.querySelector('[data-3d-canvas]');
      this.stage = wrapper.classList.contains('model-feature')
        ? wrapper.querySelector('.model-stage')
        : wrapper;
      this.pauseButton = wrapper.querySelector('[data-model-pause]');
      this.pauseLabel = this.pauseButton ? this.pauseButton.querySelector('[data-model-pause-label]') : null;
      this.pointer = { x: 0, y: 0 };
      this.visible = true;
      this.paused = false;
      this.dragging = false;
      this.raf = 0;
      this.clock = new THREE.Clock();
      this.elapsed = 0;
      this.spin = this.isHouse ? -0.45 : -0.34;
      this.pitch = this.isHouse ? -0.035 : 0.08;
      this.dragStart = null;

      if (!this.canvas) {
        markFailed(wrapper);
        return;
      }

      this.reduce = reduceMotion.matches;
      this.fine = finePointer.matches;
      this.autoEnabled = this.isAuto && !this.reduce;
      this.model = this.type === 'house' ? buildHouse() : buildKeyScene();

      try {
        this.initRenderer();
      } catch (error) {
        markFailed(wrapper);
        return;
      }

      this.initListeners();
      this.fit();
      this.model.tick(0);
      this.stage.classList.add('is-3d-ready');
      this.setupPause();
      this.observeVisibility();
      this.renderNow();
      this.start();

      viewers.push(this);
    }

    initRenderer() {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'low-power'
      });
      this.renderer.setClearAlpha(0);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(31, 1, 0.1, 80);
      this.stageGroup = new THREE.Group();
      this.stageGroup.rotation.y = this.spin;
      this.stageGroup.rotation.x = this.pitch;
      this.stageGroup.add(this.model.group);
      this.scene.add(this.stageGroup);

      this.scene.add(new THREE.HemisphereLight(0xfff8e8, 0x231b3d, 1.05));
      const keyLight = new THREE.DirectionalLight(0xfff4dd, 1.55);
      keyLight.position.set(4.5, 7, 5);
      this.scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xa792ff, 0.6);
      rimLight.position.set(-4, 2.5, -4);
      this.scene.add(rimLight);

      this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.stop();
        markFailed(this.wrapper);
      });

      this.resize();
    }

    resize() {
      if (!this.renderer) return;
      const rect = this.stage.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (!width || !height) return;
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.fit();
      this.renderIfIdle();
    }

    fit() {
      if (!this.camera) return;
      fitCamera(this.camera, this.model.group, this.camera.aspect, this.isHouse ? 0.8 : 0.92);
    }

    setupPause() {
      if (!this.pauseButton) return;
      this.pauseButton.hidden = !this.autoEnabled;
      if (!this.autoEnabled) return;

      this.pauseButton.addEventListener('click', () => {
        this.paused = !this.paused;
        this.pauseButton.setAttribute('aria-pressed', String(this.paused));
        if (this.pauseLabel) {
          this.pauseLabel.textContent = this.paused ? 'Riprendi animazione 3D' : 'Ferma animazione 3D';
        }
        const icon = this.pauseButton.querySelector('use');
        if (icon) icon.setAttribute('href', this.paused ? '#i-play' : '#i-pause');
        if (this.paused) {
          this.stop();
          this.renderNow();
        } else {
          this.start();
        }
      });
    }

    initListeners() {
      this.onPointerMove = (event) => {
        if (!this.fine) return;
        this.pointer.x = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
        this.pointer.y = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
        if (!this.raf && !this.paused) this.start();
      };
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });

      this.onResize = () => this.resize();
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.stage);
      } else {
        window.addEventListener('resize', this.onResize);
      }

      this.onTheme = () => {
        this.model.updateColors();
        this.renderIfIdle();
      };
      window.addEventListener('aio:themechange', this.onTheme);

      this.onVisibility = () => {
        if (document.visibilityState === 'hidden') this.stop();
        else if (this.visible) this.start();
      };
      document.addEventListener('visibilitychange', this.onVisibility);

      this.onMotionChange = () => {
        this.reduce = reduceMotion.matches;
        this.autoEnabled = this.isAuto && !this.reduce;
        if (this.pauseButton) this.pauseButton.hidden = !this.autoEnabled;
        if (this.reduce) {
          this.stop();
          this.renderNow();
        } else {
          this.start();
        }
      };
      if (typeof reduceMotion.addEventListener === 'function') {
        reduceMotion.addEventListener('change', this.onMotionChange);
      }

      if (this.isDraggable) this.initDrag();
    }

    initDrag() {
      const canvas = this.canvas;
      canvas.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        this.dragging = true;
        this.dragStart = {
          x: event.clientX,
          y: event.clientY,
          spin: this.spin,
          pitch: this.pitch
        };
        canvas.setPointerCapture?.(event.pointerId);
        this.stage.classList.add('is-dragging');
        this.stage.classList.add('has-dragged');
        this.stop();
      }, { passive: true });

      canvas.addEventListener('pointermove', (event) => {
        if (!this.dragging || !this.dragStart) return;
        const dx = event.clientX - this.dragStart.x;
        const dy = event.clientY - this.dragStart.y;
        this.spin = this.dragStart.spin + dx * 0.008;
        this.pitch = clamp(this.dragStart.pitch + dy * 0.004, -0.24, 0.22);
        this.stageGroup.rotation.y = this.spin;
        this.stageGroup.rotation.x = this.pitch;
        this.model.tick(this.elapsed);
        this.renderNow();
      }, { passive: true });

      const endDrag = (event) => {
        if (!this.dragging) return;
        this.dragging = false;
        this.dragStart = null;
        this.stage.classList.remove('is-dragging');
        if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        if (!this.reduce) this.start();
      };
      canvas.addEventListener('pointerup', endDrag, { passive: true });
      canvas.addEventListener('pointercancel', endDrag, { passive: true });
      canvas.addEventListener('lostpointercapture', endDrag, { passive: true });
    }

    observeVisibility() {
      if (!('IntersectionObserver' in window)) return;
      this.visibilityObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        this.visible = entry.isIntersecting;
        if (this.visible) this.start();
        else this.stop();
      }, { rootMargin: '180px' });
      this.visibilityObserver.observe(this.stage);
    }

    shouldAnimate() {
      return !this.reduce && !this.paused && this.visible && document.visibilityState !== 'hidden';
    }

    start() {
      if (this.raf || !this.shouldAnimate()) return;
      this.clock.getDelta();
      const frame = () => {
        this.raf = 0;
        if (!this.shouldAnimate()) return;
        const dt = Math.min(this.clock.getDelta(), 0.05);
        this.elapsed += dt * 1000;
        this.update(dt);
        this.model.tick(this.elapsed);
        this.renderer.render(this.scene, this.camera);
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }

    stop() {
      if (!this.raf) return;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }

    update(dt) {
      if (this.isHouse && this.autoEnabled && !this.dragging) {
        this.spin += dt * 0.14;
      }

      const pointerStrength = this.isHouse ? 0.08 : 0.32;
      const pitchStrength = this.isHouse ? 0.035 : 0.12;
      const pointerYaw = this.fine ? this.pointer.x * pointerStrength : 0;
      const pointerPitch = this.fine ? this.pointer.y * pitchStrength : 0;
      const targetYaw = this.spin + pointerYaw;
      const targetPitch = this.pitch + pointerPitch;

      if (this.dragging) {
        this.stageGroup.rotation.y = this.spin;
        this.stageGroup.rotation.x = this.pitch;
      } else {
        this.stageGroup.rotation.y = ease(this.stageGroup.rotation.y, targetYaw, 0.1);
        this.stageGroup.rotation.x = ease(this.stageGroup.rotation.x, targetPitch, 0.1);
      }
    }

    renderNow() {
      if (!this.renderer) return;
      this.model.tick(this.elapsed);
      this.renderer.render(this.scene, this.camera);
    }

    renderIfIdle() {
      if (!this.raf) this.renderNow();
    }
  }

  function createViewer(wrapper) {
    try {
      return new ModelViewer(wrapper);
    } catch (error) {
      markFailed(wrapper);
      return null;
    }
  }

  wrappers.forEach(createViewer);

})();
