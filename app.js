// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Valentine's Day Game — v5
// ==========================================

(function () {
    "use strict";

    // ---------- Introduction State ----------
    let currentStep = 1;
    const totalSteps = 4;

    // ---------- Game State ----------
    let map, mapBounds, characterMarker;
    let memoryMarkers = [];
    let triggeredMemories = new Set();
    let discoveredCount = 0;
    let surpriseShown = false;
    let moveAnimation = null;
    let activeKeys = new Set();
    let keyMoveRAF = null;
    let lastMoveTime = 0;
    let trailPoints = [];
    let trailLine = null;

    const PROXIMITY_THRESHOLD = 500;
    const NEARBY_THRESHOLD = 1500;
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 18;
    const DEFAULT_ZOOM = 13;
    const MOVE_SPEED = 0.00025;
    const TRAIL_MAX = 15;

    // ---------- DOM ----------
    const scoreText = document.getElementById("score-text");
    const progressFill = document.getElementById("progress-fill");
    const distanceBadge = document.getElementById("distance-badge");
    const distanceText = document.getElementById("distance-text");
    const distanceArrow = document.getElementById("distance-arrow");
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    const discoveryFlash = document.getElementById("discovery-flash");
    const sheet = document.getElementById("sheet");
    const sheetOverlay = document.getElementById("sheet-overlay");
    const sheetClose = document.getElementById("sheet-close");
    const surprizContainer = document.getElementById("surpriz-container");
    const surprizBtn = document.getElementById("btn-surpriz");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalMesaj = document.getElementById("modal-mesaj");
    const modalKapat = document.getElementById("modal-kapat");
    const modalTekrar = document.getElementById("modal-tekrar");
    const btnCompass = document.getElementById("btn-compass");
    const warmthDot = document.getElementById("warmth-dot");
    const warmthText = document.getElementById("warmth-label");

    // ==========================================
    //  INIT
    // ==========================================
    function init() {
        setupParticles();
        setupIntro();
    }

    // ==========================================
    //  INTRO SYSTEM
    // ==========================================
    function setupIntro() {
        // Step 1: Typewriter text, then clickable
        setTimeout(() => {
            typewriterIntro("step1-text", "Sana bir şey göstermek istiyorum...", 55);
        }, 600);

        // Click handlers for each step
        document.getElementById("step-1").addEventListener("click", () => goToStep(2));
        document.getElementById("step-2").addEventListener("click", () => goToStep(3));
        document.getElementById("step-3").addEventListener("click", () => goToStep(4));
        document.getElementById("btn-start").addEventListener("click", (e) => {
            e.stopPropagation();
            startGame();
        });
    }

    function goToStep(step) {
        if (step <= currentStep) return;
        // Hide current
        const prev = document.getElementById(`step-${currentStep}`);
        if (prev) prev.classList.remove("active");

        currentStep = step;

        // Show next
        const next = document.getElementById(`step-${step}`);
        if (next) next.classList.add("active");

        // Trigger step-specific animations
        if (step === 2) animateStep2();
        if (step === 3) animateStep3();
        if (step === 4) animateStep4();
    }

    // --------- Step 2: Love Letter ---------
    function animateStep2() {
        const lines = document.querySelectorAll(".letter-line");
        lines.forEach((line, i) => {
            const delay = parseInt(line.dataset.delay) || i * 600;
            setTimeout(() => line.classList.add("show"), delay + 400);
        });
    }

    // --------- Step 3: Memory Cards ---------
    function animateStep3() {
        const cards = document.querySelectorAll(".mem-card");
        cards.forEach((card, i) => {
            setTimeout(() => card.classList.add("show"), i * 200 + 300);
        });
    }

    // --------- Step 4: Mission Rules ---------
    function animateStep4() {
        const rules = document.querySelectorAll(".rule");
        rules.forEach((rule, i) => {
            setTimeout(() => rule.classList.add("show"), i * 250 + 300);
        });
    }

    // --------- Typewriter for intro ---------
    function typewriterIntro(elementId, text, speed) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = "";
        let i = 0;
        const iv = setInterval(() => {
            if (i < text.length) {
                el.textContent += text[i];
                i++;
            } else {
                clearInterval(iv);
            }
        }, speed);
    }

    // ==========================================
    //  START GAME
    // ==========================================
    function startGame() {
        // Hide all intro steps
        for (let i = 1; i <= totalSteps; i++) {
            const s = document.getElementById(`step-${i}`);
            if (s) s.classList.remove("active");
        }

        // Show game
        const game = document.getElementById("game");
        game.style.display = "block";
        document.body.style.background = "#fdf6f0";

        // Slight delay for transition
        setTimeout(() => {
            setupMap();
            setupEventListeners();
            setupKeyboard();
            setupDpad();
            updateScore();
            setTimeout(() => showToast("💡", "Haritaya dokun veya yön tuşlarını kullan!"), 600);
        }, 100);
    }

    // ==========================================
    //  PARTICLES (Splash)
    // ==========================================
    function setupParticles() {
        const canvas = document.getElementById("particles-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let particles = [];
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener("resize", resize);

        class P {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.s = Math.random() * 5 + 2;
                this.vy = -(Math.random() * 0.4 + 0.1);
                this.vx = (Math.random() - 0.5) * 0.4;
                this.o = Math.random() * 0.6 + 0.1;
                this.h = [0, 330, 350, 15][Math.floor(Math.random() * 4)]; // pinks/reds
            }
            update() {
                this.y += this.vy; this.x += this.vx; this.o -= 0.0008;
                if (this.y < -10 || this.o <= 0) { this.reset(); this.y = canvas.height + 10; }
            }
            draw() {
                ctx.save(); ctx.globalAlpha = this.o;
                ctx.fillStyle = `hsl(${this.h},75%,75%)`;
                const s = this.s;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x, this.y, this.x - s, this.y, this.x - s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x - s, this.y + s * 0.8, this.x, this.y + s * 1.2, this.x, this.y + s * 1.5);
                ctx.bezierCurveTo(this.x, this.y + s * 1.2, this.x + s, this.y + s * 0.8, this.x + s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x + s, this.y, this.x, this.y, this.x, this.y + s * 0.3);
                ctx.fill(); ctx.restore();
            }
        }
        for (let i = 0; i < 35; i++) particles.push(new P());
        (function anim() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(anim);
        })();
    }

    // ==========================================
    //  MAP SETUP
    // ==========================================
    function setupMap() {
        const pointBounds = L.latLngBounds(anilar.map(a => [a.lat, a.lng]));
        const paddedBounds = pointBounds.pad(0.3);
        mapBounds = paddedBounds;

        map = L.map("map", {
            center: pointBounds.getCenter(),
            zoom: DEFAULT_ZOOM,
            minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
            maxBounds: paddedBounds, maxBoundsViscosity: 1.0,
            bounceAtZoomLimits: true, zoomControl: false, attributionControl: true,
        });

        map.on("drag", () => map.panInsideBounds(paddedBounds, { animate: false }));
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap", maxZoom: MAX_ZOOM, bounds: paddedBounds,
        }).addTo(map);

        map.fitBounds(pointBounds.pad(0.15));
        addMemoryMarkers();
        const c = pointBounds.getCenter();
        addCharacterMarker(c.lat, c.lng);
        map.on("click", onMapTap);
    }

    // ==========================================
    //  SMOOTH CAMERA
    // ==========================================
    function smoothCamera(charLL) {
        const mapSize = map.getSize();
        const charPx = map.latLngToContainerPoint(charLL);
        const dx = mapSize.x * 0.35;
        const dy = mapSize.y * 0.35;
        const cx = mapSize.x / 2;
        const cy = mapSize.y / 2;
        const offX = charPx.x - cx;
        const offY = charPx.y - cy;

        if (Math.abs(offX) > dx || Math.abs(offY) > dy) {
            const tX = offX > dx ? offX - dx : (offX < -dx ? offX + dx : 0);
            const tY = offY > dy ? offY - dy : (offY < -dy ? offY + dy : 0);
            const ccPx = map.latLngToContainerPoint(map.getCenter());
            const newCenter = map.containerPointToLatLng(L.point(ccPx.x + tX, ccPx.y + tY));
            map.setView(newCenter, map.getZoom(), { animate: false });
        }
    }

    // ==========================================
    //  TRAIL
    // ==========================================
    function updateTrail(ll) {
        trailPoints.push([ll.lat, ll.lng]);
        if (trailPoints.length > TRAIL_MAX) trailPoints.shift();
        if (trailLine) map.removeLayer(trailLine);
        if (trailPoints.length > 1) {
            trailLine = L.polyline(trailPoints, {
                color: "#e8807f", weight: 3, opacity: 0.25,
                dashArray: "4,8", lineCap: "round", interactive: false,
            }).addTo(map);
        }
    }

    // ==========================================
    //  WARMTH
    // ==========================================
    function updateWarmth(charLL) {
        let closestDist = Infinity, closest = null;
        memoryMarkers.forEach(m => {
            if (triggeredMemories.has(m._aniData.id)) return;
            const d = charLL.distanceTo(m.getLatLng());
            if (d < closestDist) { closestDist = d; closest = m; }
        });

        if (closestDist === Infinity) { if (distanceBadge) distanceBadge.style.opacity = "0"; return; }

        const warmth = Math.max(0, Math.min(1, 1 - closestDist / 5000));
        const m = Math.round(closestDist);
        if (distanceText) distanceText.textContent = m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

        if (warmthDot) {
            if (warmth > 0.8) { warmthDot.textContent = "🔥"; warmthDot.className = "warmth-dot hot"; }
            else if (warmth > 0.5) { warmthDot.textContent = "🟠"; warmthDot.className = "warmth-dot warm"; }
            else if (warmth > 0.25) { warmthDot.textContent = "🟡"; warmthDot.className = "warmth-dot mild"; }
            else { warmthDot.textContent = "🔵"; warmthDot.className = "warmth-dot cold"; }
        }
        if (warmthText) {
            if (warmth > 0.8) warmthText.textContent = "Çok yakın!";
            else if (warmth > 0.5) warmthText.textContent = "Yaklaşıyorsun!";
            else if (warmth > 0.25) warmthText.textContent = "Ilık";
            else warmthText.textContent = "Soğuk";
        }
        if (distanceBadge) distanceBadge.style.opacity = "1";

        if (closest && distanceArrow) {
            const mLL = closest.getLatLng();
            const angle = Math.atan2(mLL.lng - charLL.lng, mLL.lat - charLL.lat) * (180 / Math.PI);
            distanceArrow.style.transform = `rotate(${-angle + 180}deg)`;
        }
    }

    // ==========================================
    //  FLOATING EMOJIS
    // ==========================================
    function spawnFloatingEmojis(latlng, count) {
        const emojis = ["💕", "💖", "✨", "💫", "🌸", "💝"];
        const pt = map.latLngToContainerPoint(latlng);
        for (let i = 0; i < count; i++) {
            const el = document.createElement("div");
            el.className = "floating-emoji";
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.style.left = (pt.x + (Math.random() - 0.5) * 60) + "px";
            el.style.top = (pt.y - 10) + "px";
            el.style.setProperty("--dx", ((Math.random() - 0.5) * 80) + "px");
            el.style.animationDelay = (i * 0.1) + "s";
            document.getElementById("game").appendChild(el);
            setTimeout(() => el.remove(), 1500);
        }
    }

    // ==========================================
    //  TAP-TO-MOVE
    // ==========================================
    function onMapTap(e) {
        if (sheet.classList.contains("show") || modalOverlay.classList.contains("show")) return;
        moveCharacterTo(clampToBounds(e.latlng));
    }

    function moveCharacterTo(targetLL) {
        if (moveAnimation) cancelAnimationFrame(moveAnimation);
        const start = characterMarker.getLatLng();
        const startTime = performance.now();
        const dist = start.distanceTo(targetLL);
        const duration = Math.min(Math.max(dist * 1.5, 400), 3000);
        setCharacterMoving(true);

        function step(now) {
            const t = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            const pos = L.latLng(
                start.lat + (targetLL.lat - start.lat) * ease,
                start.lng + (targetLL.lng - start.lng) * ease
            );
            characterMarker.setLatLng(pos);
            smoothCamera(pos);
            updateTrail(pos);
            checkProximity(pos);
            updateNearbyGlow(pos);
            updateWarmth(pos);

            if (t < 1) moveAnimation = requestAnimationFrame(step);
            else { moveAnimation = null; setCharacterMoving(false); }
        }
        moveAnimation = requestAnimationFrame(step);
    }

    function setCharacterMoving(m) {
        const el = characterMarker ? characterMarker.getElement() : null;
        if (!el) return;
        if (m) el.classList.add("moving"); else el.classList.remove("moving");
    }

    // ==========================================
    //  KEYBOARD
    // ==========================================
    function setupKeyboard() {
        document.addEventListener("keydown", e => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
                e.preventDefault(); activeKeys.add(e.key.toLowerCase()); startContinuousMove();
            }
        });
        document.addEventListener("keyup", e => {
            activeKeys.delete(e.key.toLowerCase());
            if (activeKeys.size === 0) stopContinuousMove();
        });
    }

    // ==========================================
    //  D-PAD
    // ==========================================
    function setupDpad() {
        const dirs = {
            "dpad-up": [1, 0], "dpad-down": [-1, 0],
            "dpad-left": [0, -1], "dpad-right": [0, 1],
        };
        Object.keys(dirs).forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            function down(e) { e.preventDefault(); activeKeys.add(id); btn.classList.add("active"); startContinuousMove(); }
            function up(e) { if (e) e.preventDefault(); activeKeys.delete(id); btn.classList.remove("active"); if (activeKeys.size === 0) stopContinuousMove(); }
            btn.addEventListener("touchstart", down, { passive: false });
            btn.addEventListener("touchend", up, { passive: false });
            btn.addEventListener("touchcancel", up);
            btn.addEventListener("mousedown", down);
            btn.addEventListener("mouseup", up);
            btn.addEventListener("mouseleave", up);
        });
    }

    // ==========================================
    //  CONTINUOUS MOVE (rAF + sync delta)
    // ==========================================
    const dirMap = {
        "arrowup": [1, 0], "w": [1, 0], "dpad-up": [1, 0],
        "arrowdown": [-1, 0], "s": [-1, 0], "dpad-down": [-1, 0],
        "arrowleft": [0, -1], "a": [0, -1], "dpad-left": [0, -1],
        "arrowright": [0, 1], "d": [0, 1], "dpad-right": [0, 1],
    };

    function startContinuousMove() {
        if (moveAnimation) { cancelAnimationFrame(moveAnimation); moveAnimation = null; }
        if (keyMoveRAF) return;
        setCharacterMoving(true);
        lastMoveTime = performance.now();

        function tick(now) {
            const dt = Math.min((now - lastMoveTime) / 16.67, 3);
            lastMoveTime = now;

            let dlat = 0, dlng = 0;
            activeKeys.forEach(k => { const d = dirMap[k]; if (d) { dlat += d[0]; dlng += d[1]; } });
            if (dlat === 0 && dlng === 0) { keyMoveRAF = requestAnimationFrame(tick); return; }
            if (dlat !== 0 && dlng !== 0) { const len = Math.sqrt(dlat * dlat + dlng * dlng); dlat /= len; dlng /= len; }

            const ll = characterMarker.getLatLng();
            const stepLat = dlat * MOVE_SPEED * dt;
            const stepLng = dlng * MOVE_SPEED * dt;
            const newLL = clampToBounds(L.latLng(ll.lat + stepLat, ll.lng + stepLng));
            const aLat = newLL.lat - ll.lat;
            const aLng = newLL.lng - ll.lng;

            characterMarker.setLatLng(newLL);
            if (aLat !== 0 || aLng !== 0) {
                const center = map.getCenter();
                map.setView([center.lat + aLat, center.lng + aLng], map.getZoom(), { animate: false });
            }

            if (now - (tick._lt || 0) > 150) { updateTrail(newLL); tick._lt = now; }
            checkProximity(newLL);
            updateNearbyGlow(newLL);
            updateWarmth(newLL);
            keyMoveRAF = requestAnimationFrame(tick);
        }
        keyMoveRAF = requestAnimationFrame(tick);
    }

    function stopContinuousMove() {
        if (keyMoveRAF) { cancelAnimationFrame(keyMoveRAF); keyMoveRAF = null; }
        setCharacterMoving(false);
    }

    // ==========================================
    //  CLAMP
    // ==========================================
    function clampToBounds(ll) {
        if (!mapBounds) return ll;
        const i = 0.003;
        return L.latLng(
            Math.max(mapBounds.getSouth() + i, Math.min(mapBounds.getNorth() - i, ll.lat)),
            Math.max(mapBounds.getWest() + i, Math.min(mapBounds.getEast() - i, ll.lng))
        );
    }

    // ==========================================
    //  MEMORY MARKERS
    // ==========================================
    function addMemoryMarkers() {
        anilar.forEach(ani => {
            const marker = L.marker([ani.lat, ani.lng], {
                icon: L.divIcon({ className: "memory-marker undiscovered", html: '<span class="marker-inner">❓</span>', iconSize: [38, 38], iconAnchor: [19, 19] }),
                interactive: false,
            }).addTo(map);
            marker.bindPopup(`<div class="popup-content"><h3>${ani.baslik}</h3>${ani.tarih ? `<div class="popup-date">📅 ${ani.tarih}</div>` : ""}</div>`, { closeButton: true, maxWidth: 200, autoPan: false });
            marker._aniData = ani;
            memoryMarkers.push(marker);
        });
    }

    // ==========================================
    //  CHARACTER MARKER — 💖
    // ==========================================
    function addCharacterMarker(lat, lng) {
        characterMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: "heart-marker",
                html: '<span class="char-inner">💖</span>',
                iconSize: [44, 44], iconAnchor: [22, 22],
            }),
            draggable: true, autoPan: false,
        }).addTo(map);

        characterMarker.on("dragstart", () => {
            if (moveAnimation) { cancelAnimationFrame(moveAnimation); moveAnimation = null; }
            if (keyMoveRAF) stopContinuousMove();
            map.dragging.disable(); setCharacterMoving(true);
        });
        characterMarker.on("drag", e => {
            const ll = clampToBounds(e.target.getLatLng());
            e.target.setLatLng(ll); smoothCamera(ll);
            checkProximity(ll); updateNearbyGlow(ll); updateWarmth(ll);
        });
        characterMarker.on("dragend", () => { map.dragging.enable(); setCharacterMoving(false); });
    }

    // ==========================================
    //  PROXIMITY
    // ==========================================
    function checkProximity(charLL) {
        memoryMarkers.forEach(marker => {
            const ani = marker._aniData;
            if (charLL.distanceTo(marker.getLatLng()) < PROXIMITY_THRESHOLD && !triggeredMemories.has(ani.id)) {
                triggeredMemories.add(ani.id);
                discoveredCount++;
                const emoji = ani.surpriz ? "✨" : ["📍", "🌅", "🎨", "🎭", "🏰", "💫"][ani.id % 6];
                marker.setIcon(L.divIcon({ className: "memory-marker discovered", html: `<span class="marker-inner">${emoji}</span>`, iconSize: [38, 38], iconAnchor: [19, 19] }));
                marker.openPopup();
                flashScreen(); updateScore();
                spawnFloatingEmojis(marker.getLatLng(), 6);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                if (ani.surpriz) { showToast("✨", "Sürpriz noktasını buldun!"); showSurpriseButton(); }
                else { showToast("💕", `"${ani.baslik}" keşfedildi!`); setTimeout(() => showSheet(ani), 400); }
                if (discoveredCount === anilar.length) setTimeout(() => launchConfetti(), 600);
            }
        });
    }

    function updateNearbyGlow(charLL) {
        memoryMarkers.forEach(m => {
            if (triggeredMemories.has(m._aniData.id)) return;
            const el = m.getElement();
            if (!el) return;
            if (charLL.distanceTo(m.getLatLng()) < NEARBY_THRESHOLD) el.classList.add("nearby");
            else el.classList.remove("nearby");
        });
    }

    // ==========================================
    //  UI HELPERS
    // ==========================================
    function updateScore() {
        scoreText.textContent = `${discoveredCount} / ${anilar.length}`;
        progressFill.style.width = Math.round((discoveredCount / anilar.length) * 100) + "%";
        const hud = document.getElementById("hud-score");
        if (hud) { hud.classList.add("pop"); setTimeout(() => hud.classList.remove("pop"), 400); }
    }

    let toastTimer;
    function showToast(emoji, text) {
        toast.querySelector(".toast-emoji").textContent = emoji;
        toastText.textContent = text;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
    }

    function flashScreen() {
        discoveryFlash.classList.remove("show"); void discoveryFlash.offsetWidth;
        discoveryFlash.classList.add("show");
        setTimeout(() => discoveryFlash.classList.remove("show"), 700);
    }

    function showSheet(ani) {
        document.getElementById("ak-baslik").textContent = ani.baslik;
        const de = document.getElementById("ak-tarih"), fe = document.getElementById("ak-foto"), pe = document.getElementById("ak-placeholder");
        if (ani.tarih) { de.textContent = `📅 ${ani.tarih}`; de.style.display = "block"; } else de.style.display = "none";
        if (ani.foto) { fe.src = `assets/${ani.foto}`; fe.alt = ani.baslik; fe.style.display = "block"; pe.style.display = "none"; }
        else { fe.src = "assets/placeholder.jpeg"; fe.alt = ani.baslik; fe.style.display = "block"; pe.style.display = "none"; }
        document.getElementById("ak-metin").textContent = ani.metin;
        sheet.classList.add("show"); sheetOverlay.classList.add("show");
    }
    function hideSheet() { sheet.classList.remove("show"); sheetOverlay.classList.remove("show"); }

    function showSurpriseButton() { if (!surpriseShown) surprizContainer.classList.add("show"); }

    function openSurpriseModal() {
        surpriseShown = true; surprizContainer.classList.remove("show"); hideSheet();
        modalOverlay.classList.add("show"); typewriterModal(finalMesaj);
    }
    function closeSurpriseModal() { modalOverlay.classList.remove("show"); }

    let twInt;
    function typewriterModal(text) {
        modalMesaj.innerHTML = '<span class="cursor"></span>';
        let i = 0;
        if (twInt) clearInterval(twInt);
        twInt = setInterval(() => {
            if (i < text.length) { const c = modalMesaj.querySelector(".cursor"); if (c) c.insertAdjacentText("beforebegin", text[i]); i++; }
            else { clearInterval(twInt); setTimeout(() => { const c = modalMesaj.querySelector(".cursor"); if (c) c.remove(); }, 2000); }
        }, 40);
    }

    function flyToNearest() {
        if (!characterMarker) return;
        const cLL = characterMarker.getLatLng();
        let closest = null, cd = Infinity;
        memoryMarkers.forEach(m => { if (triggeredMemories.has(m._aniData.id)) return; const d = cLL.distanceTo(m.getLatLng()); if (d < cd) { cd = d; closest = m; } });
        if (closest) { map.flyTo(closest.getLatLng(), 14, { duration: 0.8 }); showToast("🧭", "O tarafa git!"); }
        else showToast("🎉", "Tüm anıları buldun!");
    }

    // ==========================================
    //  CONFETTI
    // ==========================================
    function launchConfetti() {
        const canvas = document.getElementById("confetti-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const pieces = [], colors = ["#e8807f", "#f4b5b4", "#d4a574", "#f0dfc8", "#fce4ec", "#f3e5f5", "#ff6b6b", "#ffd93d"];
        for (let i = 0; i < 100; i++) pieces.push({
            x: Math.random() * canvas.width, y: -Math.random() * canvas.height * 0.5,
            size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
            shape: ["heart", "circle", "rect"][Math.floor(Math.random() * 3)],
            vy: Math.random() * 3 + 1.5, vx: (Math.random() - 0.5) * 3,
            rot: Math.random() * 360, vr: (Math.random() - 0.5) * 8, opacity: 1,
        });
        let frame = 0;
        (function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            pieces.forEach(p => {
                if (p.opacity <= 0) return; alive++;
                p.y += p.vy; p.x += p.vx; p.rot += p.vr;
                if (frame > 80) p.opacity -= 0.012;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
                ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
                if (p.shape === "heart") {
                    const s = p.size * 0.5; ctx.beginPath();
                    ctx.moveTo(0, s * 0.3); ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.3);
                    ctx.bezierCurveTo(-s, s * 0.8, 0, s * 1.2, 0, s * 1.5);
                    ctx.bezierCurveTo(0, s * 1.2, s, s * 0.8, s, s * 0.3);
                    ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3); ctx.fill();
                } else if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2); ctx.fill(); }
                else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });
            frame++;
            if (alive > 0) requestAnimationFrame(draw);
        })();
        showToast("🎉", "Tüm anıları keşfettin! Tebrikler!");
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================
    function setupEventListeners() {
        sheetClose.addEventListener("click", hideSheet);
        sheetOverlay.addEventListener("click", hideSheet);
        surprizBtn.addEventListener("click", openSurpriseModal);
        modalKapat.addEventListener("click", closeSurpriseModal);
        modalTekrar.addEventListener("click", () => typewriterModal(finalMesaj));
        modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeSurpriseModal(); });
        btnCompass.addEventListener("click", flyToNearest);
        document.addEventListener("keydown", e => { if (e.key === "Escape") { closeSurpriseModal(); hideSheet(); } });
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
