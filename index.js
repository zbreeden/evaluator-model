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
		// Create meta if missing (append after the toggle so it appears below the button)
		if (!meta) {
			meta = document.createElement('div'); meta.className = 'doc-meta'; meta.textContent = '';
			parent.appendChild(meta);
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

		// Fail-safe: if none of model.html, model.js, or model.css exist, disable the Open Model CTA
		async function assetExists(path) {
			try {
				// Try HEAD first (cheap), fallback to GET
				const head = await fetch(path, { method: 'HEAD' });
				if (head && head.ok) return true;
			} catch (e) {
				// fallthrough
			}
			try {
				const get = await fetch(path, { method: 'GET' });
				return get && get.ok;
			} catch (e) {
				return false;
			}
		}

		(async function checkModelAssets() {
			const cta = document.querySelector('a.cta[href="./model.html"]');
			if (!cta) return;
			const checks = await Promise.all([
				assetExists('./model.html'),
				assetExists('./model.js'),
				assetExists('./model.css')
			]);
			const anyExists = checks.some(Boolean);
			if (!anyExists) {
				// disable the CTA (visual + accessibility)
				cta.classList.add('disabled');
				cta.setAttribute('aria-disabled', 'true');
				cta.setAttribute('tabindex', '-1');
				cta.style.pointerEvents = 'none';
				cta.style.opacity = '0.6';
										// change the label to indicate development status
										cta.textContent = 'Model in Development';
										// Insert an inline visible hint showing the model title (from header)
										try {
											const header = document.querySelector('header');
											let modelTitle = '';
											if (header) {
												const h1 = header.querySelector('h1');
												const p = header.querySelector('p');
												// prefer subtitle paragraph if it looks like a title, else use h1 without emoji
												if (p && p.textContent.trim()) modelTitle = p.textContent.trim();
												else if (h1 && h1.textContent.trim()) {
													modelTitle = h1.textContent.trim().replace(/^[^\w\d]+/, '').trim();
												}
											}
											if (modelTitle) {
												// avoid duplicating hint
												let hint = cta.parentElement.querySelector('.model-hint');
												if (!hint) {
													hint = document.createElement('div');
													hint.className = 'model-hint';
													hint.textContent = modelTitle;
													cta.parentElement.appendChild(hint);
												} else {
													hint.textContent = modelTitle;
												}
											}
										} catch (e) { /* ignore */ }
				// also prevent default on click (extra safety)
				cta.addEventListener('click', (ev) => { ev.preventDefault(); }, { capture: true });
			}
		})();
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

