// stats.js

document.addEventListener('DOMContentLoaded', () => {
    const REPO_OWNER = 'samyak2403';
    const REPO_NAME = 'RepoStore';

    const ctx = document.getElementById('downloadsChart');
    if (!ctx) return;

    // We will fetch all releases to build the graph
    fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=100`)
        .then(res => {
            if (!res.ok) throw new Error('API rate limit or network error');
            return res.json();
        })
        .then(releases => {
            // Sort releases by publish date (oldest first)
            releases.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));

            const labels = [];
            const dataPoints = [];

            let grandTotal = 0;
            releases.forEach(release => {
                // Calculate total downloads for this release
                let releaseTotal = 0;
                release.assets.forEach(asset => {
                    releaseTotal += asset.download_count;
                });
                grandTotal += releaseTotal;

                // Format date as Day, Month, Year
                const date = new Date(release.published_at);
                const formattedDate = date.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                labels.push(`${release.name || release.tag_name} (${formattedDate})`);
                dataPoints.push(releaseTotal);
            });

            // Update grand total display
            const totalEl = document.getElementById('total-downloads-val');
            if (totalEl) {
                totalEl.textContent = grandTotal.toLocaleString();
            }

            renderChart(labels, dataPoints);
        })
        .catch(err => {
            console.error('Error fetching release data:', err);
            // Optionally render an empty chart or show an error message
            renderChart([], []);
        });

    function renderChart(labels, dataPoints) {
        // Theme colors based on CSS variables
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#94a3b8' : '#64748b'; // text-secondary
        const primaryColor = '#3b82f6'; // Match your --primary-color

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Downloads per Release',
                    data: dataPoints,
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: isDarkMode ? '#1e293b' : '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
                        bodyColor: isDarkMode ? '#cbd5e1' : '#475569',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: {
                            family: "'Inter', sans-serif",
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: "'Inter', sans-serif",
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return `Downloads: ${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: { family: "'Inter', sans-serif" }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: { family: "'Inter', sans-serif" },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // Optional: Re-render chart colors on theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Need a slight delay to allow the CSS attribute to update
            setTimeout(() => {
                location.reload(); // Simple way to re-render chart with new theme colors
            }, 50);
        });
    }
});
