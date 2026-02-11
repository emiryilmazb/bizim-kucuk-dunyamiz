// ==========================================
// Bizim Küçük Dünyamız 🌍💛
// Ana Uygulama Mantığı
// ==========================================

(function () {
    "use strict";

    // ---------- State ----------
    let map;
    let characterMarker;
    let memoryMarkers = [];
    let triggeredMemories = new Set();
    let surpriseShown = false;
    const PROXIMITY_THRESHOLD = 150; // metre

    // ---------- DOM Elements ----------
    const heroSection = document.getElementById("hero");
    const mapSection = document.getElementById("map-section");
    const ctaBtn = document.getElementById("cta-btn");
    const aniKarti = document.getElementById("ani-karti");
    const aniKartiClose = document.getElementById("ani-karti-close");
    const surprizContainer = document.getElementById("surpriz-btn-container");
    const surprizBtn = document.getElementById("surpriz-btn");
    const modalOverlay = document.getElementById("modal-overlay");
    const modalMesaj = document.getElementById("modal-mesaj");
    const modalKapat = document.getElementById("modal-kapat");
    const modalTekrar = document.getElementById("modal-tekrar");

    // ---------- Init ----------
    function init() {
        setupHero();
        setupParticles();
        setupMap();
        setupEventListeners();
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
        const PARTICLE_COUNT = 30;

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
                this.hue = Math.random() > 0.5 ? 0 : 30; // pink or peach
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
                // Draw tiny heart
                const s = this.size;
                ctx.moveTo(this.x, this.y + s * 0.3);
                ctx.bezierCurveTo(
                    this.x,
                    this.y,
                    this.x - s,
                    this.y,
                    this.x - s,
                    this.y + s * 0.3
                );
                ctx.bezierCurveTo(
                    this.x - s,
                    this.y + s * 0.8,
                    this.x,
                    this.y + s * 1.2,
                    this.x,
                    this.y + s * 1.5
                );
                ctx.bezierCurveTo(
                    this.x,
                    this.y + s * 1.2,
                    this.x + s,
                    this.y + s * 0.8,
                    this.x + s,
                    this.y + s * 0.3
                );
                ctx.bezierCurveTo(
                    this.x + s,
                    this.y,
                    this.x,
                    this.y,
                    this.x,
                    this.y + s * 0.3
                );
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
        // Calculate center from memory points
        const avgLat =
            anilar.reduce((sum, a) => sum + a.lat, 0) / anilar.length;
        const avgLng =
            anilar.reduce((sum, a) => sum + a.lng, 0) / anilar.length;

        map = L.map("map", {
            center: [avgLat, avgLng],
            zoom: 7,
            zoomControl: true,
            attributionControl: true,
        });

        // Warm romantic tile style
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 18,
        }).addTo(map);

        // Add memory markers
        addMemoryMarkers();

        // Add draggable character
        addCharacterMarker(avgLat, avgLng);

        // Fit bounds to show all points
        const bounds = L.latLngBounds(anilar.map((a) => [a.lat, a.lng]));
        map.fitBounds(bounds.pad(0.3));
    }

    // ---------- Memory Markers ----------
    function addMemoryMarkers() {
        anilar.forEach((ani) => {
            const icon = L.divIcon({
                className: "memory-marker",
                html: ani.surpriz ? "✨" : "📍",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            });

            const marker = L.marker([ani.lat, ani.lng], {
                icon: icon,
                interactive: true,
            }).addTo(map);

            // Popup content
            let popupHtml = `<div class="popup-content">
        <h3>${ani.baslik}</h3>
        ${ani.tarih ? `<div class="popup-date">📅 ${ani.tarih}</div>` : ""}
      </div>`;

            marker.bindPopup(popupHtml, {
                closeButton: true,
                maxWidth: 250,
            });

            marker.on("click", () => {
                showAniKarti(ani);
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
            iconSize: [36, 36],
            iconAnchor: [18, 18],
        });

        characterMarker = L.marker([lat, lng], {
            icon: charIcon,
            draggable: true,
            autoPan: true,
            autoPanPadding: [50, 50],
        }).addTo(map);

        // Touch-friendly drag improvement
        characterMarker.on("dragstart", () => {
            map.dragging.disable();
            characterMarker.getElement().style.cursor = "grabbing";
        });

        characterMarker.on("drag", (e) => {
            checkProximity(e.target.getLatLng());
        });

        characterMarker.on("dragend", (e) => {
            map.dragging.enable();
            characterMarker.getElement().style.cursor = "grab";
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

                // Animate marker
                const el = marker.getElement();
                if (el) {
                    el.classList.add("active");
                    setTimeout(() => el.classList.remove("active"), 3000);
                }

                // Open popup
                marker.openPopup();

                // Show ani karti
                if (ani.surpriz) {
                    showSurpriseButton();
                } else {
                    showAniKarti(ani);
                }
            }
        });
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
                // Insert text before cursor
                const cursor = modalMesaj.querySelector(".cursor");
                if (cursor) {
                    cursor.insertAdjacentText("beforebegin", text[i]);
                }
                i++;
            } else {
                clearInterval(typewriterInterval);
                // Remove cursor after a delay
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

        // Close modal on overlay click
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeSurpriseModal();
        });

        // Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeSurpriseModal();
                hideAniKarti();
            }
        });
    }

    // ---------- Start ----------
    document.addEventListener("DOMContentLoaded", init);
})();
