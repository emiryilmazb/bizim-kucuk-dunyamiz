// ==========================================
// 🌍 Globe Renderer — 3D rotating Earth on canvas
// ==========================================

const globeRenderer = (() => {
    let canvas, ctx, w, h, cx, cy, r;
    let rotation = 1.8; // start roughly showing Europe/Turkey
    let animId = null;
    let running = false;
    let istanbulPulse = 0;

    // Simplified continent outlines as [lat, lng] polylines
    // (very simplified shapes for performance)
    const continents = [
        // Europe
        [[-10, 35], [0, 38], [10, 38], [20, 45], [30, 50], [25, 55], [35, 60], [30, 65], [15, 70], [5, 65], [0, 60], [-10, 50], [-10, 35]].map(c => ({ lng: c[0], lat: c[1] })),
        // Africa
        [[-15, 30], [0, 32], [15, 30], [20, 15], [25, 0], [20, -10], [30, -25], [25, -35], [15, -35], [5, -30], [-5, -10], [-15, 10], [-15, 30]].map(c => ({ lng: c[0], lat: c[1] })),
        // Asia
        [[30, 45], [40, 42], [50, 40], [60, 45], [70, 40], [80, 30], [90, 25], [100, 22], [110, 20], [120, 30], [130, 35], [140, 40], [140, 50], [130, 55], [120, 55], [100, 60], [80, 65], [70, 60], [50, 50], [40, 48], [30, 45]].map(c => ({ lng: c[0], lat: c[1] })),
        // North America
        [[-130, 50], [-120, 55], [-110, 60], [-100, 60], [-90, 55], [-80, 45], [-85, 35], [-90, 30], [-100, 25], [-105, 20], [-100, 30], [-110, 35], [-120, 40], [-130, 50]].map(c => ({ lng: c[0], lat: c[1] })),
        // South America
        [[-80, 10], [-75, 5], [-70, 0], [-65, -5], [-60, -10], [-55, -15], [-50, -20], [-45, -25], [-50, -30], [-55, -35], [-65, -40], [-70, -50], [-75, -45], [-70, -30], [-75, -15], [-80, 0], [-80, 10]].map(c => ({ lng: c[0], lat: c[1] })),
        // Australia
        [[115, -20], [120, -15], [130, -15], [140, -18], [150, -25], [148, -30], [145, -35], [135, -35], [125, -30], [115, -25], [115, -20]].map(c => ({ lng: c[0], lat: c[1] })),
    ];

    // Istanbul coords
    const istanbul = { lat: 41.01, lng: 28.98 };

    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas.getContext("2d");
        resize();
        window.addEventListener("resize", resize);
    }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = w / 2;
        cy = h / 2;
        r = Math.min(w, h) * 0.35;
    }

    /** Project lat/lng to 3D sphere then to 2D screen */
    function project(lat, lng) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + rotation * (180 / Math.PI)) * (Math.PI / 180);

        const x3d = r * Math.sin(phi) * Math.cos(theta);
        const y3d = r * Math.cos(phi);
        const z3d = r * Math.sin(phi) * Math.sin(theta);

        // Only visible if facing us (z > 0)
        return {
            x: cx + x3d,
            y: cy - y3d,
            z: z3d,
            visible: z3d > 0
        };
    }

    function drawGlobe() {
        ctx.clearRect(0, 0, w, h);

        // Stars background
        drawStars();

        // Atmosphere glow
        const atmoGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.3);
        atmoGrad.addColorStop(0, "rgba(100, 180, 255, 0.08)");
        atmoGrad.addColorStop(0.5, "rgba(100, 180, 255, 0.04)");
        atmoGrad.addColorStop(1, "transparent");
        ctx.fillStyle = atmoGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Ocean sphere
        const oceanGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        oceanGrad.addColorStop(0, "rgba(40, 80, 140, 0.7)");
        oceanGrad.addColorStop(0.6, "rgba(25, 60, 120, 0.65)");
        oceanGrad.addColorStop(1, "rgba(15, 40, 80, 0.6)");
        ctx.fillStyle = oceanGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Sphere outline
        ctx.strokeStyle = "rgba(100, 180, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // Latitude/longitude grid lines (subtle)
        drawGridLines();

        // Continents
        continents.forEach(cont => drawContinent(cont));

        // Istanbul pin
        drawIstanbulPin();

        // Specular highlight
        const specGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx - r * 0.3, cy - r * 0.35, r * 0.6);
        specGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        specGrad.addColorStop(1, "transparent");
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    let stars = [];
    function drawStars() {
        if (stars.length === 0) {
            for (let i = 0; i < 120; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    s: 0.3 + Math.random() * 1.2,
                    o: 0.2 + Math.random() * 0.5,
                    twinkleSpeed: 0.5 + Math.random() * 2
                });
            }
        }
        const t = Date.now() / 1000;
        stars.forEach(s => {
            const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(t * s.twinkleSpeed));
            ctx.fillStyle = `rgba(255,255,255,${s.o * twinkle})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawGridLines() {
        ctx.strokeStyle = "rgba(100, 180, 255, 0.08)";
        ctx.lineWidth = 0.5;

        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            let started = false;
            for (let lng = 0; lng <= 360; lng += 5) {
                const p = project(lat, lng);
                if (p.visible) {
                    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                    else ctx.lineTo(p.x, p.y);
                } else { started = false; }
            }
            ctx.stroke();
        }

        // Longitude lines
        for (let lng = 0; lng < 360; lng += 30) {
            ctx.beginPath();
            let started = false;
            for (let lat = -90; lat <= 90; lat += 5) {
                const p = project(lat, lng);
                if (p.visible) {
                    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                    else ctx.lineTo(p.x, p.y);
                } else { started = false; }
            }
            ctx.stroke();
        }
    }

    function drawContinent(points) {
        ctx.fillStyle = "rgba(120, 180, 120, 0.35)";
        ctx.strokeStyle = "rgba(150, 210, 150, 0.4)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        let started = false;
        let allVisible = true;

        points.forEach(pt => {
            const p = project(pt.lat, pt.lng);
            if (p.visible) {
                if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                else ctx.lineTo(p.x, p.y);
            } else {
                allVisible = false;
            }
        });

        if (started) {
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    function drawIstanbulPin() {
        const p = project(istanbul.lat, istanbul.lng);
        if (!p.visible) return;

        istanbulPulse += 0.04;
        const pulse = 0.7 + 0.3 * Math.sin(istanbulPulse * 3);
        const outerPulse = 1 + 0.4 * Math.sin(istanbulPulse * 2);

        // Outer glow ring
        ctx.strokeStyle = `rgba(232, 128, 127, ${0.25 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12 * outerPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Second glow ring
        ctx.strokeStyle = `rgba(232, 128, 127, ${0.15 * pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20 * outerPulse, 0, Math.PI * 2);
        ctx.stroke();

        // Core dot
        const dotGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
        dotGrad.addColorStop(0, "rgba(232, 128, 127, 0.95)");
        dotGrad.addColorStop(0.6, "rgba(232, 128, 127, 0.7)");
        dotGrad.addColorStop(1, "rgba(232, 128, 127, 0)");
        ctx.fillStyle = dotGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // "İstanbul" label
        ctx.font = "500 11px 'Outfit', sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "left";
        ctx.fillText("İstanbul 💖", p.x + 14, p.y + 4);
    }

    function animate() {
        if (!running) return;
        rotation += 0.003; // slow rotation
        drawGlobe();
        animId = requestAnimationFrame(animate);
    }

    function start() {
        if (running) return;
        running = true;
        stars = []; // regenerate on start
        resize();
        animate();
    }

    function stop() {
        running = false;
        if (animId) cancelAnimationFrame(animId);
    }

    return { init, start, stop, resize };
})();
