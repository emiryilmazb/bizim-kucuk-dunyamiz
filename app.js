// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Valentine's Day Game — Main Logic
// ==========================================

(function () {
    "use strict";

    // ---------- State ----------
    let map;
    let mapBounds;
    let characterMarker;
    let memoryMarkers = [];
    let triggeredMemories = new Set();
    let nearbyMarker = null;
    let discoveredCount = 0;
    let surpriseShown = false;
    let distanceInterval;

    const PROXIMITY_THRESHOLD = 500;   // keşif mesafesi (metre)
    const NEARBY_THRESHOLD = 1500;     // glow mesafesi (metre)
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 18;
    const DEFAULT_ZOOM = 13;

    // ---------- DOM ----------
    const splash = document.getElementById("splash");
    const btnPlay = document.getElementById("btn-play");
    const game = document.getElementById("game");
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
        updateScore();
        startDistanceTracker();
        // Hint after a moment
        setTimeout(() => showToast("💡", "Karakteri sürükleyerek anıları keşfet!"), 800);
    }

    // ---------- Particles ----------
    function setupParticles() {
        const canvas = document.getElementById("particles-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let particles = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
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
                this.y += this.vy;
                this.x += this.vx;
                this.opacity -= 0.001;
                if (this.y < -10 || this.opacity <= 0) { this.reset(); this.y = canvas.height + 10; }
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = `hsl(${this.hue}, 80%, 80%)`;
                ctx.beginPath();
                const s = this.size;
                ctx.moveTo(this.x, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x, this.y, this.x - s, this.y, this.x - s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x - s, this.y + s * 0.8, this.x, this.y + s * 1.2, this.x, this.y + s * 1.5);
                ctx.bezierCurveTo(this.x, this.y + s * 1.2, this.x + s, this.y + s * 0.8, this.x + s, this.y + s * 0.3);
                ctx.bezierCurveTo(this.x + s, this.y, this.x, this.y, this.x, this.y + s * 0.3);
                ctx.fill();
                ctx.restore();
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
        const paddedBounds = pointBounds.pad(0.25);
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

            const marker = L.marker([ani.lat, ani.lng], {
                icon: icon,
                interactive: false,
            }).addTo(map);

            const popupHtml = `<div class="popup-content">
        <h3>${ani.baslik}</h3>
        ${ani.tarih ? `<div class="popup-date">📅 ${ani.tarih}</div>` : ""}
      </div>`;

            marker.bindPopup(popupHtml, { closeButton: true, maxWidth: 200, autoPan: false });

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

        characterMarker.on("dragstart", () => {
            map.dragging.disable();
            map.closePopup();
            const el = characterMarker.getElement();
            if (el) el.classList.add("dragging");
        });

        characterMarker.on("drag", e => {
            let ll = e.target.getLatLng();
            if (mapBounds && !mapBounds.contains(ll)) {
                const lat2 = Math.max(mapBounds.getSouth(), Math.min(mapBounds.getNorth(), ll.lat));
                const lng2 = Math.max(mapBounds.getWest(), Math.min(mapBounds.getEast(), ll.lng));
                e.target.setLatLng([lat2, lng2]);
                ll = e.target.getLatLng();
            }
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

                // Reveal marker
                const emoji = ani.surpriz ? "✨" : ["📍", "🌅", "🎨", "🎭", "🏰", "💫"][ani.id % 6];
                marker.setIcon(L.divIcon({
                    className: "memory-marker discovered",
                    html: `<span class="marker-inner">${emoji}</span>`,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19],
                }));

                marker.openPopup();

                // Effects
                flashScreen();
                updateScore();

                if (ani.surpriz) {
                    showToast("✨", "Sürpriz noktasını buldun!");
                    showSurpriseButton();
                } else {
                    showToast("💕", `"${ani.baslik}" keşfedildi!`);
                    showSheet(ani);
                }

                // All found?
                if (discoveredCount === anilar.length) {
                    setTimeout(() => launchConfetti(), 500);
                }
            }
        });
    }

    // ---------- Nearby Glow ----------
    function updateNearbyGlow(charLL) {
        let closest = null;
        let closestDist = Infinity;

        memoryMarkers.forEach(marker => {
            const ani = marker._aniData;
            if (triggeredMemories.has(ani.id)) return;
            const d = charLL.distanceTo(marker.getLatLng());
            if (d < closestDist) { closestDist = d; closest = marker; }

            const el = marker.getElement();
            if (!el) return;
            if (d < NEARBY_THRESHOLD && !triggeredMemories.has(ani.id)) {
                el.classList.add("nearby");
            } else {
                el.classList.remove("nearby");
            }
        });

        // Update distance badge
        if (closest && closestDist < 50000) {
            const meters = Math.round(closestDist);
            if (meters >= 1000) {
                distanceText.textContent = `En yakın: ${(meters / 1000).toFixed(1)} km`;
            } else {
                distanceText.textContent = `En yakın: ${meters} m`;
            }

            // Arrow direction
            const cLL = charLL;
            const mLL = closest.getLatLng();
            const angle = Math.atan2(mLL.lng - cLL.lng, mLL.lat - cLL.lat) * (180 / Math.PI);
            distanceArrow.style.transform = `rotate(${-angle + 180}deg)`;

            distanceBadge.style.opacity = "1";
        } else {
            distanceBadge.style.opacity = "0";
        }
    }

    // ---------- Distance Tracker ----------
    function startDistanceTracker() {
        distanceInterval = setInterval(() => {
            if (!characterMarker) return;
            updateNearbyGlow(characterMarker.getLatLng());
        }, 1000);
    }

    // ---------- Score ----------
    function updateScore() {
        const total = anilar.length;
        scoreText.textContent = `${discoveredCount} / ${total}`;
        const pct = Math.round((discoveredCount / total) * 100);
        progressFill.style.width = pct + "%";
    }

    // ---------- Toast ----------
    let toastTimer;
    function showToast(emoji, text) {
        const te = document.getElementById("toast");
        const tEmoji = te.querySelector(".toast-emoji");
        tEmoji.textContent = emoji;
        toastText.textContent = text;
        te.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => te.classList.remove("show"), 2500);
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
        else { dateEl.style.display = "none"; }

        if (ani.foto) {
            fotoEl.src = `assets/${ani.foto}`; fotoEl.alt = ani.baslik;
            fotoEl.style.display = "block"; placeholderEl.style.display = "none";
        } else {
            fotoEl.style.display = "none"; placeholderEl.style.display = "flex";
            const emojis = ["💕", "🌸", "🌅", "💫", "🎀", "🦋"];
            placeholderEl.textContent = emojis[ani.id % emojis.length];
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
        let closest = null;
        let closestDist = Infinity;
        memoryMarkers.forEach(m => {
            const id = m._aniData.id;
            if (triggeredMemories.has(id)) return;
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
        const shapes = ["heart", "circle", "rect"];

        for (let i = 0; i < 80; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height * 0.5,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                vy: Math.random() * 3 + 2,
                vx: (Math.random() - 0.5) * 2,
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 6,
                opacity: 1,
            });
        }

        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            pieces.forEach(p => {
                if (p.opacity <= 0) return;
                alive++;
                p.y += p.vy;
                p.x += p.vx;
                p.rot += p.vr;
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
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
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

        modalOverlay.addEventListener("click", e => {
            if (e.target === modalOverlay) closeSurpriseModal();
        });

        btnCompass.addEventListener("click", flyToNearest);

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                closeSurpriseModal();
                hideSheet();
            }
        });

        map.on("click", hideSheet);
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
