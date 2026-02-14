// ==========================================
// 🎬 Finale Sequence — Cinematic zoom-out + globe
// ==========================================

const finaleSequence = (() => {
    let isPlaying = false;
    let typewriterTimer = null;
    let heartStreamTimer = null;
    let timers = [];

    function addTimer(cb, ms) {
        const id = setTimeout(cb, ms);
        timers.push(id);
        return id;
    }

    function clearTimers() {
        timers.forEach(clearTimeout);
        timers = [];
        if (typewriterTimer) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
        }
    }

    function hideGameUI() {
        const hud = document.querySelector(".hud");
        const joystick = document.getElementById("joystick");
        const progressBar = document.querySelector(".game-progress");
        const distBadge = document.getElementById("distance-badge");
        const hintPill = document.getElementById("hint-pill");
        const settingsBtn = document.getElementById("settings-btn");
        const settingsPanel = document.getElementById("settings-panel");
        const fogCanvas = document.getElementById("fog-canvas");

        [hud, joystick, progressBar, distBadge, hintPill, settingsBtn].forEach((el) => {
            if (!el) return;
            el.style.transition = "opacity 0.8s ease";
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
        });

        if (settingsPanel) {
            settingsPanel.classList.remove("show");
            settingsPanel.style.opacity = "0";
            settingsPanel.style.pointerEvents = "none";
        }

        if (fogCanvas) {
            fogCanvas.style.transition = "opacity 1.4s ease";
            fogCanvas.style.opacity = "0";
        }
    }

    function disableMapInteraction(map) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        map.tap && map.tap.disable && map.tap.disable();
    }

    function ensureGlobe(skipIntro) {
        const globeCanvas = document.getElementById("globe-canvas");
        if (!globeCanvas) return;
        globeRenderer.init(globeCanvas);
        globeRenderer.start({ intro: !skipIntro });
        if (skipIntro && typeof globeRenderer.skipIntro === "function") {
            globeRenderer.skipIntro();
        }
    }

    function startMessageFlow(overlay) {
        const message = overlay.querySelector(".finale-message");
        if (!message) return;

        const lines = [
            "Seninle başlayan bu yolculuk, her gün daha da güzelleşiyor...",
            "Şehirler değişse de kalbim hep seninle aynı yerde atıyor...",
            "Birlikteyken dünya bize biraz daha yakın, biraz daha parlak... 💖",
        ];

        message.style.transition = "opacity 0.45s ease, transform 0.45s ease";
        message.innerHTML = lines[0];
        message.style.opacity = "1";
        message.style.transform = "translateY(0)";

        lines.slice(1).forEach((line, idx) => {
            addTimer(() => {
                message.style.opacity = "0";
                message.style.transform = "translateY(8px)";
                addTimer(() => {
                    message.innerHTML = line;
                    message.style.opacity = "1";
                    message.style.transform = "translateY(0)";
                }, 220);
            }, 1200 * (idx + 1));
        });
    }

    function revealCinematicText() {
        const overlay = document.getElementById("finale-overlay");
        if (!overlay) return;
        const text = overlay.querySelector(".finale-text");
        const btn = overlay.querySelector(".finale-btn");
        const skip = overlay.querySelector(".finale-skip");
        if (skip) skip.classList.add("show");
        addTimer(() => {
            if (text) text.classList.add("show");
            startMessageFlow(overlay);
        }, 4200);
        addTimer(() => btn && btn.classList.add("show"), 5700);
    }

    function trigger(map) {
        if (isPlaying) return;
        isPlaying = true;
        clearTimers();

        map.setMaxBounds(null);
        map.setMinZoom(1);

        hideGameUI();
        disableMapInteraction(map);

        const overlay = document.getElementById("finale-overlay");
        if (overlay) {
            overlay.classList.add("show");
            overlay.classList.remove("note-open");
        }

        ensureGlobe(false);

        const center = map.getCenter();
        map.flyTo(center, 9, { duration: 1.4, easeLinearity: 0.25 });
        addTimer(() => {
            map.flyTo(center, 5, { duration: 2.4, easeLinearity: 0.2 });
        }, 1200);
        addTimer(() => {
            map.flyTo([18, 0], 2, { duration: 3.8, easeLinearity: 0.12 });
        }, 3400);

        revealCinematicText();
    }

    function skip() {
        isPlaying = true;
        clearTimers();

        const overlay = document.getElementById("finale-overlay");
        if (!overlay) return;
        overlay.classList.add("show");
        overlay.classList.remove("note-open");

        ensureGlobe(true);

        const text = overlay.querySelector(".finale-text");
        const btn = overlay.querySelector(".finale-btn");
        const skipBtn = overlay.querySelector(".finale-skip");
        if (text) text.classList.add("show");
        startMessageFlow(overlay);
        if (btn) btn.classList.add("show");
        if (skipBtn) skipBtn.style.display = "none";
    }

    function spawnOneHeart() {
        const container = document.getElementById("finale-overlay");
        if (!container) return;
        const hearts = ["💖", "💕", "💗", "💝", "❤️", "🩷"];
        const el = document.createElement("div");
        el.className = "finale-heart-particle";
        el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        el.style.left = `${Math.random() * 110 - 5}%`;
        el.style.animationDuration = `${3.6 + Math.random() * 3.2}s`;
        el.style.fontSize = `${0.78 + Math.random() * 1.1}rem`;
        el.style.opacity = `${0.48 + Math.random() * 0.45}`;
        container.appendChild(el);
        setTimeout(() => el.remove(), 8000);
    }

    function startHeartStream() {
        if (heartStreamTimer) return;
        for (let i = 0; i < 16; i++) addTimer(spawnOneHeart, i * 120);
        heartStreamTimer = setInterval(spawnOneHeart, 260);
    }

    function revealNote() {
        const overlay = document.getElementById("finale-overlay");
        const noteArea = document.getElementById("finale-note-area");
        const noteText = document.getElementById("finale-note-text");
        const btn = document.querySelector(".finale-btn");
        if (overlay) overlay.classList.add("note-open");
        if (noteArea) noteArea.classList.add("show");
        if (btn) {
            btn.classList.remove("show");
            setTimeout(() => { btn.style.display = "none"; }, 250);
        }

        if (typewriterTimer) {
            clearInterval(typewriterTimer);
            typewriterTimer = null;
        }
        if (noteText && typeof finalMesaj !== "undefined") {
            noteText.textContent = "";
            let i = 0;
            typewriterTimer = setInterval(() => {
                if (i < finalMesaj.length) {
                    noteText.textContent += finalMesaj[i];
                    i++;
                } else {
                    clearInterval(typewriterTimer);
                    typewriterTimer = null;
                }
            }, 28);
        }

        startHeartStream();
    }

    return { trigger, skip, revealNote };
})();
