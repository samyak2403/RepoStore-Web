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

    // Fetch total downloads from all releases and latest APK url for QR code
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`)
        .then(res => res.json())
        .then(releases => {
            let totalDownloads = 0;
            let latestApkUrl = null;

            releases.forEach((release, index) => {
                release.assets.forEach(asset => {
                    totalDownloads += asset.download_count;
                    if (index === 0 && asset.name.endsWith('.apk') && !latestApkUrl) {
                        latestApkUrl = asset.browser_download_url;
                    }
                });
            });
            const downloadsEl = document.getElementById('downloads-count');
            animateCount(downloadsEl, totalDownloads);

            if (latestApkUrl) {
                const qrContainer = document.getElementById('apk-qrcode');
                if (qrContainer) {
                    new QRCode(qrContainer, {
                        text: latestApkUrl,
                        width: 128,
                        height: 128,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.L
                    });
                }
            }
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

    const ringGradients = [
        'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        'linear-gradient(135deg, #ec4899, #8b5cf6)',
        'linear-gradient(135deg, #10b981, #3b82f6)',
        'linear-gradient(135deg, #f59e0b, #ef4444)',
        'linear-gradient(135deg, #06b6d4, #3b82f6)',
        'linear-gradient(135deg, #8b5cf6, #6366f1)',
        'linear-gradient(135deg, #f43f5e, #ec4899)',
        'linear-gradient(135deg, #14b8a6, #06b6d4)'
    ];

    function buildContributorCard(contributor, index) {
        const card = document.createElement('a');
        card.className = 'contributor-card';
        card.href = contributor.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('aria-label', `View ${contributor.login}'s GitHub profile`);

        const gradient = ringGradients[index % ringGradients.length];

        card.innerHTML = `
            <div class="contributor-avatar-wrapper" style="background: ${gradient};">
                <img class="contributor-avatar" src="${contributor.avatar_url}&s=150" alt="${contributor.login}" loading="lazy">
            </div>
            <span class="contributor-name">${contributor.login}</span>
        `;
        return card;
    }

    function populateMarquee(contributors) {
        const track = document.getElementById('contributors-track');
        if (!track || contributors.length === 0) return;

        track.innerHTML = '';
        contributors.forEach((c, i) => track.appendChild(buildContributorCard(c, i)));
        contributors.forEach((c, i) => track.appendChild(buildContributorCard(c, i)));
    }

    const fallbackContributors = [
        { login: 'samyak2403', avatar_url: 'https://avatars.githubusercontent.com/u/74384594?v=4', html_url: 'https://github.com/samyak2403' },
        { login: 'SubhrajyotiSen', avatar_url: 'https://avatars.githubusercontent.com/u/61483842?v=4', html_url: 'https://github.com/SubhrajyotiSen' },
        { login: 'Crazy-1004', avatar_url: 'https://avatars.githubusercontent.com/u/101292928?v=4', html_url: 'https://github.com/Crazy-1004' },
        { login: 'Samyak-Kamble', avatar_url: 'https://avatars.githubusercontent.com/u/103328108?v=4', html_url: 'https://github.com/Samyak-Kamble' },
        { login: 'Tushar-Kamble-1', avatar_url: 'https://avatars.githubusercontent.com/u/103328109?v=4', html_url: 'https://github.com/Tushar-Kamble-1' }
    ];

    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=100`)
        .then(res => {
            if (!res.ok) throw new Error('API rate limit or network error');
            return res.json();
        })
        .then(contributors => {
            if (Array.isArray(contributors) && contributors.length > 0) {
                const realContributors = contributors.filter(c => c.type === 'User');
                populateMarquee(realContributors);
            } else {
                populateMarquee(fallbackContributors);
            }
        })
        .catch(err => {
            console.warn('Could not fetch contributors, using fallback:', err);
            populateMarquee(fallbackContributors);
        });

});
