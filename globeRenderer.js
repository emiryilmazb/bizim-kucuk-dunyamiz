// ==========================================
// 🌍 Globe Renderer — cinematic zoom-out Earth
// ==========================================

const globeRenderer = (() => {
    let canvas = null;
    let ctx = null;
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let baseRadius = 0;

    let running = false;
    let animId = null;
    let rotation = 1.78;
    let cityPulse = 0;

    let introActive = true;
    let introStart = 0;
    const INTRO_DURATION_MS = 6400;
    let resizeBound = false;

    let stars = [];

    const istanbul = { lat: 41.01, lng: 28.98 };

    // Simplified continent outlines [lng, lat]
    const continents = [
        [[-10, 35], [0, 38], [10, 38], [20, 45], [30, 50], [25, 55], [35, 60], [30, 65], [15, 70], [5, 65], [0, 60], [-10, 50], [-10, 35]].map(c => ({ lng: c[0], lat: c[1] })),
        [[-15, 30], [0, 32], [15, 30], [20, 15], [25, 0], [20, -10], [30, -25], [25, -35], [15, -35], [5, -30], [-5, -10], [-15, 10], [-15, 30]].map(c => ({ lng: c[0], lat: c[1] })),
        [[30, 45], [40, 42], [50, 40], [60, 45], [70, 40], [80, 30], [90, 25], [100, 22], [110, 20], [120, 30], [130, 35], [140, 40], [140, 50], [130, 55], [120, 55], [100, 60], [80, 65], [70, 60], [50, 50], [40, 48], [30, 45]].map(c => ({ lng: c[0], lat: c[1] })),
        [[-130, 50], [-120, 55], [-110, 60], [-100, 60], [-90, 55], [-80, 45], [-85, 35], [-90, 30], [-100, 25], [-105, 20], [-100, 30], [-110, 35], [-120, 40], [-130, 50]].map(c => ({ lng: c[0], lat: c[1] })),
        [[-80, 10], [-75, 5], [-70, 0], [-65, -5], [-60, -10], [-55, -15], [-50, -20], [-45, -25], [-50, -30], [-55, -35], [-65, -40], [-70, -50], [-75, -45], [-70, -30], [-75, -15], [-80, 0], [-80, 10]].map(c => ({ lng: c[0], lat: c[1] })),
        [[115, -20], [120, -15], [130, -15], [140, -18], [150, -25], [148, -30], [145, -35], [135, -35], [125, -30], [115, -25], [115, -20]].map(c => ({ lng: c[0], lat: c[1] })),
    ];

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

    function init(canvasEl) {
        canvas = canvasEl;
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        resize();
        if (!resizeBound) {
            window.addEventListener("resize", resize);
            resizeBound = true;
        }
    }

    function resize() {
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2;
        cy = h / 2;
        baseRadius = Math.min(w, h);
        regenerateStars();
    }

    function regenerateStars() {
        const count = Math.max(240, Math.floor((w * h) / 5000));
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.35 + Math.random() * 1.6,
                alpha: 0.18 + Math.random() * 0.82,
                twinkle: 0.6 + Math.random() * 2.4,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function project(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng * (Math.PI / 180)) + rotation;

        const x3d = radius * Math.sin(phi) * Math.cos(theta);
        const y3d = radius * Math.cos(phi);
        const z3d = radius * Math.sin(phi) * Math.sin(theta);

        const cameraDistance = radius * 3.2;
        const perspective = cameraDistance / (cameraDistance - z3d);

        return {
            x: cx + x3d * perspective,
            y: cy - y3d * perspective,
            z: z3d,
            visible: z3d > -radius * 0.2,
            scale: perspective,
        };
    }

    function drawBackground(progress, time) {
        const bg = ctx.createRadialGradient(
            cx,
            cy * 0.7,
            Math.min(w, h) * 0.08,
            cx,
            cy,
            Math.max(w, h) * 0.85
        );
        bg.addColorStop(0, "#182846");
        bg.addColorStop(0.45, "#0d1226");
        bg.addColorStop(1, "#04050a");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const starOpacity = clamp((progress - 0.14) / 0.86, 0, 1);
        stars.forEach((s, i) => {
            const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * s.twinkle + s.phase));
            const parallaxX = (i % 2 === 0 ? 1 : -1) * 0.02 * time * (s.size / 2);
            const x = (s.x + parallaxX + w) % w;
            ctx.fillStyle = `rgba(255,255,255,${s.alpha * twinkle * starOpacity})`;
            ctx.beginPath();
            ctx.arc(x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawGrid(radius) {
        ctx.strokeStyle = "rgba(133, 197, 255, 0.12)";
        ctx.lineWidth = 0.75;

        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            let started = false;
            for (let lng = -180; lng <= 180; lng += 4) {
                const p = project(lat, lng, radius);
                if (p.visible) {
                    if (!started) {
                        ctx.moveTo(p.x, p.y);
                        started = true;
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }

        for (let lng = -180; lng < 180; lng += 25) {
            ctx.beginPath();
            let started = false;
            for (let lat = -90; lat <= 90; lat += 4) {
                const p = project(lat, lng, radius);
                if (p.visible) {
                    if (!started) {
                        ctx.moveTo(p.x, p.y);
                        started = true;
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }
    }

    function drawContinent(points, radius) {
        ctx.fillStyle = "rgba(122, 197, 143, 0.43)";
        ctx.strokeStyle = "rgba(194, 242, 205, 0.32)";
        ctx.lineWidth = 1.05;
        ctx.beginPath();

        let started = false;
        points.forEach((pt) => {
            const p = project(pt.lat, pt.lng, radius);
            if (p.visible) {
                if (!started) {
                    ctx.moveTo(p.x, p.y);
                    started = true;
                } else {
                    ctx.lineTo(p.x, p.y);
                }
            }
        });

        if (started) {
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    function drawIstanbulPin(radius, progress) {
        if (progress < 0.58) return;
        const p = project(istanbul.lat, istanbul.lng, radius);
        if (!p.visible) return;

        cityPulse += 0.032;
        const pulse = 0.72 + 0.28 * Math.sin(cityPulse * 3.1);
        const ringScale = 1 + 0.35 * Math.sin(cityPulse * 2.2);

        ctx.strokeStyle = `rgba(255, 149, 173, ${0.34 * pulse})`;
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10 * ringScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 149, 173, ${0.18 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18 * ringScale, 0, Math.PI * 2);
        ctx.stroke();

        const dotGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        dotGrad.addColorStop(0, "rgba(255, 179, 194, 0.96)");
        dotGrad.addColorStop(0.6, "rgba(255, 122, 153, 0.72)");
        dotGrad.addColorStop(1, "rgba(255, 122, 153, 0)");
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawGlobe(progress, time) {
        const eased = easeOutCubic(progress);
        const radius = baseRadius * (introActive ? lerp(2.7, 0.46, eased) : 0.46);

        drawBackground(progress, time);

        const atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.42);
        atmosphere.addColorStop(0, "rgba(102, 184, 255, 0.16)");
        atmosphere.addColorStop(0.4, "rgba(80, 154, 255, 0.08)");
        atmosphere.addColorStop(1, "rgba(80, 154, 255, 0)");
        ctx.fillStyle = atmosphere;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.42, 0, Math.PI * 2);
        ctx.fill();

        const ocean = ctx.createRadialGradient(cx - radius * 0.42, cy - radius * 0.38, radius * 0.05, cx, cy, radius);
        ocean.addColorStop(0, "rgba(72, 138, 210, 0.9)");
        ocean.addColorStop(0.58, "rgba(35, 92, 170, 0.86)");
        ocean.addColorStop(1, "rgba(19, 45, 112, 0.82)");
        ctx.fillStyle = ocean;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();

        drawGrid(radius);
        continents.forEach(cont => drawContinent(cont, radius));

        const shade = ctx.createLinearGradient(cx - radius * 1.2, cy, cx + radius * 1.1, cy + radius * 0.2);
        shade.addColorStop(0, "rgba(255,255,255,0.13)");
        shade.addColorStop(0.45, "rgba(255,255,255,0)");
        shade.addColorStop(1, "rgba(0, 0, 0, 0.22)");
        ctx.fillStyle = shade;
        ctx.fillRect(cx - radius * 1.4, cy - radius * 1.4, radius * 2.8, radius * 2.8);

        ctx.restore();

        ctx.strokeStyle = "rgba(140, 198, 255, 0.34)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        drawIstanbulPin(radius, progress);
    }

    function animate(now) {
        if (!running) return;

        const time = now / 1000;
        const rawProgress = introActive
            ? clamp((now - introStart) / INTRO_DURATION_MS, 0, 1)
            : 1;
        if (introActive && rawProgress >= 1) introActive = false;

        const rotateSpeed = introActive
            ? lerp(0.00085, 0.0028, easeOutCubic(rawProgress))
            : 0.0033;
        rotation += rotateSpeed;

        drawGlobe(rawProgress, time);
        animId = requestAnimationFrame(animate);
    }

    function start(options = {}) {
        if (!canvas || !ctx) return;
        const withIntro = options.intro !== false;
        introActive = withIntro;
        introStart = performance.now();
        cityPulse = 0;

        if (!running) {
            running = true;
            animId = requestAnimationFrame(animate);
        } else if (!withIntro) {
            skipIntro();
        }
    }

    function skipIntro() {
        introActive = false;
        introStart = performance.now() - INTRO_DURATION_MS;
    }

    function stop() {
        running = false;
        if (animId) cancelAnimationFrame(animId);
        animId = null;
    }

    return { init, start, skipIntro, stop, resize };
})();
