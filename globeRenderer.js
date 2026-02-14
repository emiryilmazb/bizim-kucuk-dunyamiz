// ==========================================
// Globe Renderer - realistic Earth (Three.js)
// ==========================================

const globeRenderer = (() => {
    const THREE_SRC = "https://unpkg.com/three@0.160.0/build/three.min.js";
    const TEX_DAY = "assets/earth/earth_day_2048.jpg";
    const TEX_CLOUDS = "assets/earth/earth_clouds_1024.png";
    const TEX_NORMAL = "assets/earth/earth_normal_2048.jpg";
    const TEX_SPECULAR = "assets/earth/earth_specular_2048.jpg";
    const TEX_NIGHT = "assets/earth/earth_lights_2048.png";

    const INTRO_DURATION = 8200;

    let canvas = null;
    let running = false;
    let animId = null;
    let lastFrameTime = 0;

    let scene = null;
    let camera = null;
    let renderer = null;
    let earthMesh = null;
    let cloudMesh = null;
    let nightMesh = null;
    let atmosphereMesh = null;
    let starField = null;

    let introActive = true;
    let introStart = 0;

    let loadPromise = null;
    let setupPromise = null;
    let resizeBound = false;

    function isMobileDevice() {
        if (!window.matchMedia) return false;
        return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 900px)").matches;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(from, to, t) {
        return from + (to - from) * t;
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

    function configureTexture(texture, THREE, isColorTexture) {
        if (!texture) return;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        if (isColorTexture && "colorSpace" in texture) {
            texture.colorSpace = THREE.SRGBColorSpace;
        }
        if (renderer?.capabilities) {
            texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        }
        texture.needsUpdate = true;
    }

    async function setupScene() {
        if (setupPromise) return setupPromise;

        setupPromise = (async () => {
            const THREE = await ensureThree();
            if (!canvas) return;

            const mobile = isMobileDevice();
            const segments = mobile ? 64 : 96;

            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(44, 1, 0.1, 260);
            camera.position.set(0, 0.2, 4.4);
            camera.lookAt(0, 0, 0);

            renderer = new THREE.WebGLRenderer({
                canvas,
                antialias: !mobile,
                alpha: true,
                powerPreference: "high-performance",
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.45 : 2));
            if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
            if ("toneMapping" in renderer) renderer.toneMapping = THREE.ACESFilmicToneMapping;
            if ("toneMappingExposure" in renderer) renderer.toneMappingExposure = mobile ? 1.02 : 1.08;

            const ambient = new THREE.AmbientLight(0x90a6ff, 0.7);
            scene.add(ambient);

            const sunlight = new THREE.DirectionalLight(0xffffff, 1.35);
            sunlight.position.set(4.6, 2.2, 3.8);
            scene.add(sunlight);

            const rim = new THREE.DirectionalLight(0x7ab6ff, 0.5);
            rim.position.set(-5.2, -1.5, -4.2);
            scene.add(rim);

            const loader = new THREE.TextureLoader();
            const [dayTex, cloudTex, normalTex, specularTex, nightTex] = await Promise.all([
                loadTexture(loader, TEX_DAY).catch(() => null),
                loadTexture(loader, TEX_CLOUDS).catch(() => null),
                loadTexture(loader, TEX_NORMAL).catch(() => null),
                loadTexture(loader, TEX_SPECULAR).catch(() => null),
                loadTexture(loader, TEX_NIGHT).catch(() => null),
            ]);

            configureTexture(dayTex, THREE, true);
            configureTexture(cloudTex, THREE, true);
            configureTexture(normalTex, THREE, false);
            configureTexture(specularTex, THREE, false);
            configureTexture(nightTex, THREE, true);

            const earthGeo = new THREE.SphereGeometry(1, segments, segments);
            const earthMat = new THREE.MeshPhongMaterial({
                color: dayTex ? 0xffffff : 0x3a6cb0,
                map: dayTex || null,
                normalMap: normalTex || null,
                normalScale: normalTex ? new THREE.Vector2(0.82, 0.82) : new THREE.Vector2(0, 0),
                specularMap: specularTex || null,
                specular: specularTex ? new THREE.Color(0x2c3d52) : new THREE.Color(0x131313),
                shininess: specularTex ? 24 : 10,
            });
            earthMesh = new THREE.Mesh(earthGeo, earthMat);
            scene.add(earthMesh);

            if (nightTex) {
                const nightGeo = new THREE.SphereGeometry(1.003, segments, segments);
                const nightMat = new THREE.MeshBasicMaterial({
                    map: nightTex,
                    transparent: true,
                    opacity: 0.36,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                });
                nightMesh = new THREE.Mesh(nightGeo, nightMat);
                scene.add(nightMesh);
            }

            if (cloudTex) {
                const cloudGeo = new THREE.SphereGeometry(1.012, mobile ? 48 : 64, mobile ? 48 : 64);
                const cloudMat = new THREE.MeshPhongMaterial({
                    map: cloudTex,
                    transparent: true,
                    opacity: 0.45,
                    depthWrite: false,
                    blending: THREE.NormalBlending,
                });
                cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
                scene.add(cloudMesh);
            }

            const atmosphereGeo = new THREE.SphereGeometry(1.06, mobile ? 36 : 48, mobile ? 36 : 48);
            const atmosphereMat = new THREE.MeshBasicMaterial({
                color: 0x6ea4ff,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide,
            });
            atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
            scene.add(atmosphereMesh);

            starField = buildStars(THREE, mobile);
            scene.add(starField);

            resize();
            if (!resizeBound) {
                window.addEventListener("resize", resize);
                resizeBound = true;
            }
        })();

        return setupPromise;
    }

    function buildStars(THREE, mobile) {
        const count = mobile ? 1200 : 2200;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 22 + Math.random() * 58;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const index = i * 3;
            positions[index] = radius * Math.sin(phi) * Math.cos(theta);
            positions[index + 1] = radius * Math.cos(phi);
            positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);

            const tint = 0.82 + Math.random() * 0.18;
            colors[index] = tint;
            colors[index + 1] = tint * (0.95 + Math.random() * 0.05);
            colors[index + 2] = tint * (0.9 + Math.random() * 0.1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: mobile ? 0.18 : 0.16,
            transparent: true,
            opacity: 0.92,
            sizeAttenuation: true,
            depthWrite: false,
            vertexColors: true,
        });

        return new THREE.Points(geo, mat);
    }

    function resize() {
        if (!renderer || !camera || !canvas) return;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        if (!width || !height) return;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function animate(now) {
        if (!running || !renderer || !scene || !camera) return;

        const t = now / 1000;
        const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0.016;
        lastFrameTime = now;

        const rawIntro = introActive ? clamp((now - introStart) / INTRO_DURATION, 0, 1) : 1;
        const intro = easeOutCubic(rawIntro);
        if (introActive && rawIntro >= 1) introActive = false;

        const radius = introActive ? lerp(1.34, 6.7, intro) : 6.7;
        const camYOffset = introActive ? lerp(0.35, 0.08, intro) : 0.08;
        const orbitWeight = introActive ? lerp(0.55, 0.18, intro) : 0.18;

        const camX = Math.sin(t * 0.2 + orbitWeight) * 1.08;
        const camY = camYOffset + Math.sin(t * 0.18) * 0.03;
        const camZ = radius + Math.cos(t * 0.07) * 0.15;
        camera.position.set(camX, camY, camZ);
        camera.lookAt(0, 0, 0);

        if (earthMesh) earthMesh.rotation.y += delta * 0.19;
        if (nightMesh) nightMesh.rotation.y = earthMesh ? earthMesh.rotation.y + 0.0012 : 0;
        if (cloudMesh) cloudMesh.rotation.y += delta * 0.24;
        if (atmosphereMesh) atmosphereMesh.rotation.y += delta * 0.04;
        if (starField) {
            starField.rotation.y -= delta * 0.012;
            starField.rotation.x = Math.sin(t * 0.045) * 0.018;
        }

        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
    }

    function init(canvasEl) {
        canvas = canvasEl;
        setupScene().catch(() => {
            if (canvas) {
                canvas.style.background = "radial-gradient(circle at 50% 20%, #1f2944 0%, #0b0f1f 55%, #05060c 100%)";
            }
        });
    }

    function start(options = {}) {
        const wantsIntro = options.intro !== false;
        introActive = wantsIntro;
        introStart = performance.now();
        lastFrameTime = 0;

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
