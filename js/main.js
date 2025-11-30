/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =====================================================
// MOBILE NAVIGATION
// =====================================================

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        mainNav.classList.toggle('is-open');

        // Trap focus within nav when open
        if (!isExpanded) {
            mainNav.querySelector('.nav-link').focus();
        }
    });

    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
            navToggle.setAttribute('aria-expanded', 'false');
            mainNav.classList.remove('is-open');
            navToggle.focus();
        }
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
        if (mainNav.classList.contains('is-open') &&
            !mainNav.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navToggle.setAttribute('aria-expanded', 'false');
            mainNav.classList.remove('is-open');
        }
    });

    // Close nav when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && mainNav.classList.contains('is-open')) {
            navToggle.setAttribute('aria-expanded', 'false');
            mainNav.classList.remove('is-open');
        }
    });
}

// =====================================================
// COUNTER ANIMATION
// =====================================================

const statCards = document.querySelectorAll('.stat-card');

function animateCounter(element, target, duration = 2000) {
    if (prefersReducedMotion()) {
        element.textContent = target + (target > 100 ? '+' : '');
        return;
    }

    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smoother animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);

        element.textContent = current + (target > 100 ? '+' : '');

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

// Observe stat cards for animation trigger
if (statCards.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const numberEl = card.querySelector('.stat-number');
                const target = parseInt(card.dataset.count, 10);

                if (numberEl && !card.classList.contains('animated')) {
                    card.classList.add('animated');
                    animateCounter(numberEl, target);
                }
            }
        });
    }, { threshold: 0.5 });

    statCards.forEach(card => statsObserver.observe(card));
}

// =====================================================
// GALLERY FILTERING
// =====================================================

const filterButtons = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('gallery-search');

function filterGallery(category = 'all', searchTerm = '') {
    let visibleCount = 0;

    galleryItems.forEach(item => {
        const itemCategory = item.dataset.category;
        const itemTitle = (item.dataset.title || '').toLowerCase();
        const matchesCategory = category === 'all' || itemCategory === category;
        const matchesSearch = searchTerm === '' || itemTitle.includes(searchTerm.toLowerCase());

        if (matchesCategory && matchesSearch) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'memory' : 'memories'}`;
    }
}

// Filter button clicks
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active states
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');

        // Apply filter
        const category = button.dataset.filter;
        const searchTerm = searchInput ? searchInput.value : '';
        filterGallery(category, searchTerm);
    });
});

// Search input
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const category = activeFilter ? activeFilter.dataset.filter : 'all';
        filterGallery(category, searchInput.value);
    });
}

// Check URL params for initial filter
if (filterButtons.length > 0) {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');

    if (filterParam) {
        const targetButton = document.querySelector(`[data-filter="${filterParam}"]`);
        if (targetButton) {
            targetButton.click();
        }
    }
}

// =====================================================
// LIGHTBOX
// =====================================================

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCaption = document.getElementById('lightbox-title');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');
const lightboxOverlay = document.querySelector('.lightbox-overlay');
const galleryButtons = document.querySelectorAll('.gallery-button');

let currentImageIndex = 0;
let galleryImages = [];

function openLightbox(index) {
    if (!lightbox) return;

    currentImageIndex = index;
    const imageData = galleryImages[index];

    lightboxImage.src = imageData.src;
    lightboxImage.alt = imageData.alt;
    lightboxCaption.textContent = imageData.title;

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus management
    lightboxClose.focus();

    // Announce to screen readers
    lightbox.setAttribute('aria-label', `Image ${index + 1} of ${galleryImages.length}: ${imageData.title}`);
}

function closeLightbox() {
    if (!lightbox) return;

    lightbox.hidden = true;
    document.body.style.overflow = '';

    // Return focus to the gallery item that opened the lightbox
    if (galleryButtons[currentImageIndex]) {
        galleryButtons[currentImageIndex].focus();
    }
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    openLightbox(currentImageIndex);
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentImageIndex);
}

// Build gallery images array
galleryButtons.forEach((button, index) => {
    const img = button.querySelector('img');
    const titleEl = button.querySelector('.gallery-title');

    if (img) {
        galleryImages.push({
            src: img.src,
            alt: img.alt,
            title: titleEl ? titleEl.textContent : ''
        });

        button.addEventListener('click', () => openLightbox(index));
    }
});

// Lightbox controls
if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
}

if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', closeLightbox);
}

if (lightboxPrev) {
    lightboxPrev.addEventListener('click', showPrevImage);
}

if (lightboxNext) {
    lightboxNext.addEventListener('click', showNextImage);
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.hidden) return;

    switch (e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPrevImage();
            break;
        case 'ArrowRight':
            showNextImage();
            break;
    }
});

// Trap focus within lightbox
if (lightbox) {
    lightbox.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        const focusableElements = lightbox.querySelectorAll('button:not([hidden])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    });
}

// =====================================================
// SCROLL ANIMATIONS
// =====================================================

const animatedElements = document.querySelectorAll('[data-animate]');

if (animatedElements.length > 0 && !prefersReducedMotion()) {
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => animationObserver.observe(el));
} else {
    // If reduced motion, just show everything
    animatedElements.forEach(el => el.classList.add('is-visible'));
}

// =====================================================
// TIMELINE PROGRESS BAR
// =====================================================

const progressBar = document.querySelector('.progress-bar');

if (progressBar) {
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;

        const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    });
}

// =====================================================
// RANDOM MEMORY BUTTON
// =====================================================

const randomMemoryBtn = document.getElementById('random-memory-btn');

if (randomMemoryBtn && galleryImages.length > 0) {
    randomMemoryBtn.addEventListener('click', () => {
        const randomIndex = Math.floor(Math.random() * galleryImages.length);
        openLightbox(randomIndex);
    });
} else if (randomMemoryBtn) {
    // If no gallery images on this page, redirect to gallery with random param
    randomMemoryBtn.addEventListener('click', () => {
        window.location.href = 'gallery.html?random=true';
    });
}

// Handle random param on gallery page
if (window.location.search.includes('random=true') && galleryImages.length > 0) {
    window.addEventListener('load', () => {
        const randomIndex = Math.floor(Math.random() * galleryImages.length);
        setTimeout(() => openLightbox(randomIndex), 500);
    });
}

// =====================================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// =====================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();

            // Account for fixed header
            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            if (prefersReducedMotion()) {
                window.scrollTo(0, targetPosition);
            } else {
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }

            // Update focus
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus({ preventScroll: true });
        }
    });
});
