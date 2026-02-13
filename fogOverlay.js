// ==========================================
// 🌫️ Fog of War Overlay — canvas-based
// ==========================================

const fogOverlay = (() => {
    let canvas = null;
    let ctx = null;
    let map = null;
    let avatarPos = null; // { x, y } in pixels
    let revealedCircles = []; // [{ lat, lng, radius }]
    let enabled = false;
    let animFrame = null;

    // Configuration
    const AVATAR_REVEAL_RADIUS = 90; // px
    const LOCATION_REVEAL_RADIUS = 70; // px
    const FOG_COLOR = "rgba(253, 240, 245, 0.72)"; // dreamy pastel pink
    const EDGE_FEATHER = 40; // px feather

    function init(leafletMap) {
        map = leafletMap;
        canvas = document.getElementById("fog-canvas");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        enabled = true;
        resize();
        window.addEventListener("resize", resize);
        map.on("move zoom viewreset", draw);
        draw();
    }

    function resize() {
        if (!canvas) return;
        const container = map.getContainer();
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        draw();
    }

    /** Update avatar position (call every frame during movement) */
    function updateAvatar(latlng) {
        avatarPos = latlng;
        draw();
    }

    /** Add a permanently revealed circle for a viewed location */
    function addRevealedLocation(lat, lng) {
        // Avoid duplicates
        if (revealedCircles.some((c) => c.lat === lat && c.lng === lng)) return;
        revealedCircles.push({ lat, lng, radius: LOCATION_REVEAL_RADIUS });
        draw();
    }

    /** Restore revealed locations from viewed IDs */
    function restoreFromViewed(allLocations) {
        allLocations.forEach((loc) => {
            if (progressStore.isViewed(loc.id)) {
                addRevealedLocation(loc.x, loc.y);
            }
        });
    }

    /** Main draw function */
    function draw() {
        if (!enabled || !ctx || !map) return;

        const w = canvas.width;
        const h = canvas.height;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw full fog
        ctx.fillStyle = FOG_COLOR;
        ctx.fillRect(0, 0, w, h);

        // Use composite to "cut out" reveal circles
        ctx.globalCompositeOperation = "destination-out";

        // Avatar reveal
        if (avatarPos) {
            const pt = map.latLngToContainerPoint(
                L.latLng(avatarPos.lat, avatarPos.lng)
            );
            drawFeatheredCircle(pt.x, pt.y, AVATAR_REVEAL_RADIUS);
        }

        // Viewed locations reveal
        revealedCircles.forEach((c) => {
            const pt = map.latLngToContainerPoint(L.latLng(c.lat, c.lng));
            drawFeatheredCircle(pt.x, pt.y, c.radius);
        });

        // Reset composite
        ctx.globalCompositeOperation = "source-over";
    }

    /** Draw a circle with feathered (gradient) edges */
    function drawFeatheredCircle(x, y, radius) {
        const totalR = radius + EDGE_FEATHER;
        const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, totalR);
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.9)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, totalR, 0, Math.PI * 2);
        ctx.fill();
    }

    /** Reset fog (clear all reveals) */
    function reset() {
        revealedCircles = [];
        avatarPos = null;
        draw();
    }

    /** Fade out fog completely (for finale) */
    function fadeOut() {
        if (!canvas) return;
        canvas.style.transition = "opacity 1.5s ease";
        canvas.style.opacity = "0";
    }

    return {
        init,
        updateAvatar,
        addRevealedLocation,
        restoreFromViewed,
        reset,
        fadeOut,
        draw,
    };
})();
