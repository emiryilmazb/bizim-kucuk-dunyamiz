// ==========================================
// 🌍 Globe Renderer — realistic Earth (Three.js)
// ==========================================

const globeRenderer = (() => {
    const THREE_SRC = "https://unpkg.com/three@0.160.0/build/three.min.js";
    const EARTH_TEXTURE = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
    const CLOUD_TEXTURE = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";
    const EARTH_BUMP = "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg";

    let canvas = null;
    let running = false;
    let animId = null;

    let scene = null;
    let camera = null;
    let renderer = null;
    let earthMesh = null;
    let cloudMesh = null;
    let atmosphereMesh = null;
    let starField = null;

    let introActive = true;
    let introStart = 0;
    const INTRO_DURATION = 7600;

    let loadPromise = null;
    let setupPromise = null;
    let resizeBound = false;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeOutCubic(t) {
        const x = clamp(t, 0, 1);
        return 1 - Math.pow(1 - x, 3);
    }

    function ensureThree() {
        if (window.THREE) return Promise.resolve(window.THREE);
        if (loadPromise) return loadPromise;

        loadPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${THREE_SRC}"]`);
            if (existing) {
                existing.addEventListener("load", () => resolve(window.THREE), { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }
            const script = document.createElement("script");
            script.src = THREE_SRC;
            script.async = true;
            script.onload = () => resolve(window.THREE);
            script.onerror = reject;
            document.head.appendChild(script);
        });

        return loadPromise;
    }

    function loadTexture(loader, url) {
        return new Promise((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
        });
    }

    async function setupScene() {
        if (setupPromise) return setupPromise;
        setupPromise = (async () => {
            const THREE = await ensureThree();
            if (!canvas) return;

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
            camera.position.set(0, 0.18, 4.6);
            camera.lookAt(0, 0, 0);

            renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;

            const ambient = new THREE.AmbientLight(0xaac6ff, 0.68);
            scene.add(ambient);

            const sun = new THREE.DirectionalLight(0xffffff, 1.25);
            sun.position.set(5, 2, 3);
            scene.add(sun);

            const rim = new THREE.DirectionalLight(0x6ea2ff, 0.42);
            rim.position.set(-4, -2, -5);
            scene.add(rim);

            const loader = new THREE.TextureLoader();
            const [earthTex, cloudsTex, bumpTex] = await Promise.all([
                loadTexture(loader, EARTH_TEXTURE).catch(() => null),
                loadTexture(loader, CLOUD_TEXTURE).catch(() => null),
                loadTexture(loader, EARTH_BUMP).catch(() => null),
            ]);
            if (earthTex) earthTex.colorSpace = THREE.SRGBColorSpace;
            if (cloudsTex) cloudsTex.colorSpace = THREE.SRGBColorSpace;

            const earthGeo = new THREE.SphereGeometry(1, 80, 80);
            const earthMat = new THREE.MeshStandardMaterial({
                color: 0x2a61a8,
                map: earthTex || null,
                bumpMap: bumpTex || null,
                bumpScale: bumpTex ? 0.045 : 0,
                roughness: 0.94,
                metalness: 0.03,
            });
            earthMesh = new THREE.Mesh(earthGeo, earthMat);
            scene.add(earthMesh);

            const cloudGeo = new THREE.SphereGeometry(1.013, 64, 64);
            const cloudMat = new THREE.MeshStandardMaterial({
                map: cloudsTex || null,
                transparent: true,
                opacity: cloudsTex ? 0.35 : 0,
                depthWrite: false,
            });
            cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
            scene.add(cloudMesh);

            const atmosphereGeo = new THREE.SphereGeometry(1.06, 64, 64);
            const atmosphereMat = new THREE.MeshBasicMaterial({
                color: 0x70a8ff,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide,
            });
            atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
            scene.add(atmosphereMesh);

            starField = buildStars(THREE);
            scene.add(starField);

            resize();
            if (!resizeBound) {
                window.addEventListener("resize", resize);
                resizeBound = true;
            }
        })();
        return setupPromise;
    }

    function buildStars(THREE) {
        const count = 1800;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 28 + Math.random() * 52;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const idx = i * 3;
            positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
            positions[idx + 1] = radius * Math.cos(phi);
            positions[idx + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.22,
            transparent: true,
            opacity: 0.92,
            sizeAttenuation: true,
            depthWrite: false,
        });
        return new THREE.Points(geo, mat);
    }

    function resize() {
        if (!renderer || !camera || !canvas) return;
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    function animate(now) {
        if (!running || !renderer || !scene || !camera) return;

        const t = now / 1000;
        const raw = introActive ? clamp((now - introStart) / INTRO_DURATION, 0, 1) : 1;
        const eased = easeOutCubic(raw);
        if (introActive && raw >= 1) introActive = false;

        const radius = introActive ? lerp(1.2, 4.9, eased) : 4.9;
        const yaw = introActive ? lerp(0.35, 0.08, eased) : 0.08;
        const camY = introActive ? lerp(0.22, 0.05, eased) : 0.05;

        camera.position.set(
            Math.sin(yaw + t * 0.06) * 0.45,
            camY + Math.sin(t * 0.28) * 0.02,
            radius
        );
        camera.lookAt(0, 0, 0);

        if (earthMesh) earthMesh.rotation.y += 0.00155;
        if (cloudMesh) cloudMesh.rotation.y += 0.00195;
        if (starField) {
            starField.rotation.y -= 0.00023;
            starField.rotation.x = Math.sin(t * 0.05) * 0.02;
        }

        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
    }

    function init(canvasEl) {
        canvas = canvasEl;
        setupScene().catch(() => {
            // Keep overlay usable even if WebGL/texture fails.
        });
    }

    function start(options = {}) {
        const wantsIntro = options.intro !== false;
        introActive = wantsIntro;
        introStart = performance.now();

        setupScene().then(() => {
            if (!running) {
                running = true;
                animId = requestAnimationFrame(animate);
            } else if (!wantsIntro) {
                skipIntro();
            }
        }).catch(() => {
            // no-op
        });
    }

    function skipIntro() {
        introActive = false;
        introStart = performance.now() - INTRO_DURATION;
    }

    function stop() {
        running = false;
        if (animId) cancelAnimationFrame(animId);
        animId = null;
    }

    return { init, start, skipIntro, stop, resize };
})();
