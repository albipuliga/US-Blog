// -------- Animated Stat Counters on Home --------
(function () {
    const counters = document.querySelectorAll(".stat-number[data-target]");
    if (!counters.length) return;

    let started = false;

    function animateCounters() {
        if (started) return;
        started = true;

        counters.forEach(counter => {
            const target = +counter.getAttribute("data-target");
            const duration = 1200;
            const startTime = performance.now();

            function update(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.floor(progress * target);
                counter.textContent = value.toLocaleString();
                if (progress < 1) requestAnimationFrame(update);
            }

            requestAnimationFrame(update);
        });
    }

    // Start when section is in view
    const statsSection = document.getElementById("stats");
    if (!statsSection) {
        animateCounters();
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
})();

// -------- Gallery Filter & Search --------
(function () {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll(".gallery-item"));
    const filterButtons = document.querySelectorAll(".filter-btn");
    const searchInput = document.getElementById("searchInput");

    function applyFilters() {
        const activeFilterBtn = document.querySelector(".filter-btn.active");
        const category = activeFilterBtn ? activeFilterBtn.dataset.filter : "all";
        const query = searchInput.value.trim().toLowerCase();

        items.forEach(item => {
            const itemCat = item.dataset.category;
            const title = (item.dataset.title || "").toLowerCase();

            const matchesCategory =
                category === "all" || itemCat === category;
            const matchesQuery = !query || title.includes(query);

            if (matchesCategory && matchesQuery) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        });
    }

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            applyFilters();
        });
    });

    searchInput.addEventListener("input", applyFilters);
})();

// -------- Lightbox for Gallery --------
(function () {
    const grid = document.getElementById("galleryGrid");
    const lightbox = document.getElementById("lightbox");
    if (!grid || !lightbox) return;

    const items = Array.from(grid.querySelectorAll(".gallery-item"));
    const imgEl = document.getElementById("lightboxImage");
    const titleEl = document.getElementById("lightboxTitle");
    const metaEl = document.getElementById("lightboxMeta");
    const btnClose = document.getElementById("lightboxClose");
    const btnPrev = document.getElementById("lightboxPrev");
    const btnNext = document.getElementById("lightboxNext");
    const backdrop = document.getElementById("lightboxBackdrop");

    let currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        const item = items[currentIndex];

        const img = item.querySelector("img");
        const meta = item.querySelector(".gallery-meta");
        const title = item.querySelector(".gallery-title");

        imgEl.src = img.src;
        imgEl.alt = img.alt;
        titleEl.textContent = title ? title.textContent : "";
        metaEl.textContent = meta ? meta.textContent : "";

        lightbox.classList.add("show");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("show");
        document.body.style.overflow = "";
    }

    function showNext(delta) {
        const visibleItems = items.filter(i => i.style.display !== "none");
        if (!visibleItems.length) return;

        const currentItem = items[currentIndex];
        const currentVisibleIndex = visibleItems.indexOf(currentItem);
        let nextVisibleIndex = currentVisibleIndex + delta;

        if (nextVisibleIndex < 0) nextVisibleIndex = visibleItems.length - 1;
        if (nextVisibleIndex >= visibleItems.length) nextVisibleIndex = 0;

        const nextItem = visibleItems[nextVisibleIndex];
        currentIndex = items.indexOf(nextItem);
        openLightbox(currentIndex);
    }

    items.forEach((item, index) => {
        item.addEventListener("click", () => openLightbox(index));
    });

    btnClose.addEventListener("click", closeLightbox);
    backdrop.addEventListener("click", closeLightbox);

    if (btnPrev) btnPrev.addEventListener("click", () => showNext(-1));
    if (btnNext) btnNext.addEventListener("click", () => showNext(1));

    document.addEventListener("keydown", e => {
        if (!lightbox.classList.contains("show")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showNext(-1);
        if (e.key === "ArrowRight") showNext(1);
    });
})();