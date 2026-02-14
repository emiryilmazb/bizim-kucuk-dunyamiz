// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Valentine's Day Game — v6 (Story Exploration)
// ==========================================

(function () {
    "use strict";

    // ---------- Introduction State ----------
    let currentStep = 1;
    const totalSteps = 3;

    // ---------- Game State ----------
    let map, mapBounds, characterMarker;
    let moveAnimation = null;
    let activeKeys = new Set();
    let keyMoveRAF = null;
    let lastMoveTime = 0;
    let trailPoints = [];
    let trailLine = null;
    let finaleTriggered = false;

    const PROXIMITY_THRESHOLD = 500;
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
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    const discoveryFlash = document.getElementById("discovery-flash");
    const sheet = document.getElementById("sheet");
    const sheetOverlay = document.getElementById("sheet-overlay");
    const sheetClose = document.getElementById("sheet-close");
    const warmthDot = document.getElementById("warmth-dot");
    const warmthText = document.getElementById("warmth-label");
    const hintPill = document.getElementById("hint-pill");
    const hintText = document.getElementById("hint-text");

    // Track the currently active (shown in sheet) location
    let currentSheetLocId = null;

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
        setTimeout(() => {
            typewriterIntro("step1-text", "Sana özel bir dünya hazırladım...", 60);
        }, 600);

        document.getElementById("step-1").addEventListener("click", () => goToStep(2));
        document.getElementById("step-2").addEventListener("click", () => goToStep(3));
        document.getElementById("btn-start").addEventListener("click", (e) => {
            e.stopPropagation();
            startGame();
        });
    }

    function goToStep(step) {
        if (step <= currentStep) return;
        const prev = document.getElementById(`step-${currentStep}`);
        if (prev) prev.classList.remove("active");
        currentStep = step;
        const next = document.getElementById(`step-${step}`);
        if (next) next.classList.add("active");
        if (step === 2) animateStep2();
        if (step === 3) animateStep3();
    }

    function animateStep2() {
        const lines = document.querySelectorAll(".letter-line");
        lines.forEach((line, i) => {
            const delay = parseInt(line.dataset.delay) || i * 600;
            setTimeout(() => line.classList.add("show"), delay + 400);
        });
    }

    function animateStep3() {
        const rules = document.querySelectorAll(".rule");
        rules.forEach((rule, i) => {
            setTimeout(() => rule.classList.add("show"), i * 250 + 300);
        });
    }

    function typewriterIntro(elementId, text, speed) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = "";
        let i = 0;
        const iv = setInterval(() => {
            if (i < text.length) { el.textContent += text[i]; i++; }
            else clearInterval(iv);
        }, speed);
    }

    // ==========================================
    //  START GAME
    // ==========================================
    function startGame() {
        for (let i = 1; i <= totalSteps; i++) {
            const s = document.getElementById(`step-${i}`);
            if (s) s.classList.remove("active");
        }

        const game = document.getElementById("game");
        game.style.display = "block";
        document.body.style.background = "#fdf6f0";

        setTimeout(() => {
            // Load progress
            progressStore.load(locations);

            setupMap();
            setupEventListeners();
            setupKeyboard();
            setupDpad();
            setupSheetGestures();
            setupLightbox();
            setupSettings();
            updateScore();
            updateHintPill();

            setTimeout(() => showToast("💕", "Birlikte yürüdüğümüz yollar seni bekliyor!"), 600);
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
                this.h = [0, 330, 350, 15][Math.floor(Math.random() * 4)];
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
        const pointBounds = L.latLngBounds(locations.map(a => [a.x, a.y]));
        const paddedBounds = pointBounds.pad(0.3);
        mapBounds = paddedBounds;

        map = L.map("map", {
            center: pointBounds.getCenter(),
            zoom: DEFAULT_ZOOM,
            minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
            maxBounds: paddedBounds, maxBoundsViscosity: 1.0,
            bounceAtZoomLimits: true, zoomControl: false, attributionControl: false,
        });

        map.on("drag", () => map.panInsideBounds(paddedBounds, { animate: false }));
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap", maxZoom: MAX_ZOOM, bounds: paddedBounds,
        }).addTo(map);

        map.fitBounds(pointBounds.pad(0.15));

        // Marker manager: only shows unlocked markers
        markerManager.init(map, locations);

        // Character
        const c = pointBounds.getCenter();
        addCharacterMarker(c.lat, c.lng);

        // Fog overlay
        fogOverlay.init(map);
        fogOverlay.restoreFromViewed(locations);
        fogOverlay.updateAvatar(characterMarker.getLatLng());

        // Check if all viewed → spawn finale
        if (progressStore.isAllViewed(locations) && !finaleTriggered) {
            markerManager.spawnFinaleMarker(finaleLocation);
        }

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
    //  WARMTH — only tracks next unlocked, unviewed marker
    // ==========================================
    function updateWarmth(charLL) {
        const allMarkers = markerManager.getMarkers();
        let closestDist = Infinity, closest = null;

        allMarkers.forEach(m => {
            const loc = m._locData;
            if (progressStore.isViewed(loc.id)) return;
            const d = charLL.distanceTo(m.getLatLng());
            if (d < closestDist) { closestDist = d; closest = m; }
        });

        // Also check finale marker
        const finaleM = markerManager.getFinaleMarker();
        if (finaleM) {
            const d = charLL.distanceTo(finaleM.getLatLng());
            if (d < closestDist) { closestDist = d; closest = finaleM; }
        }

        if (closestDist === Infinity) {
            if (distanceBadge) distanceBadge.style.opacity = "0";
            updateGuideLine(null, null);
            return;
        }

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
            if (warmth > 0.8) warmthText.textContent = "Çok yakın! 💓";
            else if (warmth > 0.5) warmthText.textContent = "Yaklaşıyorsun 🌹";
            else if (warmth > 0.25) warmthText.textContent = "Yoldasın...";
            else warmthText.textContent = "Keşfet ✨";
        }
        if (distanceBadge) distanceBadge.style.opacity = "1";

        // SVG arrow direction — use screen-space pixels for correct rotation
        if (closest) {
            const arrowWrap = document.getElementById("warmth-arrow-wrap");
            if (arrowWrap) {
                const charPx = map.latLngToContainerPoint(charLL);
                const targetPx = map.latLngToContainerPoint(closest.getLatLng());
                // atan2(dx, -dy) because screen Y is inverted (down = positive)
                const angle = Math.atan2(targetPx.x - charPx.x, -(targetPx.y - charPx.y)) * (180 / Math.PI);
                arrowWrap.style.transform = `rotate(${angle}deg)`;
            }

            // Update guide line
            updateGuideLine(charLL, closest.getLatLng());
        }
    }

    // ==========================================
    //  GUIDE LINE — dashed line from avatar to next marker
    // ==========================================
    let guideLine = null;
    function updateGuideLine(fromLL, toLL) {
        if (guideLine) { map.removeLayer(guideLine); guideLine = null; }
        if (!fromLL || !toLL) return;

        guideLine = L.polyline([
            [fromLL.lat, fromLL.lng],
            [toLL.lat, toLL.lng]
        ], {
            color: "#e8807f",
            weight: 3.5,
            opacity: 0.65,
            dashArray: "8,12",
            lineCap: "round",
            interactive: false,
            className: "guide-line-path"
        }).addTo(map);
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
        if (sheet.classList.contains("show")) return;
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
            updateWarmth(pos);
            fogOverlay.updateAvatar(pos);

            if (t < 1) moveAnimation = requestAnimationFrame(step);
            else { moveAnimation = null; setCharacterMoving(false); }
        }
        moveAnimation = requestAnimationFrame(step);
    }

    function setCharacterMoving(m) {
        const el = characterMarker ? characterMarker.getElement() : null;
        if (!el) return;
        if (m) {
            el.classList.add("moving");
            const img = el.querySelector(".char-img");
            if (img) img.src = "assets/us_with_bmw.png";
        } else {
            el.classList.remove("moving");
            const img = el.querySelector(".char-img");
            if (img) img.src = "assets/us.png";
        }
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
    //  CONTINUOUS MOVE
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
            updateWarmth(newLL);
            fogOverlay.updateAvatar(newLL);
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
    //  CHARACTER MARKER — Custom Image
    // ==========================================
    function addCharacterMarker(lat, lng) {
        characterMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: "heart-marker",
                html: '<img class="char-img" src="assets/us.png" alt="Biz" draggable="false" />',
                iconSize: [52, 52], iconAnchor: [26, 26],
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
            checkProximity(ll); updateWarmth(ll);
            fogOverlay.updateAvatar(ll);
        });
        characterMarker.on("dragend", () => { map.dragging.enable(); setCharacterMoving(false); });
    }

    // ==========================================
    //  PROXIMITY — Sequential unlock logic
    // ==========================================
    function checkProximity(charLL) {
        // Check regular markers (only unlocked, unviewed)
        const allMarkers = markerManager.getMarkers();
        allMarkers.forEach(marker => {
            const loc = marker._locData;
            if (progressStore.isViewed(loc.id)) return;
            if (charLL.distanceTo(marker.getLatLng()) < PROXIMITY_THRESHOLD) {
                onLocationDiscovered(loc, marker);
            }
        });

        // Check finale marker
        const finaleM = markerManager.getFinaleMarker();
        if (finaleM && !finaleTriggered) {
            if (charLL.distanceTo(finaleM.getLatLng()) < PROXIMITY_THRESHOLD) {
                finaleTriggered = true;
                finaleSequence.trigger(map);
            }
        }
    }

    /**
     * When the avatar reaches an unlocked marker
     */
    function onLocationDiscovered(loc, marker) {
        // Mark as viewed immediately
        progressStore.markViewed(loc.id);
        markerManager.markDiscovered(loc.id);

        // Reveal fog at this location
        fogOverlay.addRevealedLocation(loc.x, loc.y);

        // Visual feedback
        marker.openPopup();
        flashScreen();
        updateScore();
        spawnFloatingEmojis(marker.getLatLng(), 6);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        const emojis = ["💖", "🌹", "🌟", "🥰", "💞"];
        const emoji = emojis[loc.order - 1] || "💫";
        const loveTexts = [
            "Bu anıyı hatırlıyor musun?",
            "Ne güzel günlermiş...",
            "Kalbimde hep saklayacağım hatıra 💓",
            "Seninle her an böyle güzel ✨",
            "Bu anı asla unutmayacağım 💕"
        ];
        showToast(emoji, loveTexts[loc.order - 1] || `"${loc.title}" keşfedildi!`);

        // Show memory sheet
        currentSheetLocId = loc.id;
        setTimeout(() => showSheet(loc), 400);
    }

    // ==========================================
    //  UI HELPERS
    // ==========================================
    function updateScore() {
        const viewed = progressStore.getState().viewedIds.length;
        scoreText.textContent = `${viewed} / ${locations.length}`;
        progressFill.style.width = Math.round((viewed / locations.length) * 100) + "%";
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

    function showSheet(loc) {
        document.getElementById("ak-baslik").textContent = loc.title;
        const de = document.getElementById("ak-tarih");
        const fe = document.getElementById("ak-foto");
        const pe = document.getElementById("ak-placeholder");

        if (loc.date) { de.textContent = `📅 ${loc.date}`; de.style.display = "block"; }
        else de.style.display = "none";

        if (loc.photoUrl) {
            fe.src = `assets/${loc.photoUrl}`;
            fe.alt = loc.title;
            fe.style.display = "block";
            pe.style.display = "none";
        } else {
            fe.src = "assets/placeholder.jpeg";
            fe.alt = loc.title;
            fe.style.display = "block";
            pe.style.display = "none";
        }

        document.getElementById("ak-metin").textContent = loc.description;
        sheet.classList.remove("expanded");
        sheet.classList.add("show");
        sheetOverlay.classList.add("show");
    }

    function hideSheet() {
        const wasShowing = sheet.classList.contains("show");
        sheet.classList.remove("show", "expanded");
        sheetOverlay.classList.remove("show");
        sheet.style.transform = "";

        // On close: unlock next marker
        if (wasShowing && currentSheetLocId) {
            const closedId = currentSheetLocId;
            currentSheetLocId = null;

            // Check if all locations are now viewed
            if (progressStore.isAllViewed(locations)) {
                // Spawn finale marker
                if (!markerManager.getFinaleMarker()) {
                    setTimeout(() => {
                        markerManager.spawnFinaleMarker(finaleLocation);
                        updateHintPill();
                        showToast("💖", "Son sürpriz hazır... seni bekliyor!");
                    }, 500);
                }
            } else {
                // Unlock the next location
                const nextLoc = progressStore.unlockNext(locations);
                if (nextLoc) {
                    setTimeout(() => {
                        markerManager.unlockNextMarker(nextLoc);
                        updateHintPill();
                        showToast("🌹", `Yeni hatıra açıldı: "${nextLoc.title}"`);
                    }, 400);
                }
            }
        }
    }

    // ==========================================
    //  HINT PILL — "Next: {title}"
    // ==========================================
    function updateHintPill() {
        if (!hintPill || !hintText) return;

        const state = progressStore.getState();

        if (progressStore.isAllViewed(locations)) {
            if (finaleTriggered) {
                hintPill.style.display = "none";
            } else {
                hintText.textContent = "💖 Son sürpriz seni bekliyor!";
                hintPill.classList.add("finale-hint");
                hintPill.style.display = "flex";
            }
            return;
        }

        // Find next unviewed location that is unlocked
        const sorted = [...locations].sort((a, b) => a.order - b.order);
        const next = sorted.find(l => progressStore.isUnlocked(l.id) && !progressStore.isViewed(l.id));

        if (next) {
            hintText.textContent = `🌹 Sonraki: ${next.title}`;
            hintPill.classList.remove("finale-hint");
            hintPill.style.display = "flex";
        } else {
            hintPill.style.display = "none";
        }
    }

    // ==========================================
    //  SETTINGS (Reset Progress)
    // ==========================================
    function setupSettings() {
        const btn = document.getElementById("settings-btn");
        const panel = document.getElementById("settings-panel");
        const resetBtn = document.getElementById("reset-progress-btn");
        const cancelBtn = document.getElementById("reset-cancel-btn");

        if (!btn || !panel) return;

        btn.addEventListener("click", () => {
            panel.classList.toggle("show");
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                progressStore.reset();
                panel.classList.remove("show");
                // Reload the page to restart cleanly
                window.location.reload();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                panel.classList.remove("show");
            });
        }
    }

    // ==========================================
    //  SHEET SWIPE GESTURES
    // ==========================================
    function setupSheetGestures() {
        const handle = sheet.querySelector(".sheet-handle");
        if (!handle) return;

        let startY = 0, currentY = 0, isDragging = false;

        function onStart(e) {
            if (sheet.scrollTop > 5 && sheet.classList.contains("expanded")) return;
            isDragging = true;
            startY = (e.touches ? e.touches[0] : e).clientY;
            currentY = startY;
            sheet.classList.add("dragging");
        }

        function onMove(e) {
            if (!isDragging) return;
            currentY = (e.touches ? e.touches[0] : e).clientY;
            const dy = currentY - startY;
            if (dy > 0) {
                sheet.style.transform = `translateY(${dy}px)`;
            } else {
                const resistance = Math.abs(dy) * 0.5;
                sheet.style.transform = `translateY(${-resistance}px)`;
            }
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            sheet.classList.remove("dragging");
            const dy = currentY - startY;
            if (dy > 60) { hideSheet(); }
            else if (dy < -30) { sheet.style.transform = ""; sheet.classList.add("expanded"); }
            else { sheet.style.transform = ""; }
        }

        [handle, sheet].forEach(el => {
            el.addEventListener("touchstart", e => {
                if (el === sheet && sheet.scrollTop > 5) return;
                onStart(e);
            }, { passive: true });
        });

        document.addEventListener("touchmove", e => { if (isDragging) onMove(e); }, { passive: true });
        document.addEventListener("touchend", onEnd);
        document.addEventListener("touchcancel", onEnd);
        handle.addEventListener("mousedown", onStart);
        document.addEventListener("mousemove", e => { if (isDragging) onMove(e); });
        document.addEventListener("mouseup", onEnd);
    }

    // ==========================================
    //  LIGHTBOX (fullscreen photo)
    // ==========================================
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxClose = document.getElementById("lightbox-close");

    function setupLightbox() {
        document.getElementById("ak-foto").addEventListener("click", () => {
            const src = document.getElementById("ak-foto").src;
            if (!src) return;
            lightboxImg.src = src;
            lightbox.classList.add("show");
        });
        lightboxClose.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
    }

    function closeLightbox() {
        lightbox.classList.remove("show");
    }

    function flyToNearest() {
        if (!characterMarker) return;
        const cLL = characterMarker.getLatLng();
        let closest = null, cd = Infinity;

        // Check unlocked unviewed markers
        markerManager.getMarkers().forEach(m => {
            if (progressStore.isViewed(m._locData.id)) return;
            const d = cLL.distanceTo(m.getLatLng());
            if (d < cd) { cd = d; closest = m; }
        });

        // Check finale marker
        const finaleM = markerManager.getFinaleMarker();
        if (finaleM && !finaleTriggered) {
            const d = cLL.distanceTo(finaleM.getLatLng());
            if (d < cd) { cd = d; closest = finaleM; }
        }

        if (closest) {
            map.flyTo(closest.getLatLng(), 14, { duration: 0.8 });
            showToast("💓", "Kalbinin sesini takip et!");
        } else {
            showToast("💕", "Tüm anılarımızı buldun!");
        }
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
    }

    // ==========================================
    //  EVENT LISTENERS
    // ==========================================
    function setupEventListeners() {
        sheetClose.addEventListener("click", hideSheet);
        sheetOverlay.addEventListener("click", hideSheet);
        const btnCompass = document.getElementById("btn-compass");
        if (btnCompass) btnCompass.addEventListener("click", flyToNearest);

        // Finale overlay events
        const finaleSkip = document.getElementById("finale-skip-btn");
        if (finaleSkip) finaleSkip.addEventListener("click", () => finaleSequence.skip());

        const finaleBtn = document.getElementById("finale-continue-btn");
        if (finaleBtn) finaleBtn.addEventListener("click", () => finaleSequence.revealNote());

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") { closeLightbox(); hideSheet(); }
        });
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
