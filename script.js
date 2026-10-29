// script.js

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Dark Mode Toggle
     */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

    // Check for saved user preference, if any, on load of the website
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeIcon && currentTheme === 'dark') {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    } else {
        // default to light, or user's system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) {
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
            localStorage.setItem('theme', 'dark');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            if (nextTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                if (themeIcon) themeIcon.classList.replace('fa-sun', 'fa-moon');
            }
            window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: nextTheme } }));
        });
    }

    /**
     * Mobile Menu Toggle
     */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        const menuIcon = mobileMenuBtn.querySelector('i');

        mobileMenuBtn.addEventListener('click', () => {
            const isActive = mobileMenu.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            if (menuIcon) {
                if (isActive) {
                    menuIcon.classList.replace('fa-bars', 'fa-xmark');
                } else {
                    menuIcon.classList.replace('fa-xmark', 'fa-bars');
                }
            }
        });

        // Close mobile menu on link click
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                if (menuIcon) {
                    menuIcon.classList.replace('fa-xmark', 'fa-bars');
                }
            });
        });
    }

    /**
     * Navbar scroll effect
     */
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    /**
     * Intersection Observer for scroll animations (Reveal effect)
     */
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        if ('IntersectionObserver' in window) {
            const revealOptions = {
                threshold: 0.15,
                rootMargin: "0px 0px -50px 0px"
            };

            const revealOnScroll = new IntersectionObserver(function (entries, observer) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, revealOptions);

            reveals.forEach(reveal => {
                revealOnScroll.observe(reveal);
            });
        } else {
            reveals.forEach(reveal => reveal.classList.add('active'));
        }
    }

    /**
     * GitHub & Platform Stats
     */
    const REPO_OWNER = 'samyak2403';
    const REPO_NAME = 'RepoStore';

    const starsEl = document.getElementById('stars-count');
    const forksEl = document.getElementById('forks-count');
    const downloadsEl = document.getElementById('downloads-count');
    const qrContainer = document.getElementById('apk-qrcode');
    const track = document.getElementById('contributors-track');

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

    // Resolve path to data directory properly regardless of current directory
    function resolveDataPath(filename) {
        const inSubdir = window.location.pathname.includes('/privacy-policy/');
        return (inSubdir ? '../data/' : 'data/') + filename;
    }

    // Load a downloads count from a local stats file, falling back to a built-in value
    function loadLocalDownloads(url, fallback) {
        return fetch(url, { cache: 'no-cache' })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
            .then(data => {
                const n = Number(data && data.downloads);
                return Number.isFinite(n) ? n : fallback;
            })
            .catch(() => fallback);
    }

    // Fetch repo info (stars + forks) ONLY if elements exist on page
    if (starsEl || forksEl) {
        fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (starsEl && typeof data.stargazers_count === 'number') {
                    animateCount(starsEl, data.stargazers_count);
                }
                if (forksEl && typeof data.forks_count === 'number') {
                    animateCount(forksEl, data.forks_count);
                }
            })
            .catch(() => {
                if (starsEl && (starsEl.textContent === '—' || starsEl.textContent === '')) starsEl.textContent = '1.3K+';
                if (forksEl && (forksEl.textContent === '—' || forksEl.textContent === '')) forksEl.textContent = '80+';
            });
    }

    // Up-to-date fallback download counts
    const FDROID_FALLBACK_COUNT = 90329;
    const IZZY_FALLBACK_COUNT = 54790;
    const GITHUB_FALLBACK_COUNT = 37257;

    // Fetch GitHub release downloads (and latest APK url for QR code)
    function getGithubDownloads() {
        return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(releases => {
                if (!Array.isArray(releases)) return GITHUB_FALLBACK_COUNT;

                let githubDownloads = 0;
                let latestApkUrl = null;

                releases.forEach((release, index) => {
                    if (Array.isArray(release.assets)) {
                        release.assets.forEach(asset => {
                            githubDownloads += (asset.download_count || 0);
                            if (index === 0 && asset.name && asset.name.endsWith('.apk') && !latestApkUrl) {
                                latestApkUrl = asset.browser_download_url;
                            }
                        });
                    }
                });

                if (latestApkUrl && qrContainer && typeof QRCode !== 'undefined') {
                    qrContainer.innerHTML = '';
                    new QRCode(qrContainer, {
                        text: latestApkUrl,
                        width: 128,
                        height: 128,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.L
                    });
                }

                return githubDownloads > 0 ? githubDownloads : GITHUB_FALLBACK_COUNT;
            })
            .catch(() => GITHUB_FALLBACK_COUNT);
    }

    // Combined total = GitHub + F-Droid + IzzyOnDroid downloads (only if downloadsEl is present)
    if (downloadsEl || qrContainer) {
        Promise.all([
            getGithubDownloads(),
            loadLocalDownloads(resolveDataPath('fdroid-stats.json'), FDROID_FALLBACK_COUNT),
            loadLocalDownloads(resolveDataPath('izzy-stats.json'), IZZY_FALLBACK_COUNT)
        ]).then(([github, fdroid, izzy]) => {
            if (downloadsEl) animateCount(downloadsEl, github + fdroid + izzy);
        });
    }

    // Click animation for feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.add('clicked');
            setTimeout(() => {
                card.classList.remove('clicked');
            }, 400);
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
        card.href = contributor.html_url || `https://github.com/${encodeURIComponent(contributor.login || '')}`;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('aria-label', `View ${contributor.login || 'contributor'}'s GitHub profile`);

        const gradient = ringGradients[index % ringGradients.length];

        const avatarWrapper = document.createElement('div');
        avatarWrapper.className = 'contributor-avatar-wrapper';
        avatarWrapper.style.background = gradient;

        const avatarImg = document.createElement('img');
        avatarImg.className = 'contributor-avatar';
        const sep = (contributor.avatar_url || '').includes('?') ? '&' : '?';
        avatarImg.src = contributor.avatar_url ? `${contributor.avatar_url}${sep}s=150` : 'images/icon.png';
        avatarImg.alt = contributor.login || 'Contributor';
        avatarImg.loading = 'lazy';
        avatarWrapper.appendChild(avatarImg);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'contributor-name';
        nameSpan.textContent = contributor.login || 'Contributor';

        card.appendChild(avatarWrapper);
        card.appendChild(nameSpan);

        return card;
    }

    function populateMarquee(contributors) {
        if (!track || !Array.isArray(contributors) || contributors.length === 0) return;
        track.innerHTML = '';
        contributors.forEach((c, i) => track.appendChild(buildContributorCard(c, i)));
        contributors.forEach((c, i) => track.appendChild(buildContributorCard(c, i)));
    }

    // Only fetch contributors if marquee track element exists
    if (track) {
        fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=100`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(contributors => {
                if (Array.isArray(contributors) && contributors.length > 0) {
                    const realContributors = contributors.filter(c => c.type === 'User');
                    populateMarquee(realContributors);
                }
            })
            .catch(err => {
                console.warn('Could not fetch contributors:', err);
            });
    }
});

