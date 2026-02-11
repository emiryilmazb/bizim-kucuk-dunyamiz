// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Ana Uygulama Mantığı — Oyun Modu
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
    const PROXIMITY_THRESHOLD = 500; // metre

    // ---------- Zoom Sınırları ----------
    const MIN_ZOOM = 12;
    const MAX_ZOOM = 18;
    const DEFAULT_ZOOM = 13;


    // ---------- DOM Elements ----------
    const ctaBtn = document.getElementById("cta-btn");
    const mapSection = document.getElementById("map-section");
    const aniKarti = document.getElementById("ani-karti");
    const aniKartiClose = document.getElementById("ani-karti-close");
    const surprizContainer = document.getElementById("surpriz-btn-container");
    const surprizBtn = document.getElementById("surpriz-btn");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalMesaj = document.getElementById("modal-mesaj");
    const modalKapat = document.getElementById("modal-kapat");
    const modalTekrar = document.getElementById("modal-tekrar");
    const progressBar = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");

    // ---------- Init ----------
    function init() {
        setupHero();
        setupParticles();
        setupMap();
        setupEventListeners();
        updateProgress();
    }

    // ---------- Hero Setup ----------
    function setupHero() {
        const subtitleEl = document.getElementById("hero-subtitle");
        if (subtitleEl) {
            subtitleEl.innerHTML = `<strong>${config.seninAd}</strong> için hazırladığım küçük bir sürpriz...`;
        }
    }

    // ---------- CTA Scroll ----------
    function scrollToMap() {
        mapSection.scrollIntoView({ behavior: "smooth" });
    }

    // ---------- Particles ----------
    function setupParticles() {
        const canvas = document.getElementById("particles-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let particles = [];
        const PARTICLE_COUNT = 25;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 4 + 1;
                this.speedY = -(Math.random() * 0.5 + 0.1);
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.hue = Math.random() > 0.5 ? 0 : 30;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.opacity -= 0.001;
                if (this.y < -10 || this.opacity <= 0) {
                    this.reset();
                    this.y = canvas.height + 10;
                }
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

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();
    }


    // ---------- Map Setup ----------
    function setupMap() {
        // Sınırları anı noktalarından hesapla + padding
        const pointBounds = L.latLngBounds(anilar.map((a) => [a.lat, a.lng]));
        const paddedBounds = pointBounds.pad(0.25);
        mapBounds = paddedBounds; // modül seviyesinde sakla

        map = L.map("map", {
            center: pointBounds.getCenter(),
            zoom: DEFAULT_ZOOM,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            maxBounds: paddedBounds,
            maxBoundsViscosity: 1.0,
            bounceAtZoomLimits: true,
            zoomControl: false,
            attributionControl: false,
        });

        // Sert sınır — harita kaydırılamaz
        map.on("drag", function () {
            map.panInsideBounds(paddedBounds, { animate: false });
        });

        // Zoom kontrolünü sağ alta koy
        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap",
            maxZoom: MAX_ZOOM,
            bounds: paddedBounds,
        }).addTo(map);

        // Haritayı noktaları gösterecek şekilde sığdır
        map.fitBounds(pointBounds.pad(0.15));

        addMemoryMarkers();

        // Karakter haritanın merkezinde başlar
        const startLat = (anilar[0].lat + anilar[1].lat) / 2;
        const startLng = (anilar[0].lng + anilar[1].lng) / 2;
        addCharacterMarker(startLat, startLng);
    }


    // ---------- Memory Markers ----------
    function addMemoryMarkers() {
        anilar.forEach((ani) => {
            const icon = L.divIcon({
                className: "memory-marker undiscovered",
                html: ani.surpriz ? '<span class="marker-inner">❓</span>' : '<span class="marker-inner">❓</span>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            });

            const marker = L.marker([ani.lat, ani.lng], {
                icon: icon,
                interactive: false,  // Tıklama devre dışı — sadece yaklaşınca açılır
            }).addTo(map);

            // Popup — sadece proximity ile açılacak
            const popupHtml = `<div class="popup-content">
        <h3>${ani.baslik}</h3>
        ${ani.tarih ? `<div class="popup-date">📅 ${ani.tarih}</div>` : ""}
      </div>`;

            marker.bindPopup(popupHtml, {
                closeButton: true,
                maxWidth: 220,
                autoPan: false,
            });

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
            if (el) {
                el.classList.add("dragging");
            }
        });

        characterMarker.on("drag", (e) => {
            // Karakteri harita sınırları içinde tut
            let latlng = e.target.getLatLng();
            if (mapBounds && !mapBounds.contains(latlng)) {
                const clampedLat = Math.max(mapBounds.getSouth(), Math.min(mapBounds.getNorth(), latlng.lat));
                const clampedLng = Math.max(mapBounds.getWest(), Math.min(mapBounds.getEast(), latlng.lng));
                e.target.setLatLng([clampedLat, clampedLng]);
                latlng = e.target.getLatLng();
            }
            checkProximity(latlng);
        });

        characterMarker.on("dragend", (e) => {
            map.dragging.enable();
            const el = characterMarker.getElement();
            if (el) {
                el.classList.remove("dragging");
            }
            checkProximity(e.target.getLatLng());
        });
    }

    // ---------- Proximity Check ----------
    function checkProximity(charLatLng) {
        memoryMarkers.forEach((marker) => {
            const ani = marker._aniData;
            const distance = charLatLng.distanceTo(marker.getLatLng());

            if (distance < PROXIMITY_THRESHOLD && !triggeredMemories.has(ani.id)) {
                triggeredMemories.add(ani.id);
                discoveredCount++;

                // Marker ikonunu güncelle — keşfedildi!
                const revealEmoji = ani.surpriz ? "✨" : ["📍", "🌅", "🎨", "🎭", "🏰", "💫"][ani.id % 6];
                marker.setIcon(
                    L.divIcon({
                        className: "memory-marker discovered",
                        html: `<span class="marker-inner">${revealEmoji}</span>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                    })
                );

                // Popup aç
                marker.openPopup();

                // Kartı veya sürprizi göster
                if (ani.surpriz) {
                    showSurpriseButton();
                } else {
                    showAniKarti(ani);
                }

                updateProgress();

                // Keşif efekti
                showDiscoveryFlash();
            }
        });
    }

    // ---------- Discovery Flash ----------
    function showDiscoveryFlash() {
        const flash = document.getElementById("discovery-flash");
        if (!flash) return;
        flash.classList.add("show");
        setTimeout(() => flash.classList.remove("show"), 600);
    }

    // ---------- Progress ----------
    function updateProgress() {
        const total = anilar.length;
        const pct = Math.round((discoveredCount / total) * 100);
        if (progressBar) progressBar.style.width = pct + "%";
        if (progressText) progressText.textContent = `${discoveredCount} / ${total} anı keşfedildi`;
    }

    // ---------- Anı Kartı ----------
    function showAniKarti(ani) {
        const titleEl = document.getElementById("ak-baslik");
        const dateEl = document.getElementById("ak-tarih");
        const fotoEl = document.getElementById("ak-foto");
        const placeholderEl = document.getElementById("ak-placeholder");
        const metinEl = document.getElementById("ak-metin");

        titleEl.textContent = ani.baslik;

        if (ani.tarih) {
            dateEl.innerHTML = `📅 ${ani.tarih}`;
            dateEl.style.display = "flex";
        } else {
            dateEl.style.display = "none";
        }

        if (ani.foto) {
            fotoEl.src = `assets/${ani.foto}`;
            fotoEl.alt = ani.baslik;
            fotoEl.style.display = "block";
            placeholderEl.style.display = "none";
        } else {
            fotoEl.style.display = "none";
            placeholderEl.style.display = "flex";
            const emojis = ["💕", "🌸", "🌅", "💫", "🎀", "🦋"];
            placeholderEl.textContent = emojis[ani.id % emojis.length];
        }

        metinEl.textContent = ani.metin;
        aniKarti.classList.add("show");
    }

    function hideAniKarti() {
        aniKarti.classList.remove("show");
    }

    // ---------- Surprise ----------
    function showSurpriseButton() {
        if (surpriseShown) return;
        surprizContainer.classList.add("show");
    }

    function openSurpriseModal() {
        surpriseShown = true;
        surprizContainer.classList.remove("show");
        hideAniKarti();
        modalOverlay.classList.add("show");
        document.body.style.overflow = "hidden";
        typewriterEffect(finalMesaj);
    }

    function closeSurpriseModal() {
        modalOverlay.classList.remove("show");
        document.body.style.overflow = "";
    }

    // ---------- Typewriter Effect ----------
    let typewriterInterval;

    function typewriterEffect(text) {
        modalMesaj.innerHTML = '<span class="cursor"></span>';
        let i = 0;
        if (typewriterInterval) clearInterval(typewriterInterval);

        typewriterInterval = setInterval(() => {
            if (i < text.length) {
                const cursor = modalMesaj.querySelector(".cursor");
                if (cursor) cursor.insertAdjacentText("beforebegin", text[i]);
                i++;
            } else {
                clearInterval(typewriterInterval);
                setTimeout(() => {
                    const cursor = modalMesaj.querySelector(".cursor");
                    if (cursor) cursor.remove();
                }, 2000);
            }
        }, 40);
    }

    function replayTypewriter() {
        typewriterEffect(finalMesaj);
    }

    // ---------- Event Listeners ----------
    function setupEventListeners() {
        ctaBtn.addEventListener("click", scrollToMap);
        aniKartiClose.addEventListener("click", hideAniKarti);
        surprizBtn.addEventListener("click", openSurpriseModal);
        modalKapat.addEventListener("click", closeSurpriseModal);
        modalTekrar.addEventListener("click", replayTypewriter);

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeSurpriseModal();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeSurpriseModal();
                hideAniKarti();
            }
        });

        // Harita dışına tıklayınca anı kartını kapat
        map.on("click", () => {
            hideAniKarti();
        });
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
