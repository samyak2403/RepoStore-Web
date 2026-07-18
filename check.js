// check.js — RepoStore compatibility checker

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('check-form');
    const input = document.getElementById('repo-input');
    const btn = document.getElementById('check-btn');
    const results = document.getElementById('check-results');
    const repoHeaderEl = document.getElementById('repo-header');
    const verdictEl = document.getElementById('verdict');
    const scoreEl = document.getElementById('score');
    const listEl = document.getElementById('check-list');
    const actionsEl = document.getElementById('check-actions');

    if (!form) return;

    const API = 'https://api.github.com';

    // Parse "owner/repo" from a URL or shorthand.
    function parseRepo(value) {
        if (!value) return null;
        let v = value.trim();
        v = v.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
        v = v.replace(/\.git$/i, '');
        v = v.replace(/\/+$/,'');
        const parts = v.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        return { owner: parts[0], repo: parts[1] };
    }

    async function ghFetch(path) {
        const res = await fetch(API + path, {
            headers: { 'Accept': 'application/vnd.github+json' }
        });
        return res;
    }

    function iconFor(status) {
        if (status === 'pass') return '<i class="fa-solid fa-circle-check"></i>';
        if (status === 'warn') return '<i class="fa-solid fa-circle-exclamation"></i>';
        return '<i class="fa-solid fa-circle-xmark"></i>';
    }

    // Extra guidance shown when a check row is expanded.
    const HELP = {
        'Public repository': 'RepoStore can only list public repositories. If yours is private, open <strong>Settings → General → Danger Zone → Change visibility</strong> and make it public.',
        'Not archived': 'Archived repositories are read-only and skipped by RepoStore. Unarchive it from <strong>Settings → General → Danger Zone</strong>.',
        'Published release': 'RepoStore installs from your latest <em>published</em> release. Go to <strong>Releases → Draft a new release</strong>, create a tag (e.g. v1.0.0), and publish it — not as a draft or pre-release. <a href="docs.html#steps" class="text-accent">See the guide →</a>',
        'APK in latest release': 'Attach your signed <code>.apk</code> file as an asset on the latest release. Auto-generated source zips do not count. <a href="docs.html#steps" class="text-accent">See the guide →</a>',
        'README present': 'Add a <code>README.md</code> at the repository root. RepoStore renders it as the “About this app” description. <a href="docs.html#readme" class="text-accent">Use the template →</a>',
        'Screenshots folder': 'Create a <code>screenshots/</code> folder at the repo root and add <code>.png</code>/<code>.jpg</code> images. They appear in the details gallery. <a href="docs.html#structure" class="text-accent">See structure →</a>',
        'Discovery topics': 'Add repository topics like <code>android</code>, <code>apk</code>, or <code>mobile</code> in the <strong>About</strong> section. This improves how easily RepoStore finds your app via search.'
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderRepoHeader(repo, data) {
        const desc = data.description ? esc(data.description) : 'No description provided.';
        repoHeaderEl.innerHTML = `
            <img class="repo-avatar" src="${data.owner && data.owner.avatar_url ? data.owner.avatar_url : 'images/icon.png'}" alt="${esc(repo.owner)} avatar">
            <div class="repo-meta">
                <a class="repo-name" href="${data.html_url}" target="_blank" rel="noopener">
                    ${esc(repo.owner)}/<strong>${esc(repo.repo)}</strong>
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <p class="repo-desc">${desc}</p>
                <div class="repo-stats">
                    <span><i class="fa-solid fa-star"></i> ${(data.stargazers_count || 0).toLocaleString()}</span>
                    <span><i class="fa-solid fa-code-fork"></i> ${(data.forks_count || 0).toLocaleString()}</span>
                    ${data.language ? `<span><i class="fa-solid fa-code"></i> ${esc(data.language)}</span>` : ''}
                </div>
            </div>`;
    }

    function renderScore(checks) {
        const total = checks.length;
        const passed = checks.filter(c => c.status === 'pass').length;
        const pct = Math.round((passed / total) * 100);
        const barClass = pct === 100 ? 'full' : (pct >= 70 ? 'ok' : 'low');
        scoreEl.innerHTML = `
            <div class="score-row">
                <span class="score-label">Compatibility score</span>
                <span class="score-value">${passed}/${total}</span>
            </div>
            <div class="score-track"><div class="score-fill ${barClass}" style="width:${pct}%"></div></div>`;
    }

    function renderChecks(checks) {
        listEl.innerHTML = checks.map((c, i) => `
            <li class="check-item ${c.status} ${c.status !== 'pass' ? 'open' : ''}">
                <button class="check-head" type="button" aria-expanded="${c.status !== 'pass'}" data-index="${i}">
                    <span class="check-icon">${iconFor(c.status)}</span>
                    <div class="check-text">
                        <span class="check-title">${c.title} ${c.required ? '' : '<span class="check-badge">recommended</span>'}</span>
                        <span class="check-desc">${c.desc}</span>
                    </div>
                    <span class="check-chevron"><i class="fa-solid fa-chevron-down"></i></span>
                </button>
                <div class="check-detail">
                    <p>${HELP[c.title] || 'No additional details.'}</p>
                </div>
            </li>
        `).join('');

        // Expand/collapse on click.
        listEl.querySelectorAll('.check-head').forEach(head => {
            head.addEventListener('click', () => {
                const item = head.closest('.check-item');
                const isOpen = item.classList.toggle('open');
                head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
        });
    }

    function renderVerdict(checks, repo) {
        const failed = checks.filter(c => c.status === 'fail' && c.required);
        const warned = checks.filter(c => c.status === 'warn');
        if (failed.length === 0) {
            verdictEl.className = 'verdict pass';
            verdictEl.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <strong>${repo.owner}/${repo.repo} is RepoStore-ready!</strong>
                    <span>${warned.length ? warned.length + ' recommendation(s) to improve discovery.' : 'All checks passed.'}</span>
                </div>`;
        } else {
            verdictEl.className = 'verdict fail';
            verdictEl.innerHTML = `
                <i class="fa-solid fa-circle-xmark"></i>
                <div>
                    <strong>Not ready yet</strong>
                    <span>${failed.length} required check(s) failed. Fix them and re-check.</span>
                </div>`;
        }
    }

    function setLoading(loading) {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Checking...'
            : '<i class="fa-solid fa-magnifying-glass"></i> Check';
    }

    // Show placeholder skeleton rows while data loads.
    function showSkeleton() {
        results.hidden = false;
        repoHeaderEl.innerHTML = '<div class="skeleton skeleton-avatar"></div>' +
            '<div class="repo-meta"><div class="skeleton skeleton-line lg"></div>' +
            '<div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line sm"></div></div>';
        verdictEl.className = 'verdict';
        verdictEl.innerHTML = '<div class="skeleton skeleton-line lg" style="width:60%"></div>';
        scoreEl.innerHTML = '';
        actionsEl.innerHTML = '';
        listEl.innerHTML = Array.from({ length: 5 }).map(() =>
            '<li class="check-item skeleton-item"><div class="skeleton skeleton-line" style="width:80%"></div></li>'
        ).join('');
    }

    function renderActions(repo) {
        const shareUrl = `${location.origin}${location.pathname}?repo=${repo.owner}/${repo.repo}`;
        actionsEl.innerHTML = `
            <button type="button" class="btn btn-secondary" id="copy-link">
                <i class="fa-solid fa-link"></i> Copy share link
            </button>
            <a class="btn btn-secondary" href="https://github.com/${repo.owner}/${repo.repo}" target="_blank" rel="noopener">
                <i class="fa-brands fa-github"></i> View on GitHub
            </a>
            <button type="button" class="btn btn-secondary" id="recheck">
                <i class="fa-solid fa-rotate-right"></i> Re-check
            </button>`;

        const copyBtn = document.getElementById('copy-link');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(shareUrl);
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(() => { copyBtn.innerHTML = '<i class="fa-solid fa-link"></i> Copy share link'; }, 1800);
            } catch (e) {
                window.prompt('Copy this link:', shareUrl);
            }
        });
        document.getElementById('recheck').addEventListener('click', () => handleCheck(`${repo.owner}/${repo.repo}`));
    }

    function showMessage(title, desc) {
        results.hidden = false;
        repoHeaderEl.innerHTML = '';
        scoreEl.innerHTML = '';
        verdictEl.className = 'verdict fail';
        verdictEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
            <div><strong>${title}</strong><span>${desc}</span></div>`;
        listEl.innerHTML = '';
    }

    async function runChecks(repo) {
        setLoading(true);
        showSkeleton();

        // 1) Repository must exist and be public.
        let repoData;
        try {
            const res = await ghFetch(`/repos/${repo.owner}/${repo.repo}`);
            if (res.status === 404) {
                showMessage('Repository not found', 'It may be private, misspelled, or does not exist. RepoStore only works with public repos.');
                return;
            }
            if (res.status === 403) {
                showMessage('GitHub rate limit reached', 'The public API allows 60 checks per hour. Please try again later.');
                return;
            }
            if (!res.ok) {
                showMessage('Could not check repository', 'GitHub returned status ' + res.status + '. Try again shortly.');
                return;
            }
            repoData = await res.json();
        } catch (e) {
            showMessage('Network error', 'Could not reach the GitHub API. Check your connection and try again.');
            return;
        }

        // Run the remaining lookups in parallel.
        const [latestRes, readmeRes, screenshotsRes] = await Promise.all([
            ghFetch(`/repos/${repo.owner}/${repo.repo}/releases/latest`),
            ghFetch(`/repos/${repo.owner}/${repo.repo}/readme`),
            ghFetch(`/repos/${repo.owner}/${repo.repo}/contents/screenshots`)
        ]);

        const checks = [];

        // Public + not archived
        checks.push({
            title: 'Public repository',
            required: true,
            status: repoData.private ? 'fail' : 'pass',
            desc: repoData.private ? 'Repository is private.' : 'Repository is public and accessible.'
        });
        checks.push({
            title: 'Not archived',
            required: true,
            status: repoData.archived ? 'fail' : 'pass',
            desc: repoData.archived ? 'Archived repos are excluded.' : 'Repository is active.'
        });

        // Latest published release (excludes drafts/prereleases)
        let latest = null;
        if (latestRes.ok) {
            latest = await latestRes.json();
            checks.push({
                title: 'Published release',
                required: true,
                status: 'pass',
                desc: `Latest release: ${latest.tag_name || latest.name || 'found'}.`
            });
        } else {
            checks.push({
                title: 'Published release',
                required: true,
                status: 'fail',
                desc: 'No published (non-draft, non-prerelease) release found.'
            });
        }

        // APK asset in latest release
        if (latest) {
            const apk = (latest.assets || []).find(a => /\.apk$/i.test(a.name));
            checks.push({
                title: 'APK in latest release',
                required: true,
                status: apk ? 'pass' : 'fail',
                desc: apk ? `Found APK: ${apk.name}` : 'The latest release has no .apk asset.'
            });
        } else {
            checks.push({
                title: 'APK in latest release',
                required: true,
                status: 'fail',
                desc: 'No release to inspect for an APK.'
            });
        }

        // README.md
        checks.push({
            title: 'README present',
            required: true,
            status: readmeRes.ok ? 'pass' : 'fail',
            desc: readmeRes.ok ? 'README is rendered as “About this app”.' : 'Add a README.md at the repo root.'
        });

        // screenshots/ folder with images
        let screenshotStatus = 'fail';
        let screenshotDesc = 'Add a screenshots/ folder with image files.';
        if (screenshotsRes.ok) {
            try {
                const contents = await screenshotsRes.json();
                const imgs = Array.isArray(contents)
                    ? contents.filter(f => f.type === 'file' && /\.(png|jpe?g|webp|gif)$/i.test(f.name))
                    : [];
                if (imgs.length > 0) {
                    screenshotStatus = 'pass';
                    screenshotDesc = `${imgs.length} screenshot image(s) found.`;
                } else {
                    screenshotStatus = 'warn';
                    screenshotDesc = 'screenshots/ folder exists but has no image files.';
                }
            } catch (e) { /* keep fail */ }
        }
        checks.push({
            title: 'Screenshots folder',
            required: false,
            status: screenshotStatus,
            desc: screenshotDesc
        });

        // Topics for discovery (recommended)
        const topics = repoData.topics || [];
        const helpful = ['android', 'apk', 'mobile'];
        const hasHelpful = topics.some(t => helpful.includes(t.toLowerCase()));
        checks.push({
            title: 'Discovery topics',
            required: false,
            status: hasHelpful ? 'pass' : 'warn',
            desc: hasHelpful
                ? `Topics: ${topics.join(', ')}`
                : 'Add topics like “android”, “apk”, or “mobile” to improve discovery.'
        });

        renderRepoHeader(repo, repoData);
        renderVerdict(checks, repo);
        renderScore(checks);
        renderChecks(checks);
        renderActions(repo);
        results.hidden = false;

        // Update the URL so the result is shareable/bookmarkable.
        const url = `${location.pathname}?repo=${repo.owner}/${repo.repo}`;
        history.replaceState(null, '', url);
    }

    function handleCheck(value) {
        const repo = parseRepo(value);
        if (!repo) {
            showMessage('Invalid URL', 'Enter a GitHub repo URL like https://github.com/owner/repo');
            return;
        }
        input.value = `${repo.owner}/${repo.repo}`;
        runChecks(repo).finally(() => setLoading(false));
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCheck(input.value);
    });

    document.querySelectorAll('.check-example').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleCheck(link.dataset.repo);
        });
    });

    // Auto-run if a ?repo= parameter is present (shareable links).
    const params = new URLSearchParams(location.search);
    const preset = params.get('repo');
    if (preset) {
        input.value = preset;
        handleCheck(preset);
    }
});
