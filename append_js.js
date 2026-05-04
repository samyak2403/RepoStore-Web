const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const contributorsJs = `
    // Contributors Logic
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
js = js.replace('});', contributorsJs + '\n});');
fs.writeFileSync('script.js', js);
console.log('Appended to script.js');
