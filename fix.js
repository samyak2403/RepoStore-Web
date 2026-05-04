const fs = require('fs');

try {
    // 1. Update index.html
    let html = fs.readFileSync('index.html', 'utf8');
    if (!html.includes('id="contributors"')) {
        const contributorsSection = `
    <!-- Contributors Section -->
    <section id="contributors" class="contributors section-padding bg-alt reveal">
        <div class="container">
            <div class="section-header text-center max-w-2xl mx-auto">
                <h2>Meet our <span class="text-gradient">Contributors</span></h2>
                <p>RepoStore is built by a passionate community. Thank you to every contributor who makes this project possible.</p>
            </div>

            <div class="contributors-marquee-wrapper">
                <div class="contributors-marquee">
                    <div class="marquee-track" id="contributors-track">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>

            <div class="contributors-cta text-center">
                <a href="https://github.com/samyak2403/RepoStore/graphs/contributors" target="_blank" class="btn btn-secondary mt-4">
                    <i class="fa-brands fa-github"></i> View All Contributors
                </a>
            </div>
        </div>
    </section>
`;
        // Insert right before <!-- CTA Section -->
        html = html.replace('<!-- CTA Section -->', contributorsSection + '\n    <!-- CTA Section -->');
        // Add to nav
        html = html.replace('<li><a href="#developers">Developers</a></li>', '<li><a href="#developers">Developers</a></li>\n                <li><a href="#contributors">Contributors</a></li>');
        fs.writeFileSync('index.html', html);
        console.log('index.html updated');
    } else {
        console.log('index.html already has contributors');
    }

    // 2. Update style.css
    let css = fs.readFileSync('style.css', 'utf8');
    if (!css.includes('.contributors-marquee-wrapper')) {
        const contributorsCss = `
/* ==========================================
   Contributors Marquee Section
   ========================================== */
.contributors {
    position: relative;
    overflow: hidden;
}
.contributors-marquee-wrapper {
    position: relative;
    margin-bottom: 48px;
}
.contributors-marquee {
    overflow: hidden;
    position: relative;
    padding: 40px 0;
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
    mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
}
.marquee-track {
    display: flex;
    gap: 32px;
    width: max-content;
    animation: marqueeScroll 20s linear infinite;
}
.marquee-track:hover {
    animation-play-state: paused;
}
@keyframes marqueeScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
.contributor-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-width: 100px;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
}
.contributor-avatar-wrapper {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    padding: 3px;
    background: transparent;
    transition: transform 0.3s ease;
}
.contributor-card:hover .contributor-avatar-wrapper {
    transform: scale(1.05);
}
.contributor-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    border: 2px solid var(--bg-primary);
    background-color: var(--bg-secondary);
    filter: grayscale(100%);
    transition: filter 0.3s ease;
}
.contributor-card:hover .contributor-avatar {
    filter: grayscale(0%);
}
.contributor-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-align: center;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.3s ease;
}
.contributor-card:hover .contributor-name {
    color: var(--text-primary);
}
.contributors-cta {
    margin-top: 16px;
}
.contributors-cta .btn {
    gap: 10px;
}
@media (max-width: 992px) {
    .contributor-avatar-wrapper { width: 64px; height: 64px; }
    .marquee-track { gap: 28px; }
}
@media (max-width: 768px) {
    .contributor-avatar-wrapper { width: 56px; height: 56px; }
    .contributor-name { font-size: 0.7rem; max-width: 80px; }
    .contributor-card { min-width: 80px; gap: 8px; }
    .marquee-track { gap: 20px; }
    .contributors-marquee { padding: 28px 0; }
}
@media (max-width: 480px) {
    .contributor-avatar-wrapper { width: 48px; height: 48px; }
    .contributor-card { min-width: 64px; gap: 6px; }
    .marquee-track { gap: 16px; }
}
`;
        fs.appendFileSync('style.css', '\n' + contributorsCss);
        console.log('style.css updated');
    } else {
        console.log('style.css already has contributors');
    }

    // 3. Update script.js
    let js = fs.readFileSync('script.js', 'utf8');
    if (!js.includes('function buildContributorCard')) {
        const contributorsJs = `
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
        card.setAttribute('aria-label', \`View \${contributor.login}'s GitHub profile\`);

        const gradient = ringGradients[index % ringGradients.length];

        card.innerHTML = \`
            <div class="contributor-avatar-wrapper" style="background: \${gradient};">
                <img class="contributor-avatar" src="\${contributor.avatar_url}&s=150" alt="\${contributor.login}" loading="lazy">
            </div>
            <span class="contributor-name">\${contributor.login}</span>
        \`;
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

    fetch(\`https://api.github.com/repos/\${REPO_OWNER}/\${REPO_NAME}/contributors?per_page=100\`)
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
`;
        
        // Find the last '});' and insert before it
        const lastBracketIndex = js.lastIndexOf('});');
        if (lastBracketIndex !== -1) {
            js = js.substring(0, lastBracketIndex) + contributorsJs + '\n});\n';
            fs.writeFileSync('script.js', js);
            console.log('script.js updated');
        } else {
            // Just append if no closing tag
            fs.appendFileSync('script.js', '\n' + contributorsJs);
            console.log('script.js appended to end');
        }
    } else {
        console.log('script.js already has contributors logic');
    }
} catch (e) {
    console.error('Error:', e);
}
