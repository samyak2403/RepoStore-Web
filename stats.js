// stats.js

document.addEventListener('DOMContentLoaded', () => {
    const REPO_OWNER = 'samyak2403';
    const REPO_NAME = 'RepoStore';

    // Fallback counts, used when the local data/*.json files can't be loaded
    // (e.g. when the page is opened directly from disk via file://).
    const IZZY_FALLBACK_COUNT = 46552;
    const FDROID_FALLBACK_COUNT = 46135;

    // Platform brand-ish colors (per request: F-Droid green, IzzyOnDroid red).
    const COLORS = {
        github: '#8b5cf6',      // purple
        fdroid: '#3DDC84',      // green
        izzy: '#ef4444'         // red
    };

    function themeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            isDark,
            grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            text: isDark ? '#94a3b8' : '#64748b',
            tooltipBg: isDark ? '#1e293b' : '#ffffff',
            tooltipTitle: isDark ? '#f8fafc' : '#0f172a',
            tooltipBody: isDark ? '#cbd5e1' : '#475569',
            tooltipBorder: isDark ? '#334155' : '#e2e8f0'
        };
    }

    // Loads a downloads count from a local stats file and updates its card.
    // Resolves to the count (or the fallback if the file can't be read).
    function loadLocalCount(url, fallback, el) {
        if (el) el.textContent = fallback.toLocaleString();
        return fetch(url, { cache: 'no-cache' })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error('not ok'))))
            .then(data => {
                const n = Number(data.downloads);
                const count = Number.isFinite(n) ? n : fallback;
                if (el) el.textContent = count.toLocaleString();
                return count;
            })
            .catch(err => {
                console.warn('Using fallback count for ' + url + ':', err);
                return fallback;
            });
    }

    const izzyPromise = loadLocalCount(
        'data/izzy-stats.json', IZZY_FALLBACK_COUNT,
        document.getElementById('izzy-downloads-val')
    );
    const fdroidPromise = loadLocalCount(
        'data/fdroid-stats.json', FDROID_FALLBACK_COUNT,
        document.getElementById('fdroid-downloads-val')
    );

    // Fetch GitHub releases and resolve { labels, dataPoints, grandTotal }.
    function loadGithub() {
        return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100`)
            .then(res => {
                if (!res.ok) throw new Error('API rate limit or network error');
                return res.json();
            })
            .then(releases => {
                releases.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

                const labels = [];
                const dataPoints = [];
                let grandTotal = 0;

                releases.forEach(release => {
                    let releaseTotal = 0;
                    release.assets.forEach(asset => {
                        releaseTotal += asset.download_count;
                    });
                    grandTotal += releaseTotal;

                    const date = new Date(release.published_at);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    });
                    labels.push(`${release.name || release.tag_name} (${formattedDate})`);
                    dataPoints.push(releaseTotal);
                });

                const totalEl = document.getElementById('total-downloads-val');
                if (totalEl) totalEl.textContent = grandTotal.toLocaleString();

                return { labels, dataPoints, grandTotal };
            })
            .catch(err => {
                console.error('Error fetching release data:', err);
                return { labels: [], dataPoints: [], grandTotal: 0 };
            });
    }

    // Line chart: GitHub per-release data, plus flat reference lines for the
    // F-Droid (green) and IzzyOnDroid (red) totals across the same timeline.
    function renderReleaseChart(labels, dataPoints, fdroidTotal, izzyTotal) {
        const ctx = document.getElementById('downloadsChart');
        if (!ctx) return;
        const c = themeColors();
        // Ramp line: rises from 0 at the first point up to `value` at the last,
        // matching the growth style of the GitHub line.
        const rampLine = (label, value, color) => {
            const n = labels.length;
            return {
                label: label,
                data: labels.map((_, i) => (n > 1 ? Math.round(value * i / (n - 1)) : value)),
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: color,
                pointBorderColor: c.isDark ? '#1e293b' : '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 5
            };
        };
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'GitHub Downloads per Release',
                        data: dataPoints,
                        borderColor: COLORS.github,
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: COLORS.github,
                        pointBorderColor: c.isDark ? '#1e293b' : '#ffffff',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 3
                    },
                    rampLine('F-Droid Total', fdroidTotal, COLORS.fdroid),
                    rampLine('IzzyOnDroid Total', izzyTotal, COLORS.izzy)
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: c.text, font: { family: "'Inter', sans-serif", size: 14 } }
                    },
                    tooltip: {
                        backgroundColor: c.tooltipBg,
                        titleColor: c.tooltipTitle,
                        bodyColor: c.tooltipBody,
                        borderColor: c.tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                        bodyFont: { family: "'Inter', sans-serif", size: 13 },
                        callbacks: {
                            label: (context) => `Downloads: ${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: c.grid, drawBorder: false },
                        ticks: { color: c.text, font: { family: "'Inter', sans-serif" } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: c.text, font: { family: "'Inter', sans-serif" }, maxRotation: 45, minRotation: 45 }
                    }
                }
            }
        });
    }

    function renderPlatformChart(github, fdroid, izzy) {
        const ctx = document.getElementById('platformChart');
        if (!ctx) return;
        const c = themeColors();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['GitHub', 'F-Droid', 'IzzyOnDroid'],
                datasets: [{
                    label: 'Total Downloads by Platform',
                    data: [github, fdroid, izzy],
                    backgroundColor: [COLORS.github, COLORS.fdroid, COLORS.izzy],
                    borderRadius: 8,
                    maxBarThickness: 90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: c.text, font: { family: "'Inter', sans-serif", size: 14 } }
                    },
                    tooltip: {
                        backgroundColor: c.tooltipBg,
                        titleColor: c.tooltipTitle,
                        bodyColor: c.tooltipBody,
                        borderColor: c.tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                        bodyFont: { family: "'Inter', sans-serif", size: 13 },
                        callbacks: {
                            label: (context) => `Downloads: ${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: c.grid, drawBorder: false },
                        ticks: { color: c.text, font: { family: "'Inter', sans-serif" } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: c.text, font: { family: "'Inter', sans-serif", size: 13 } }
                    }
                }
            }
        });
    }

    // Once all totals are known, render both charts.
    Promise.all([loadGithub(), fdroidPromise, izzyPromise])
        .then(([gh, fdroid, izzy]) => {
            renderReleaseChart(gh.labels, gh.dataPoints, fdroid, izzy);
            renderPlatformChart(gh.grandTotal, fdroid, izzy);
        });

    // Re-render charts with new theme colors on toggle.
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            setTimeout(() => location.reload(), 50);
        });
    }
});
