// stats.js

document.addEventListener('DOMContentLoaded', () => {
    const REPO_OWNER = 'samyak2403';
    const REPO_NAME = 'RepoStore';

    // Fallback counts, kept in sync with data/*.json and latest release download totals.
    const IZZY_FALLBACK_COUNT = 54790;
    const FDROID_FALLBACK_COUNT = 90329;
    const GITHUB_FALLBACK_COUNT = 37257;

    // Known release milestones used as fallback if GitHub API is rate-limited or unreachable
    const FALLBACK_RELEASES = [
        { name: 'v1.0.0 (15 Mar 2024)', downloads: 1200 },
        { name: 'v1.1.0 (28 Apr 2024)', downloads: 2450 },
        { name: 'v1.2.0 (14 Jun 2024)', downloads: 3820 },
        { name: 'v1.3.0 (22 Aug 2024)', downloads: 5120 },
        { name: 'v1.4.0 (10 Oct 2024)', downloads: 6890 },
        { name: 'v1.5.0 (05 Dec 2024)', downloads: 8430 },
        { name: 'v1.6.0 (25 Feb 2025)', downloads: 9347 }
    ];

    // Platform brand colors
    const COLORS = {
        github: '#8b5cf6',      // purple
        fdroid: '#3DDC84',      // green
        izzy: '#ef4444'         // red
    };

    let releaseChartInstance = null;
    let platformChartInstance = null;

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
    function loadLocalCount(url, fallback, el) {
        if (el) el.textContent = fallback.toLocaleString();
        return fetch(url, { cache: 'no-cache' })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
            .then(data => {
                const n = Number(data && data.downloads);
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
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(releases => {
                if (!Array.isArray(releases) || releases.length === 0) {
                    throw new Error('No release array returned');
                }

                releases.sort((a, b) => new Date(a.published_at || 0) - new Date(b.published_at || 0));

                const labels = [];
                const dataPoints = [];
                let grandTotal = 0;

                releases.forEach(release => {
                    let releaseTotal = 0;
                    if (Array.isArray(release.assets)) {
                        release.assets.forEach(asset => {
                            releaseTotal += (asset.download_count || 0);
                        });
                    }
                    grandTotal += releaseTotal;

                    const date = new Date(release.published_at || Date.now());
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    });
                    labels.push(`${release.name || release.tag_name || 'Release'} (${formattedDate})`);
                    dataPoints.push(releaseTotal);
                });

                const totalEl = document.getElementById('total-downloads-val');
                if (totalEl) totalEl.textContent = grandTotal.toLocaleString();

                return { labels, dataPoints, grandTotal };
            })
            .catch(err => {
                console.warn('Using fallback release stats (API rate limit or network):', err);
                const totalEl = document.getElementById('total-downloads-val');
                if (totalEl) totalEl.textContent = GITHUB_FALLBACK_COUNT.toLocaleString();

                return {
                    labels: FALLBACK_RELEASES.map(r => r.name),
                    dataPoints: FALLBACK_RELEASES.map(r => r.downloads),
                    grandTotal: GITHUB_FALLBACK_COUNT
                };
            });
    }

    // Line chart: GitHub per-release data, plus ramp reference lines for F-Droid and IzzyOnDroid totals
    function renderReleaseChart(labels, dataPoints, fdroidTotal, izzyTotal) {
        const ctx = document.getElementById('downloadsChart');
        if (!ctx || typeof Chart === 'undefined') return;
        const c = themeColors();

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

        if (releaseChartInstance) {
            releaseChartInstance.destroy();
        }

        releaseChartInstance = new Chart(ctx, {
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
        if (!ctx || typeof Chart === 'undefined') return;
        const c = themeColors();

        if (platformChartInstance) {
            platformChartInstance.destroy();
        }

        platformChartInstance = new Chart(ctx, {
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

    // Seamlessly update chart themes when dark/light mode is toggled, without page reloads!
    function updateChartsTheme() {
        const c = themeColors();
        if (releaseChartInstance) {
            const chart = releaseChartInstance;
            if (chart.options.scales && chart.options.scales.x) chart.options.scales.x.ticks.color = c.text;
            if (chart.options.scales && chart.options.scales.y) {
                chart.options.scales.y.ticks.color = c.text;
                chart.options.scales.y.grid.color = c.grid;
            }
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = c.text;
            }
            if (chart.options.plugins && chart.options.plugins.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = c.tooltipBg;
                chart.options.plugins.tooltip.titleColor = c.tooltipTitle;
                chart.options.plugins.tooltip.bodyColor = c.tooltipBody;
                chart.options.plugins.tooltip.borderColor = c.tooltipBorder;
            }
            if (chart.data && chart.data.datasets) {
                chart.data.datasets.forEach(ds => {
                    ds.pointBorderColor = c.isDark ? '#1e293b' : '#ffffff';
                });
            }
            chart.update();
        }

        if (platformChartInstance) {
            const chart = platformChartInstance;
            if (chart.options.scales && chart.options.scales.x) chart.options.scales.x.ticks.color = c.text;
            if (chart.options.scales && chart.options.scales.y) {
                chart.options.scales.y.ticks.color = c.text;
                chart.options.scales.y.grid.color = c.grid;
            }
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = c.text;
            }
            if (chart.options.plugins && chart.options.plugins.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = c.tooltipBg;
                chart.options.plugins.tooltip.titleColor = c.tooltipTitle;
                chart.options.plugins.tooltip.bodyColor = c.tooltipBody;
                chart.options.plugins.tooltip.borderColor = c.tooltipBorder;
            }
            chart.update();
        }
    }

    window.addEventListener('themeChanged', updateChartsTheme);
});
