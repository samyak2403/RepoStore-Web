// script.js

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Dark Mode Toggle
     */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check for saved user preference, if any, on load of the website
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    } else {
        // default to light, or user's system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    });

    /**
     * Mobile Menu Toggle
     */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = mobileMenuBtn.querySelector('i');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
            menuIcon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            menuIcon.classList.replace('fa-xmark', 'fa-bars');
        }
    });

    // Close mobile menu on link click
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            menuIcon.classList.replace('fa-xmark', 'fa-bars');
        });
    });

    /**
     * Navbar scroll effect
     */
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /**
     * Intersection Observer for scroll animations (Reveal effect)
     */
    const reveals = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    reveals.forEach(reveal => {
        revealOnScroll.observe(reveal);
    });

    /**
     * Fetch GitHub Stats (Stars, Downloads, Forks)
     */
    const REPO_OWNER = 'samyak2403';
    const REPO_NAME = 'RepoStore';

    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    function animateCount(element, target) {
        const duration = 1200;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            element.textContent = formatNumber(current);
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = formatNumber(target);
            }
        }
        requestAnimationFrame(update);
    }

    // Fetch repo info (stars + forks)
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`)
        .then(res => res.json())
        .then(data => {
            const starsEl = document.getElementById('stars-count');
            const forksEl = document.getElementById('forks-count');
            if (data.stargazers_count !== undefined) {
                animateCount(starsEl, data.stargazers_count);
            }
            if (data.forks_count !== undefined) {
                animateCount(forksEl, data.forks_count);
            }
        })
        .catch(() => {
            document.getElementById('stars-count').textContent = '300+';
            document.getElementById('forks-count').textContent = '—';
        });

    // Fetch total downloads from all releases
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`)
        .then(res => res.json())
        .then(releases => {
            let totalDownloads = 0;
            releases.forEach(release => {
                release.assets.forEach(asset => {
                    totalDownloads += asset.download_count;
                });
            });
            const downloadsEl = document.getElementById('downloads-count');
            animateCount(downloadsEl, totalDownloads);
        })
        .catch(() => {
            document.getElementById('downloads-count').textContent = '—';
        });
    // Click animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.add('clicked');
            setTimeout(() => {
                card.classList.remove('clicked');
            }, 400); // match animation duration
        });
    });
});
