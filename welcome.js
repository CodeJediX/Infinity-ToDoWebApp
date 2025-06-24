document.addEventListener('DOMContentLoaded', () => {
    // --- NEW: PRELOADER LOGIC ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Stay for a minimum time so the user can see it
        setTimeout(() => {
            preloader.classList.add('fade-out');
            // Remove from DOM after transition
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 2000); // 2 seconds
    }
    
    // --- PARTICLE.JS BACKGROUND ---
    // This check ensures it only runs on the welcome page
    if (document.getElementById('particles-js')) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#39FF14" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#39FF14", "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 2, "direction": "none", "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }

    // --- DAILY USER COUNTER ---
    const userCounterSpan = document.querySelector('#user-counter span');
    function updateUserCount() {
        if (!userCounterSpan) return;

        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
        let visitData;
        try {
            visitData = JSON.parse(localStorage.getItem('dailyVisitData'));
        } catch (e) {
            visitData = null;
        }

        let count;
        if (visitData && visitData.date === today) {
            // If we have data for today, use it
            count = visitData.count;
        } else {
            // No data for today, so generate a new count and store it
            // This simulates a real counter for a client-side only app.
            const baseCount = 150; // A base number to seem realistic
            const randomAddition = Math.floor(Math.random() * 200);
            count = baseCount + randomAddition;
            localStorage.setItem('dailyVisitData', JSON.stringify({ date: today, count: count }));
        }
        
        userCounterSpan.textContent = count;
    }

    updateUserCount();
});