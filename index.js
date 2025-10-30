// evaluator-model index page JS: lazy-load external markdown toggles and safe render
document.addEventListener('DOMContentLoaded', () => {
	// Ensure there's a toggle and container. If not present, create them next to the model CTA.
	let toggle = document.querySelector('.doc-toggle');
	let container = document.querySelector('.external-markdown');
	let meta = document.querySelector('.doc-meta');

	if (!toggle || !container) {
		const cta = document.querySelector('a.cta[href="./model.html"]');
		if (!cta) return; // nothing to attach to
		const parent = cta.parentElement || document.body;
		// Create meta if missing
		if (!meta) {
			meta = document.createElement('div'); meta.className = 'doc-meta'; meta.textContent = '';
			parent.appendChild(meta);
		}
		// Create toggle if missing
		if (!toggle) {
			toggle = document.createElement('button');
			toggle.className = 'doc-toggle';
			toggle.type = 'button';
			toggle.setAttribute('data-src', './data/external/optimization.md');
			toggle.setAttribute('aria-pressed', 'false');
			toggle.textContent = 'Show doc';
			toggle.style.marginLeft = '0.5rem';
			parent.appendChild(toggle);
		}
		// Create container if missing
		if (!container) {
			container = document.createElement('div');
			container.className = 'external-markdown';
			container.style.display = 'none';
			container.style.marginTop = '0.75rem';
			container.style.border = '1px solid #eee';
			container.style.padding = '0.75rem';
			container.style.borderRadius = '8px';
			container.style.background = '#fff';
			parent.appendChild(container);
		}
	}

	let loaded = false;
	async function fetchAndRender(url) {
		toggle.disabled = true;
		try {
			const res = await fetch(url, { cache: 'no-cache' });
			if (!res.ok) throw new Error('Fetch failed: ' + res.status);
			const md = await res.text();
			// Extract first H1 as title
			const titleMatch = md.match(/^#\s+(.*)/m);
			if (titleMatch && meta) meta.textContent = titleMatch[1];
			// Convert markdown to HTML using marked (already included on page)
			if (window.marked && window.DOMPurify) {
				const html = window.marked.parse(md);
				container.innerHTML = window.DOMPurify.sanitize(html);
			} else {
				// Fallback: render raw markdown inside a pre block
				const pre = document.createElement('pre');
				pre.textContent = md;
				container.appendChild(pre);
			}
			loaded = true;
		} catch (err) {
			container.innerHTML = '<p class="subtle">Unable to load document.</p>';
			console.error('Error loading external markdown:', err);
		} finally {
			toggle.disabled = false;
		}
	}

		toggle.addEventListener('click', async () => {
		const isOpen = toggle.getAttribute('aria-pressed') === 'true';
		if (isOpen) {
			// hide
			container.style.display = 'none';
			toggle.setAttribute('aria-pressed', 'false');
			toggle.textContent = 'Show doc';
			return;
		}
		// show
		container.style.display = '';
		toggle.setAttribute('aria-pressed', 'true');
		toggle.textContent = 'Hide doc';
		if (!loaded) {
			const src = toggle.getAttribute('data-src') || './data/external/optimization.md';
			await fetchAndRender(src);
		}
	});
});

