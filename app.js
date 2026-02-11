// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Valentine's Day Game — Main Logic v3
// ==========================================

(function () {
    "use strict";

    // ---------- State ----------
    let map;
    let mapBounds;
    let characterMarker;
    let memoryMarkers = [];
    let triggeredMemories = new Set();
    let discoveredCount = 0;
    let surpriseShown = false;
    let distanceInterval;
    let moveAnimation = null;
    let activeKeys = new Set();
    let keyMoveInterval = null;

    const PROXIMITY_THRESHOLD = 500;
    const NEARBY_THRESHOLD = 1500;
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 18;
    const DEFAULT_ZOOM = 13;
    const MOVE_SPEED = 0.0004;       // derece/frame — keyboard & dpad
    const MOVE_INTERVAL = 30;        // ms — keyboard & dpad frame hızı
    const TAP_MOVE_DURATION = 1500;   // ms — tap-to-move animasyon süresi

    // ---------- DOM ----------
    const splash = document.getElementById("splash");
    const btnPlay = document.getElementById("btn-play");
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

    // D-Pad buttons
    const dpadUp = document.getElementById("dpad-up");
    const dpadDown = document.getElementById("dpad-down");
    const dpadLeft = document.getElementById("dpad-left");
    const dpadRight = document.getElementById("dpad-right");

    // ---------- Init ----------
    function init() {
        setupSplash();
        setupParticles();
    }

    // ---------- Splash ----------
    function setupSplash() {
        const sub = document.getElementById("splash-sub");
        if (sub) sub.innerHTML = `<strong>${config.seninAd}</strong> için bir sürpriz hazırladım...`;
        btnPlay.addEventListener("click", startGame);
    }

    function startGame() {
        splash.classList.add("hidden");
        setupMap();
        setupEventListeners();
        setupKeyboard();
        setupDpad();
        updateScore();
        startDistanceTracker();
        setTimeout(() => showToast("💡", "Haritaya dokun veya kontrolleri kullan!"), 800);
    }

    // ---------- Particles ----------
    function setupParticles() {
        const canvas = document.getElementById("particles-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let particles = [];

        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        resize();
        window.addEventListener("resize", resize);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 1;
                this.vy = -(Math.random() * 0.5 + 0.1);
                this.vx = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.hue = Math.random() > 0.5 ? 0 : 30;
            }
            update() {
                this.y += this.vy; this.x += this.vx; this.opacity -= 0.001;
                if (this.y < -10 || this.opacity <= 0) { this.reset(); this.y = canvas.height + 10; }
            }
            draw() {
                ctx.save(); ctx.globalAlpha = this.opacity;
                ctx.fillStyle = `hsl(${this.hue}, 80%, 80%)`;
                ctx.beginPath();
                const s = this.size;
                ctx.moveTo(this.x, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x, this.y, this.x - s, this.y, this.x - s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x - s, this.y + s * 0.8, this.x, this.y + s * 1.2, this.x, this.y + s * 1.5);
                ctx.bezierCurveTo(this.x, this.y + s * 1.2, this.x + s, this.y + s * 0.8, this.x + s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x + s, this.y, this.x, this.y, this.x, this.y + s * 0.3);
                ctx.fill(); ctx.restore();
            }
        }
        for (let i = 0; i < 25; i++) particles.push(new Particle());
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ---------- Map Setup ----------
    function setupMap() {
        const pointBounds = L.latLngBounds(anilar.map(a => [a.lat, a.lng]));
        const paddedBounds = pointBounds.pad(0.3);
        mapBounds = paddedBounds;

        map = L.map("map", {
            center: pointBounds.getCenter(),
            zoom: DEFAULT_ZOOM,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            maxBounds: paddedBounds,
            maxBoundsViscosity: 1.0,
            bounceAtZoomLimits: true,
            zoomControl: false,
            attributionControl: true,
        });

        map.on("drag", () => map.panInsideBounds(paddedBounds, { animate: false }));

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: MAX_ZOOM,
            bounds: paddedBounds,
        }).addTo(map);

        map.fitBounds(pointBounds.pad(0.15));
        addMemoryMarkers();

        const c = pointBounds.getCenter();
        addCharacterMarker(c.lat, c.lng);

        // Tap-to-move
        map.on("click", onMapTap);
    }

    // ==========================================
    //  TAP-TO-MOVE
    // ==========================================
    function onMapTap(e) {
        // Eğer sheet/modal açıksa veya UI öğesine tıklandıysa, hareket ettirme
        if (sheet.classList.contains("show") || modalOverlay.classList.contains("show")) return;

        const target = clampToBounds(e.latlng);
        moveCharacterTo(target);
    }

    function moveCharacterTo(targetLL) {
        if (moveAnimation) cancelAnimationFrame(moveAnimation);

        const start = characterMarker.getLatLng();
        const startTime = performance.now();

        // Mesafeye göre süre ayarla
        const dist = start.distanceTo(targetLL);
        const duration = Math.min(Math.max(dist * 2, 400), 3000);

        // Hedef çizgisi göster
        showMoveLine(start, targetLL);

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const ease = 1 - Math.pow(1 - t, 3);

            const lat = start.lat + (targetLL.lat - start.lat) * ease;
            const lng = start.lng + (targetLL.lng - start.lng) * ease;
            const pos = L.latLng(lat, lng);

            characterMarker.setLatLng(pos);
            map.panTo(pos, { animate: false });
            checkProximity(pos);
            updateNearbyGlow(pos);

            if (t < 1) {
                moveAnimation = requestAnimationFrame(step);
            } else {
                moveAnimation = null;
                removeMoveLine();
            }
        }
        moveAnimation = requestAnimationFrame(step);
    }

    // Hareket çizgisi
    let moveLine = null;
    function showMoveLine(from, to) {
        removeMoveLine();
        moveLine = L.polyline([from, to], {
            color: "#e8807f",
            weight: 2,
            opacity: 0.4,
            dashArray: "6, 8",
        }).addTo(map);
    }
    function removeMoveLine() {
        if (moveLine) { map.removeLayer(moveLine); moveLine = null; }
    }

    // ==========================================
    //  KEYBOARD CONTROLS (Desktop)
    // ==========================================
    function setupKeyboard() {
        document.addEventListener("keydown", e => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
                e.preventDefault();
                activeKeys.add(e.key.toLowerCase());
                startKeyMove();
            }
        });
        document.addEventListener("keyup", e => {
            activeKeys.delete(e.key.toLowerCase());
            if (activeKeys.size === 0) stopKeyMove();
        });
    }

    function startKeyMove() {
        if (keyMoveInterval) return;
        // Tap-to-move'u iptal et
        if (moveAnimation) { cancelAnimationFrame(moveAnimation); moveAnimation = null; removeMoveLine(); }

        keyMoveInterval = setInterval(() => {
            if (!characterMarker) return;
            let ll = characterMarker.getLatLng();
            let dlat = 0, dlng = 0;

            if (activeKeys.has("arrowup") || activeKeys.has("w")) dlat += MOVE_SPEED;
            if (activeKeys.has("arrowdown") || activeKeys.has("s")) dlat -= MOVE_SPEED;
            if (activeKeys.has("arrowleft") || activeKeys.has("a")) dlng -= MOVE_SPEED;
            if (activeKeys.has("arrowright") || activeKeys.has("d")) dlng += MOVE_SPEED;

            if (dlat === 0 && dlng === 0) return;

            const newLL = clampToBounds(L.latLng(ll.lat + dlat, ll.lng + dlng));
            characterMarker.setLatLng(newLL);
            map.panTo(newLL, { animate: false });
            checkProximity(newLL);
            updateNearbyGlow(newLL);
        }, MOVE_INTERVAL);
    }

    function stopKeyMove() {
        clearInterval(keyMoveInterval);
        keyMoveInterval = null;
    }

    // ==========================================
    //  D-PAD (Mobile On-Screen Controls)
    // ==========================================
    function setupDpad() {
        const dirs = {
            "dpad-up": { dlat: MOVE_SPEED, dlng: 0 },
            "dpad-down": { dlat: -MOVE_SPEED, dlng: 0 },
            "dpad-left": { dlat: 0, dlng: -MOVE_SPEED },
            "dpad-right": { dlat: 0, dlng: MOVE_SPEED },
        };

        let dpadInterval = null;
        let activeTouches = new Set();

        function startDpadMove(dirId) {
            activeTouches.add(dirId);
            if (moveAnimation) { cancelAnimationFrame(moveAnimation); moveAnimation = null; removeMoveLine(); }
            if (dpadInterval) return;

            dpadInterval = setInterval(() => {
                if (!characterMarker || activeTouches.size === 0) return;
                let ll = characterMarker.getLatLng();
                let dlat = 0, dlng = 0;
                activeTouches.forEach(id => {
                    const d = dirs[id];
                    if (d) { dlat += d.dlat; dlng += d.dlng; }
                });
                const newLL = clampToBounds(L.latLng(ll.lat + dlat, ll.lng + dlng));
                characterMarker.setLatLng(newLL);
                map.panTo(newLL, { animate: false });
                checkProximity(newLL);
                updateNearbyGlow(newLL);
            }, MOVE_INTERVAL);
        }

        function stopDpadMove(dirId) {
            activeTouches.delete(dirId);
            if (activeTouches.size === 0 && dpadInterval) {
                clearInterval(dpadInterval);
                dpadInterval = null;
            }
        }

        // Tüm yönler için event listener
        Object.keys(dirs).forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // Touch
            btn.addEventListener("touchstart", e => { e.preventDefault(); startDpadMove(id); btn.classList.add("active"); }, { passive: false });
            btn.addEventListener("touchend", e => { e.preventDefault(); stopDpadMove(id); btn.classList.remove("active"); }, { passive: false });
            btn.addEventListener("touchcancel", e => { stopDpadMove(id); btn.classList.remove("active"); });

            // Mouse (fallback desktop)
            btn.addEventListener("mousedown", e => { e.preventDefault(); startDpadMove(id); btn.classList.add("active"); });
            btn.addEventListener("mouseup", e => { stopDpadMove(id); btn.classList.remove("active"); });
            btn.addEventListener("mouseleave", e => { stopDpadMove(id); btn.classList.remove("active"); });
        });
    }

    // ==========================================
    //  BOUNDARY HELPER
    // ==========================================
    function clampToBounds(ll) {
        if (!mapBounds) return ll;
        // İç sınır — kenardan biraz içeride tut
        const inset = 0.003; // ~330m iç padding
        const minLat = mapBounds.getSouth() + inset;
        const maxLat = mapBounds.getNorth() - inset;
        const minLng = mapBounds.getWest() + inset;
        const maxLng = mapBounds.getEast() - inset;

        return L.latLng(
            Math.max(minLat, Math.min(maxLat, ll.lat)),
            Math.max(minLng, Math.min(maxLng, ll.lng))
        );
    }

    // ---------- Memory Markers ----------
    function addMemoryMarkers() {
        anilar.forEach(ani => {
            const icon = L.divIcon({
                className: "memory-marker undiscovered",
                html: '<span class="marker-inner">❓</span>',
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            });

            const marker = L.marker([ani.lat, ani.lng], { icon, interactive: false }).addTo(map);

            marker.bindPopup(`<div class="popup-content">
        <h3>${ani.baslik}</h3>
        ${ani.tarih ? `<div class="popup-date">📅 ${ani.tarih}</div>` : ""}
      </div>`, { closeButton: true, maxWidth: 200, autoPan: false });

            marker._aniData = ani;
            memoryMarkers.push(marker);
        });
    }

    // ---------- Character Marker ----------
    function addCharacterMarker(lat, lng) {
        const charIcon = L.divIcon({
            className: "heart-marker",
            html: "💑",
            iconSize: [44, 44],
            iconAnchor: [22, 22],
        });

        characterMarker = L.marker([lat, lng], {
            icon: charIcon,
            draggable: true,
            autoPan: true,
            autoPanPadding: [60, 60],
            autoPanSpeed: 10,
        }).addTo(map);

        // Drag hala çalışır (fallback)
        characterMarker.on("dragstart", () => {
            if (moveAnimation) { cancelAnimationFrame(moveAnimation); moveAnimation = null; removeMoveLine(); }
            map.dragging.disable();
            map.closePopup();
            const el = characterMarker.getElement();
            if (el) el.classList.add("dragging");
        });

        characterMarker.on("drag", e => {
            const ll = clampToBounds(e.target.getLatLng());
            e.target.setLatLng(ll);
            checkProximity(ll);
            updateNearbyGlow(ll);
        });

        characterMarker.on("dragend", e => {
            map.dragging.enable();
            const el = characterMarker.getElement();
            if (el) el.classList.remove("dragging");
            const ll = e.target.getLatLng();
            checkProximity(ll);
            updateNearbyGlow(ll);
        });
    }

    // ---------- Proximity Check ----------
    function checkProximity(charLL) {
        memoryMarkers.forEach(marker => {
            const ani = marker._aniData;
            const dist = charLL.distanceTo(marker.getLatLng());

            if (dist < PROXIMITY_THRESHOLD && !triggeredMemories.has(ani.id)) {
                triggeredMemories.add(ani.id);
                discoveredCount++;

                const emoji = ani.surpriz ? "✨" : ["📍", "🌅", "🎨", "🎭", "🏰", "💫"][ani.id % 6];
                marker.setIcon(L.divIcon({
                    className: "memory-marker discovered",
                    html: `<span class="marker-inner">${emoji}</span>`,
                    iconSize: [38, 38], iconAnchor: [19, 19],
                }));

                marker.openPopup();
                flashScreen();
                updateScore();

                if (ani.surpriz) {
                    showToast("✨", "Sürpriz noktasını buldun!");
                    showSurpriseButton();
                } else {
                    showToast("💕", `"${ani.baslik}" keşfedildi!`);
                    showSheet(ani);
                }

                if (discoveredCount === anilar.length) {
                    setTimeout(() => launchConfetti(), 500);
                }
            }
        });
    }

    // ---------- Nearby Glow + Distance ----------
    function updateNearbyGlow(charLL) {
        let closest = null, closestDist = Infinity;

        memoryMarkers.forEach(marker => {
            const ani = marker._aniData;
            if (triggeredMemories.has(ani.id)) return;
            const d = charLL.distanceTo(marker.getLatLng());
            if (d < closestDist) { closestDist = d; closest = marker; }
            const el = marker.getElement();
            if (!el) return;
            if (d < NEARBY_THRESHOLD) el.classList.add("nearby");
            else el.classList.remove("nearby");
        });

        if (closest && closestDist < 50000) {
            const m = Math.round(closestDist);
            distanceText.textContent = m >= 1000 ? `En yakın: ${(m / 1000).toFixed(1)} km` : `En yakın: ${m} m`;
            const mLL = closest.getLatLng();
            const angle = Math.atan2(mLL.lng - charLL.lng, mLL.lat - charLL.lat) * (180 / Math.PI);
            distanceArrow.style.transform = `rotate(${-angle + 180}deg)`;
            distanceBadge.style.opacity = "1";
        } else {
            distanceBadge.style.opacity = "0";
        }
    }

    function startDistanceTracker() {
        distanceInterval = setInterval(() => {
            if (characterMarker) updateNearbyGlow(characterMarker.getLatLng());
        }, 1000);
    }

    // ---------- Score ----------
    function updateScore() {
        scoreText.textContent = `${discoveredCount} / ${anilar.length}`;
        progressFill.style.width = Math.round((discoveredCount / anilar.length) * 100) + "%";
    }

    // ---------- Toast ----------
    let toastTimer;
    function showToast(emoji, text) {
        toast.querySelector(".toast-emoji").textContent = emoji;
        toastText.textContent = text;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
    }

    // ---------- Flash ----------
    function flashScreen() {
        discoveryFlash.classList.remove("show");
        void discoveryFlash.offsetWidth;
        discoveryFlash.classList.add("show");
        setTimeout(() => discoveryFlash.classList.remove("show"), 700);
    }

    // ---------- Bottom Sheet ----------
    function showSheet(ani) {
        document.getElementById("ak-baslik").textContent = ani.baslik;
        const dateEl = document.getElementById("ak-tarih");
        const fotoEl = document.getElementById("ak-foto");
        const placeholderEl = document.getElementById("ak-placeholder");

        if (ani.tarih) { dateEl.textContent = `📅 ${ani.tarih}`; dateEl.style.display = "block"; }
        else dateEl.style.display = "none";

        if (ani.foto) {
            fotoEl.src = `assets/${ani.foto}`; fotoEl.alt = ani.baslik;
            fotoEl.style.display = "block"; placeholderEl.style.display = "none";
        } else {
            fotoEl.style.display = "none"; placeholderEl.style.display = "flex";
            placeholderEl.textContent = ["💕", "🌸", "🌅", "💫", "🎀", "🦋"][ani.id % 6];
        }
        document.getElementById("ak-metin").textContent = ani.metin;
        sheet.classList.add("show");
        sheetOverlay.classList.add("show");
    }

    function hideSheet() {
        sheet.classList.remove("show");
        sheetOverlay.classList.remove("show");
    }

    // ---------- Surprise ----------
    function showSurpriseButton() {
        if (surpriseShown) return;
        surprizContainer.classList.add("show");
    }

    function openSurpriseModal() {
        surpriseShown = true;
        surprizContainer.classList.remove("show");
        hideSheet();
        modalOverlay.classList.add("show");
        typewriterEffect(finalMesaj);
    }

    function closeSurpriseModal() {
        modalOverlay.classList.remove("show");
    }

    // ---------- Typewriter ----------
    let twInterval;
    function typewriterEffect(text) {
        modalMesaj.innerHTML = '<span class="cursor"></span>';
        let i = 0;
        if (twInterval) clearInterval(twInterval);
        twInterval = setInterval(() => {
            if (i < text.length) {
                const c = modalMesaj.querySelector(".cursor");
                if (c) c.insertAdjacentText("beforebegin", text[i]);
                i++;
            } else {
                clearInterval(twInterval);
                setTimeout(() => { const c = modalMesaj.querySelector(".cursor"); if (c) c.remove(); }, 2000);
            }
        }, 40);
    }

    // ---------- Compass ----------
    function flyToNearest() {
        if (!characterMarker) return;
        const charLL = characterMarker.getLatLng();
        let closest = null, closestDist = Infinity;
        memoryMarkers.forEach(m => {
            if (triggeredMemories.has(m._aniData.id)) return;
            const d = charLL.distanceTo(m.getLatLng());
            if (d < closestDist) { closestDist = d; closest = m; }
        });
        if (closest) {
            map.flyTo(closest.getLatLng(), 14, { duration: 0.8 });
            showToast("🧭", "En yakın anıya yaklaş!");
        } else {
            showToast("🎉", "Tüm anıları keşfettin!");
        }
    }

    // ---------- Confetti ----------
    function launchConfetti() {
        const canvas = document.getElementById("confetti-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ["#e8807f", "#f4b5b4", "#d4a574", "#f0dfc8", "#fce4ec", "#f3e5f5", "#ff6b6b", "#ffd93d"];

        for (let i = 0; i < 80; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height * 0.5,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: ["heart", "circle", "rect"][Math.floor(Math.random() * 3)],
                vy: Math.random() * 3 + 2, vx: (Math.random() - 0.5) * 2,
                rot: Math.random() * 360, vr: (Math.random() - 0.5) * 6, opacity: 1,
            });
        }

        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            pieces.forEach(p => {
                if (p.opacity <= 0) return;
                alive++;
                p.y += p.vy; p.x += p.vx; p.rot += p.vr;
                if (frame > 60) p.opacity -= 0.015;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                if (p.shape === "heart") {
                    const s = p.size * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(0, s * 0.3);
                    ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.3);
                    ctx.bezierCurveTo(-s, s * 0.8, 0, s * 1.2, 0, s * 1.5);
                    ctx.bezierCurveTo(0, s * 1.2, s, s * 0.8, s, s * 0.3);
                    ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3);
                    ctx.fill();
                } else if (p.shape === "circle") {
                    ctx.beginPath(); ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                }
                ctx.restore();
            });
            frame++;
            if (alive > 0) requestAnimationFrame(draw);
        }
        draw();
        showToast("🎉", "Tüm anıları keşfettin! Tebrikler!");
    }

    // ---------- Event Listeners ----------
    function setupEventListeners() {
        sheetClose.addEventListener("click", hideSheet);
        sheetOverlay.addEventListener("click", hideSheet);
        surprizBtn.addEventListener("click", openSurpriseModal);
        modalKapat.addEventListener("click", closeSurpriseModal);
        modalTekrar.addEventListener("click", () => typewriterEffect(finalMesaj));
        modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeSurpriseModal(); });
        btnCompass.addEventListener("click", flyToNearest);
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") { closeSurpriseModal(); hideSheet(); }
        });
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
