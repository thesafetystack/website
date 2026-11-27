(() => {
  const params = new URLSearchParams(location.search);
  const STYLE = (params.get('style') === 'classic' || window.__SITE_STYLE === 'brand') ? 'brand' : 'editorial';
  const STORAGE_KEY = 'tss-theme';
  const mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getStoredTheme() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'dark' || v === 'light' ? v : null;
    } catch {
      return null;
    }
  }
  function currentMode() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return mqDark && mqDark.matches ? 'dark' : 'light';
  }
  const initialStored = getStoredTheme();
  if (initialStored) document.documentElement.setAttribute('data-theme', initialStored);

  /* ---- SVG Theme Palettes (Brand Light/Dark + Editorial "Archival Atlas" Light/Dark) ---- */
  const SVG_THEMES = {
    brand: {
      light: {
        bg: '#feecd3',
        svgHeading: '#114b5f',
        svgMuted: '#5c7f88',
        link: '#028090',
        plate: { top: '#114b5f', front: '#285c6b', right: '#3c6c77', stroke: '#7ec7d8', solidStroke: '#2f7f94', edge: '#9fd6e2' },
        own: { top: '#91a29e', front: '#a4b0a8', right: '#b5bcb1', stroke: '#2f7f94', edge: '#4d747c' },
        ghost: { fill: '#114b5f', topOpacity: 0.42, frontOpacity: 0.34, rightOpacity: 0.30 },
        none: { stroke: '#114b5f', maxOpacity: 0.90 },
        disputed: { stripeMixTarget: '#feecd3', stripeMixWeight: 0.80, noneStripe: '#114b5f', noneStripeOpacity: 0.60 },
        hole: { rimWall: '#07202b', rimMix: 0.50, interior: '#feecd3' },
        grid: { stroke: '#114b5f', opacityStack: 0.09, opacityPage: 0.13, hatchStroke: '#feecd3', hatchOpacity: 0.38 },
        threat: { line: '#da532c', label: '#a83a1b' },
        brackets: { roleTint: ['#3a7f8c', '#337685', '#2d6d7e'], flatBracket: '#5c7f88', discDigitInk: '#feecd3', darkMatterLabel: '#7d6a3a' },
        wire: { boxStroke: '#114b5f', trayFill: '#114b5f', dmFill: '#114b5f', dmStroke: '#114b5f' },
      },
      dark: {
        bg: '#0b151c',
        svgHeading: '#f6ecdc',
        svgMuted: '#9bb6c0',
        link: '#5cd2e3',
        plate: { top: '#24a4ba', front: '#1b8294', right: '#136473', stroke: '#96e7f5', solidStroke: '#4bc0d6', edge: '#caf6fe' },
        own: { top: '#437180', front: '#355c69', right: '#294954', stroke: '#72a7b8', edge: '#96c6d4' },
        ghost: { fill: '#4295ad', topOpacity: 0.28, frontOpacity: 0.22, rightOpacity: 0.18 },
        none: { stroke: '#6faec2', maxOpacity: 0.60 },
        disputed: { stripeMixTarget: '#0b151c', stripeMixWeight: 0.80, noneStripe: '#7bc0d4', noneStripeOpacity: 0.72 },
        hole: { rimWall: '#04090d', rimMix: 0.62, interior: '#0b151c' },
        grid: { stroke: '#7ecde0', opacityStack: 0.075, opacityPage: 0.09, hatchStroke: '#0b151c', hatchOpacity: 0.42 },
        threat: { line: '#f0714a', label: '#ff9675' },
        brackets: { roleTint: ['#74cde0', '#63bdd2', '#52adc4'], flatBracket: '#86a7b3', discDigitInk: '#0b151c', darkMatterLabel: '#d9be82' },
        wire: { boxStroke: '#73bdd1', trayFill: '#4b8ea3', dmFill: '#4b8ea3', dmStroke: '#85cee0' },
      },
    },
    editorial: {
      light: {
        bg: '#f6f4ef',
        svgHeading: '#0f4356',
        svgMuted: '#4b6872',
        link: '#006c7a',
        plate: { top: '#114b5f', front: '#22596c', right: '#336879', stroke: '#72c4d6', solidStroke: '#2b7a8f', edge: '#a3dceb' },
        own: { top: '#8da4a9', front: '#9fb3b6', right: '#b0c0c2', stroke: '#3c7d8f', edge: '#588a98' },
        ghost: { fill: '#114b5f', topOpacity: 0.38, frontOpacity: 0.30, rightOpacity: 0.26 },
        none: { stroke: '#114b5f', maxOpacity: 0.72 },
        disputed: { stripeMixTarget: '#f6f4ef', stripeMixWeight: 0.80, noneStripe: '#114b5f', noneStripeOpacity: 0.55 },
        hole: { rimWall: '#07202b', rimMix: 0.52, interior: '#f6f4ef' },
        grid: { stroke: '#114b5f', opacityStack: 0.065, opacityPage: 0.08, hatchStroke: '#f6f4ef', hatchOpacity: 0.38 },
        threat: { line: '#d44b24', label: '#ab3615' },
        brackets: { roleTint: ['#357b8a', '#2e7283', '#27687b'], flatBracket: '#4b6872', discDigitInk: '#f6f4ef', darkMatterLabel: '#6e5c30' },
        wire: { boxStroke: '#114b5f', trayFill: '#114b5f', dmFill: '#114b5f', dmStroke: '#114b5f' },
      },
      dark: {
        bg: '#0c1317',
        svgHeading: '#eff3f5',
        svgMuted: '#99b2bc',
        link: '#5fd4e6',
        plate: { top: '#24a5bc', front: '#1b8396', right: '#136574', stroke: '#99e9f7', solidStroke: '#4dc2d8', edge: '#ccf7ff' },
        own: { top: '#426e7d', front: '#345a66', right: '#284752', stroke: '#70a5b5', edge: '#94c4d2' },
        ghost: { fill: '#4194ac', topOpacity: 0.28, frontOpacity: 0.22, rightOpacity: 0.18 },
        none: { stroke: '#6eadc1', maxOpacity: 0.60 },
        disputed: { stripeMixTarget: '#0c1317', stripeMixWeight: 0.80, noneStripe: '#7bc0d4', noneStripeOpacity: 0.72 },
        hole: { rimWall: '#04080b', rimMix: 0.62, interior: '#0c1317' },
        grid: { stroke: '#7ecde0', opacityStack: 0.065, opacityPage: 0.08, hatchStroke: '#0c1317', hatchOpacity: 0.42 },
        threat: { line: '#f0724b', label: '#ff9878' },
        brackets: { roleTint: ['#76cfe2', '#64bfd4', '#53aec5'], flatBracket: '#85a6b2', discDigitInk: '#0c1317', darkMatterLabel: '#d4bc88' },
        wire: { boxStroke: '#73bdd1', trayFill: '#4a8da2', dmFill: '#4a8da2', dmStroke: '#86cfe1' },
      },
    },
  };

  function emitThemeChange() {
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: currentMode() }));
  }

  function syncThemeColor() {
    const dark = currentMode() === 'dark';
    const bg = SVG_THEMES[STYLE][dark ? 'dark' : 'light'].bg;
    const metas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    if (metas.length) {
      metas.forEach((m) => { m.content = bg; });
    } else {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.content = bg;
      document.head.appendChild(m);
    }
  }

  window.__siteTheme = {
    style: STYLE,
    mode: currentMode,
    svg: () => SVG_THEMES[STYLE][currentMode()],
    set(next) {
      if (next !== 'light' && next !== 'dark') return;
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      syncThemeButtons();
      syncThemeColor();
      emitThemeChange();
    },
    toggle() {
      this.set(currentMode() === 'dark' ? 'light' : 'dark');
    },
  };

  if (mqDark && mqDark.addEventListener) {
    mqDark.addEventListener('change', () => {
      if (!document.documentElement.getAttribute('data-theme')) {
        syncThemeButtons();
        syncThemeColor();
        emitThemeChange();
      }
    });
  }

  /* ---- Theme CSS Tokens ---- */
  const LIGHT_VARS = STYLE === 'editorial' ? `
    --bg: #f6f4ef;
    --surface: #fcfbf8;
    --surface-glass: #fcfbf8f2;
    --surface-2: #ebe7de;
    --surface-input: #ffffff;
    --border: #0f435621;
    --border-strong: #0f43564d;
    --bar-track: #0f435618;
    --selection: #006c7a26;
    --heading: #0f4356;
    --ink: #1f292e;
    --muted: #4b6872;
    --link: #006c7a;
    --link-hover: #0b3b4c;
    --accent: #d44b24;
    --accent-ink: #ab3615;
    --logo-slab: #114b5f;
    --shadow: 0 12px 28px #0f43561f;
    --grid-stroke: #114b5f;
    --grid-opacity: 0.08;
    --tile-rule: #0f43564d;
    --font-display: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --font-prose: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-nav: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --radius-sm: 4px;
    --radius-md: 6px;
    --lead-gap: 24px 44px;
  ` : `
    --bg: #feecd3;
    --surface: #fff8ec;
    --surface-glass: #fff8ecf5;
    --surface-2: #fffdf7;
    --surface-input: #ffffff;
    --border: #114b5f2b;
    --border-strong: #114b5f66;
    --bar-track: #114b5f18;
    --selection: #02809033;
    --heading: #114b5f;
    --ink: #333333;
    --muted: #47666e;
    --link: #016c7a;
    --link-hover: #114b5f;
    --accent: #da532c;
    --accent-ink: #a83a1b;
    --logo-slab: #114b5f;
    --shadow: 0 10px 24px #114b5f33;
    --grid-stroke: #114b5f;
    --grid-opacity: 0.13;
    --tile-rule: #114b5f;
    --font-display: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    --font-sans: 'Merriweather Sans', Helvetica, Arial, sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    --font-prose: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    --font-ui: 'Merriweather Sans', Helvetica, Arial, sans-serif;
    --font-nav: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
    --radius-sm: 2px;
    --radius-md: 2px;
    --lead-gap: 18px 20px;
  `;

  const DARK_VARS = STYLE === 'editorial' ? `
    --bg: #0c1317;
    --surface: #131e24;
    --surface-glass: #131e24f0;
    --surface-2: #1a2932;
    --surface-input: #0f181d;
    --border: #8ce2ef1f;
    --border-strong: #8ce2ef4d;
    --bar-track: #8ce2ef1f;
    --selection: #45c1d436;
    --heading: #eff3f5;
    --ink: #dce4e8;
    --muted: #99b2bc;
    --link: #5fd4e6;
    --link-hover: #9eeaf6;
    --accent: #f0724b;
    --accent-ink: #ff9878;
    --logo-slab: #28acc2;
    --shadow: 0 14px 36px #030709d9;
    --grid-stroke: #6ec0d4;
    --grid-opacity: 0.07;
    --tile-rule: #8ce2ef4d;
  ` : `
    --bg: #0b151c;
    --surface: #11202a;
    --surface-glass: #11202af0;
    --surface-2: #172b38;
    --surface-input: #172b38;
    --border: #7ec7d826;
    --border-strong: #7ec7d859;
    --bar-track: #7ec7d826;
    --selection: #42bfd138;
    --heading: #f6ecdc;
    --ink: #e9e0cf;
    --muted: #9bb6c0;
    --link: #5cd2e3;
    --link-hover: #9be8f4;
    --accent: #f0714a;
    --accent-ink: #ff9675;
    --logo-slab: #28acc2;
    --shadow: 0 14px 34px #02070acc;
    --grid-stroke: #6abcd0;
    --grid-opacity: 0.08;
    --tile-rule: #7ec7d859;
  `;

  const EDITORIAL_EXTRA = STYLE === 'editorial' ? `
    .site-ribbon { background: var(--surface-glass); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-family: var(--font-nav); }
    .site-brand { font-family: var(--font-nav); font-size: 14px; font-weight: 700; letter-spacing: -0.015em; }
    .site-nav-wide { font-family: var(--font-nav); font-size: 13.5px; font-weight: 500; }
    .site-nav-wide > a, .site-nav-item > button { font-family: var(--font-nav); font-size: 13.5px; font-weight: 500; }
    .site-nav-wide > a[aria-current="page"], .site-nav-item.current > button { box-shadow: inset 0 -2px 0 var(--accent); }
    a { text-decoration-color: color-mix(in srgb, var(--link) 38%, transparent); text-underline-offset: 3px; }
    a:hover { text-decoration-color: currentColor; }
    h1, h2 { font-family: var(--font-display) !important; letter-spacing: -0.02em; }
    :focus-visible { outline: 2px solid var(--link); outline-offset: 2px; }
  ` : '';

  const CSS = `
    :root { color-scheme: light dark; ${LIGHT_VARS} }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) { color-scheme: dark; ${DARK_VARS} }
    }
    :root[data-theme="dark"] { color-scheme: dark; ${DARK_VARS} }
    :root[data-theme="light"] { color-scheme: light; ${LIGHT_VARS} }
    html, body { background: var(--bg) !important; color: var(--ink) !important; }
    ::selection { background: var(--selection) !important; }
    .site-ribbon {
      position: fixed; top: 0; left: 0; right: 0; height: 44px; z-index: 15;
      background: var(--bg); border-bottom: 1px solid var(--border);
      font-family: var(--font-nav);
      -webkit-font-smoothing: antialiased;
    }
    .site-ribbon * { box-sizing: border-box; }
    .site-ribbon a { color: var(--link); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
    .site-ribbon a:hover { color: var(--link-hover); }
    .site-ribbon button { font-family: inherit; }
    .site-brand {
      position: absolute; left: 20px; top: 0; height: 44px;
      display: flex; align-items: center; gap: 8px; white-space: nowrap;
      font-family: var(--font-mono); font-size: 13px; line-height: 1.3; font-weight: 700;
      color: var(--heading) !important; text-decoration: none !important;
    }
    .site-nav-wide {
      position: absolute; right: 16px; top: 0; height: 44px;
      display: flex; align-items: center; gap: 26px;
      font-size: 13px; line-height: 1.3; font-weight: 700;
    }
    .site-nav-wide > a, .site-nav-item > button {
      display: flex; align-items: center; gap: 4px; height: 44px;
      color: var(--heading) !important; text-decoration: none !important; white-space: nowrap;
      background: none; border: 0; padding: 0; margin: 0;
      font-size: 13px; font-weight: 700;
    }
    .site-nav-item { position: relative; display: flex; align-items: center; }
    .site-nav-item > button { cursor: pointer; }
    .site-nav-drop {
      position: absolute; right: 0; top: 100%; margin: 0; padding: 10px 14px;
      list-style: none; min-width: 230px; background: var(--surface);
      border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      box-shadow: var(--shadow); font-weight: 400; line-height: 1.4;
      opacity: 0; visibility: hidden; transition: opacity 120ms ease;
    }
    .site-nav-item.open > .site-nav-drop { opacity: 1; visibility: visible; }
    .site-nav-drop li { margin: 0 0 6px; }
    .site-nav-drop li:last-child { margin-bottom: 0; }
    .site-theme-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; padding: 0; margin: 0;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
      color: var(--heading); cursor: pointer;
    }
    .site-theme-btn:hover { border-color: var(--border-strong); background: var(--surface); }
    .site-nav-narrow { display: none; position: absolute; right: 12px; top: 0; height: 44px; align-items: center; gap: 6px; }
    .site-menu-btn {
      display: flex; align-items: center; height: 44px; padding: 0 10px;
      color: var(--heading); background: none; border: 0; margin: 0;
      font-size: 13px; font-weight: 700; cursor: pointer;
    }
    .site-menu-panel {
      position: fixed; left: 0; right: 0; top: 44px;
      max-height: calc(100vh - 44px); overflow-y: auto;
      background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border-strong);
      padding: 4px 20px 18px; font-size: 14px; line-height: 1.4; display: none;
    }
    .site-nav-narrow.open .site-menu-panel { display: block; }
    .site-menu-panel p { margin: 14px 0 2px; font-weight: 700; color: var(--heading); }
    .site-menu-panel p a { display: block; padding: 6px 0; color: var(--heading) !important; text-decoration: none !important; }
    .site-menu-panel p.label { padding: 6px 0; }
    .site-menu-panel ul { list-style: none; margin: 0; padding: 0; }
    .site-menu-panel li a { display: block; padding: 9px 0; }
    @media (max-width: 759px) {
      .site-nav-wide { display: none; }
      .site-nav-narrow { display: flex; }
    }
    .site-footer {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline;
      gap: 10px 24px; padding-top: 20px; border-top: 1px solid var(--border);
      font-size: 12.5px; line-height: 1.55; color: var(--muted);
    }
    .site-footer-links { display: flex; flex-wrap: wrap; gap: 6px 16px; }
    .site-footer a { color: var(--muted); text-decoration-color: var(--border-strong); }
    .site-footer a:hover { color: var(--link); }
    /* the latest release next to the Hugging Face link; nav.js sets --tss-release from release.js */
    .site-release::after { content: " · latest weekly release " var(--tss-release, "2026-11-22"); display: inline-block; white-space: pre; }
    ${EDITORIAL_EXTRA}
  `;

  if (!document.getElementById('site-nav-css')) {
    const style = document.createElement('style');
    style.id = 'site-nav-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* The latest release, from release.js, which the summary builder writes with each release: every footer shows its id.
     Without the file the value written in the footer rule stays. */
  function applyRelease() {
    const r = window.__TSS_RELEASE;
    if (r && /^[0-9A-Za-z._-]+$/.test(String(r.id))) document.documentElement.style.setProperty('--tss-release', '"' + r.id + '"');
  }
  if (window.__TSS_RELEASE) applyRelease();
  else if (!document.getElementById('site-release-js')) {
    const s = document.createElement('script');
    s.id = 'site-release-js';
    s.src = new URL('release.js', (document.currentScript && document.currentScript.src) || location.href).href;
    s.onload = applyRelease;
    document.head.appendChild(s);
  }

  /* Capture support.js's React root handle so client-side navigation can unmount cleanly */
  if (window.ReactDOM && window.ReactDOM.createRoot && !window.ReactDOM.__spaWrapped) {
    const origCreateRoot = window.ReactDOM.createRoot.bind(window.ReactDOM);
    window.ReactDOM.createRoot = function (el, opts) {
      const root = origCreateRoot(el, opts);
      if (el && el.id === 'dc-root') window.__spaRoot = root;
      return root;
    };
    window.ReactDOM.__spaWrapped = true;
  }

  const PAGES = {
    index: 'index.html',
    why: 'why.html',
    stack: 'stack.html',
    team: 'team.html',
  };

  function pageKeyFromPath(pathname) {
    const clean = (pathname || '').replace(/\/+$/, '');
    const seg = clean.split('/').pop().toLowerCase();
    if (!clean || seg === 'index' || seg === 'index.html') return 'index';
    if (seg === 'why' || seg === 'why.html') return 'why';
    if (seg === 'stack' || seg === 'stack.html') return 'stack';
    if (seg === 'team' || seg === 'team.html') return 'team';
    return null;
  }

  let currentKey = pageKeyFromPath(location.pathname) || 'index';

  const DATA_LINKS = [
    ['https://huggingface.co/datasets/thesafetystack/the-safety-stack', 'Dataset on Hugging Face'],
    ['https://github.com/thesafetystack/the-safety-stack-pipeline', 'Pipeline source code'],
    ['https://github.com/thesafetystack/the-safety-stack', 'Taxonomies on GitHub'],
  ];
  const dataLis = DATA_LINKS
    .map(([u, t]) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`)
    .join('');

  const exploreLis = `<li><a href="stack.html${STYLE === 'brand' ? '?style=classic' : ''}" data-page="stack">The safety stack by lab</a></li>`
    + '<li><a href="https://stack-model-explorer.gavento.workers.dev/" target="_blank" rel="noopener">Dataset explorer</a></li>';

  const LOGO_SVG = '<svg width="18" height="18" viewBox="0 0 64 64" aria-hidden="true" style="display:block;flex:none"><polygon points="4,38 32,24 60,38 32,52" style="fill:var(--logo-slab);opacity:0.52"/><polygon points="4,28 32,14 60,28 32,42" style="fill:var(--logo-slab)"/><line x1="32" y1="4" x2="32" y2="60" style="stroke:var(--accent)" stroke-width="3.4" stroke-linecap="round"/></svg>';
  const styleQ = STYLE === 'brand' ? '?style=classic' : '';
  const SUN_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
  const MOON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  const header = document.createElement('header');
  header.className = 'site-ribbon';
  header.innerHTML = `
    <a href="index.html${styleQ}" class="site-brand">${LOGO_SVG}The Safety Stack</a>
    <nav class="site-nav-wide" aria-label="Primary">
      <a href="why.html${styleQ}" data-page="why">Why Stack?</a>
      <div class="site-nav-item" data-navbox="r-explore" data-page-group="stack">
        <button type="button" aria-expanded="false">Explore<span aria-hidden="true" style="font-size:10px;opacity:0.65">&#9662;</span></button>
        <ul class="site-nav-drop">${exploreLis}</ul>
      </div>
      <div class="site-nav-item" data-navbox="r-data">
        <button type="button" aria-expanded="false">Data and code<span aria-hidden="true" style="font-size:10px;opacity:0.65">&#9662;</span></button>
        <ul class="site-nav-drop">${dataLis}</ul>
      </div>
      <a href="team.html${styleQ}" data-page="team">Team</a>
      <button type="button" class="site-theme-btn" data-theme-toggle="1"></button>
    </nav>
    <div class="site-nav-narrow" data-navbox="r-menu">
      <button type="button" class="site-theme-btn" data-theme-toggle="1"></button>
      <button type="button" class="site-menu-btn" aria-expanded="false" aria-controls="site-mobile-menu">Menu</button>
      <div id="site-mobile-menu" class="site-menu-panel">
        <p><a href="why.html${styleQ}" data-page="why">Why Stack?</a></p>
        <p class="label">Explore</p>
        <ul>${exploreLis}</ul>
        <p class="label">Data and code</p>
        <ul>${dataLis}</ul>
        <p><a href="team.html${styleQ}" data-page="team">Team</a></p>
      </div>
    </div>
  `;

  function syncThemeButtons() {
    const dark = currentMode() === 'dark';
    header.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = dark ? SUN_SVG : MOON_SVG;
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    });
  }
  syncThemeButtons();
  syncThemeColor();
  header.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => window.__siteTheme.toggle());
  });

  function syncCurrentNav(key) {
    header.querySelectorAll('a[data-page]').forEach((a) => {
      if (a.getAttribute('data-page') === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    header.querySelectorAll('[data-page-group]').forEach((el) => el.classList.toggle('current', el.getAttribute('data-page-group') === key));
  }
  syncCurrentNav(currentKey);

  const mountHeader = () => {
    if (document.querySelector('.site-ribbon')) return;
    if (document.body) document.body.prepend(header);
  };
  if (document.body) mountHeader();
  else document.addEventListener('DOMContentLoaded', mountHeader);

  /* Dropdown + mobile menu state */
  let openEl = null, closeTimer = null, tap = null;
  const setOpen = (el) => {
    clearTimeout(closeTimer);
    if (openEl && openEl !== el) {
      openEl.classList.remove('open');
      const b = openEl.querySelector(':scope > button:not([data-theme-toggle])');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
    openEl = el;
    if (el) {
      el.classList.add('open');
      const b = el.querySelector(':scope > button:not([data-theme-toggle])');
      if (b) b.setAttribute('aria-expanded', 'true');
    }
  };

  header.querySelectorAll('.site-nav-item').forEach((dataItem) => {
    const dataBtn = dataItem.querySelector(':scope > button');
    if (!dataBtn) return;
    dataItem.addEventListener('mouseenter', () => { if (!tap || !tap.touch) setOpen(dataItem); });
    dataItem.addEventListener('mouseleave', () => {
      closeTimer = setTimeout(() => { if (openEl === dataItem) setOpen(null); }, 160);
    });
    dataItem.addEventListener('focusin', () => setOpen(dataItem));
    dataItem.addEventListener('focusout', (e) => { if (openEl === dataItem && !dataItem.contains(e.relatedTarget)) setOpen(null); });
    dataBtn.addEventListener('pointerdown', (e) => {
      tap = { touch: e.pointerType === 'touch' || e.pointerType === 'pen', wasOpen: openEl === dataItem };
    });
    dataBtn.addEventListener('click', () => {
      const wasOpen = tap ? tap.wasOpen : openEl === dataItem;
      setOpen(wasOpen ? null : dataItem);
      tap = null;
    });
  });

  const menuWrap = header.querySelector('.site-nav-narrow');
  const menuBtn = header.querySelector('.site-menu-btn');
  if (menuWrap && menuBtn) {
    menuBtn.addEventListener('click', () => setOpen(openEl === menuWrap ? null : menuWrap));
    menuWrap.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(null)));
  }

  document.addEventListener('pointerdown', (e) => {
    if (openEl && !(e.target && e.target.closest && e.target.closest('[data-navbox]'))) setOpen(null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openEl) {
      e.preventDefault();
      e.stopPropagation();
      const trigger = openEl.querySelector(':scope > button:not([data-theme-toggle])');
      setOpen(null);
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    }
  }, true);

  /* ---- Instant client-side navigation (HTTP/HTTPS only; file:// uses normal links) ---- */
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  const pageCache = new Map();
  const registered = new Set();
  let summaryPromise = null;
  let navSeq = 0;

  function parsePageHtml(key, html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = (doc.querySelector('title') && doc.querySelector('title').textContent) || 'The Safety Stack';
    const descEl = doc.querySelector('meta[name="description"]');
    const canonEl = doc.querySelector('link[rel="canonical"]');
    const meta = {
      description: descEl ? descEl.getAttribute('content') : null,
      canonical: canonEl ? canonEl.getAttribute('href') : null,
    };
    const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(html);
    const closeIdx = html.lastIndexOf('</x-dc>');
    if (openMatch && closeIdx > openMatch.index) {
      const template = html.slice(openMatch.index + openMatch[0].length, closeIdx);
      const scriptEl = doc.querySelector('script[data-dc-script]');
      const js = scriptEl ? (scriptEl.textContent || '') : '';
      const propsRaw = scriptEl ? scriptEl.getAttribute('data-props') : null;
      return { kind: 'dc', key, title, meta, template, js, propsRaw };
    }
    const styleEl = doc.querySelector('style[data-spa-page-style]');
    const bodyEl = doc.querySelector('[data-spa-body]');
    return {
      kind: 'html',
      key,
      title,
      meta,
      css: styleEl ? styleEl.textContent : '',
      bodyHtml: bodyEl ? bodyEl.outerHTML : '',
    };
  }

  function syncHeadMeta(rec) {
    document.title = rec.title;
    const setMeta = (sel, attr, val) => {
      if (!val) return;
      const el = document.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    };
    if (rec.meta) {
      setMeta('meta[name="description"]', 'content', rec.meta.description);
      setMeta('meta[property="og:description"]', 'content', rec.meta.description);
      setMeta('meta[name="twitter:description"]', 'content', rec.meta.description);
      setMeta('link[rel="canonical"]', 'href', rec.meta.canonical);
      setMeta('meta[property="og:url"]', 'content', rec.meta.canonical);
    }
    setMeta('meta[property="og:title"]', 'content', rec.title);
    setMeta('meta[name="twitter:title"]', 'content', rec.title);
  }

  function loadPage(key) {
    if (pageCache.has(key)) return pageCache.get(key);
    const file = PAGES[key];
    if (!file) return Promise.reject(new Error('Unknown page: ' + key));
    const p = fetch(new URL('./' + file, location.href).href)
      .then((r) => {
        if (!r.ok) throw new Error(file + ': ' + r.status);
        return r.text();
      })
      .then((html) => parsePageHtml(key, html))
      .catch((err) => {
        pageCache.delete(key);
        throw err;
      });
    pageCache.set(key, p);
    return p;
  }

  function warmSummary() {
    if (window.STACK_SUMMARY) return Promise.resolve(window.STACK_SUMMARY);
    if (summaryPromise) return summaryPromise;
    summaryPromise = fetch(new URL('./summary.json', location.href).href)
      .then((r) => { if (!r.ok) throw new Error('summary.json: ' + r.status); return r.json(); })
      .then((d) => {
        if (d) window.STACK_SUMMARY = d;
        return d;
      })
      .catch(() => {
        summaryPromise = null;
        window.__stackSummaryPromise = null;
        return null;
      });
    window.__stackSummaryPromise = summaryPromise;
    return summaryPromise;
  }

  function waitForDcRuntime() {
    if (window.getDC && window.__dcUpdate) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      const poll = () => {
        if (window.getDC && window.__dcUpdate) resolve();
        else if (performance.now() - t0 > 5000) reject(new Error('dc-runtime unavailable'));
        else setTimeout(poll, 16);
      };
      poll();
    });
  }

  function cleanupCurrentPage() {
    if (window.__spaRoot) {
      try { window.__spaRoot.unmount(); } catch {}
      window.__spaRoot = null;
    }
    const dcRoot = document.getElementById('dc-root');
    if (dcRoot) dcRoot.remove();
    document.querySelectorAll('[data-spa-body]').forEach((el) => el.remove());
    document.querySelectorAll('style[data-spa-page-style]').forEach((el) => el.remove());
  }

  async function navigate(targetUrl, push) {
    const key = pageKeyFromPath(targetUrl.pathname);
    if (!key) { location.href = targetUrl.href; return; }
    setOpen(null);

    if (push && STYLE === 'brand' && !targetUrl.searchParams.has('style')) {
      targetUrl.searchParams.set('style', 'classic');
    }
    const wantBrand = targetUrl.searchParams.get('style') === 'classic';
    if (wantBrand !== (STYLE === 'brand')) {
      location.href = targetUrl.href;
      return;
    }

    const seq = ++navSeq;

    if (key === currentKey) {
      const prevHash = location.hash;
      if (push && targetUrl.href !== location.href) {
        history.pushState({ spaPage: key }, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
      }
      if (targetUrl.hash !== prevHash) {
        window.dispatchEvent(new Event('hashchange'));
      }
      if (targetUrl.hash) {
        const target = document.getElementById(targetUrl.hash.slice(1));
        if (target) target.scrollIntoView();
      } else if (push) {
        const sc = document.querySelector('[data-scroller="1"]');
        if (sc) sc.scrollTop = 0;
        window.scrollTo(0, 0);
      }
      return;
    }

    try {
      const rec = await loadPage(key);
      if (rec.kind === 'dc') await waitForDcRuntime();
      if (seq !== navSeq) return;

      if (push) {
        history.pushState({ spaPage: key }, '', targetUrl.pathname + targetUrl.search + targetUrl.hash);
      }

      cleanupCurrentPage();
      currentKey = key;
      syncHeadMeta(rec);
      syncCurrentNav(key);

      if (rec.kind === 'html') {
        if (rec.css) {
          const st = document.createElement('style');
          st.setAttribute('data-spa-page-style', key);
          st.textContent = rec.css;
          document.head.appendChild(st);
        }
        const wrap = document.createElement('div');
        wrap.innerHTML = rec.bodyHtml;
        const node = wrap.firstElementChild;
        if (node) document.body.appendChild(node);
        if (targetUrl.hash) {
          const target = document.getElementById(targetUrl.hash.slice(1));
          if (target) target.scrollIntoView();
          else window.scrollTo(0, 0);
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        const dcName = '__spa_' + key;
        if (!registered.has(dcName)) {
          if (rec.propsRaw) window.__dcUpdate(dcName, 'props', rec.propsRaw, false);
          window.__dcUpdate(dcName, 'html', '', true);
          window.__dcUpdate(dcName, 'html', rec.template, false);
          window.__dcUpdate(dcName, 'js', rec.js, false);
          registered.add(dcName);
        }
        const hostEl = document.createElement('div');
        hostEl.id = 'dc-root';
        document.body.appendChild(hostEl);
        const Comp = window.getDC(dcName);
        const root = window.ReactDOM.createRoot(hostEl);
        window.__spaRoot = root;
        root.render(window.React.createElement(Comp));
        window.scrollTo(0, 0);
      }
    } catch (err) {
      if (seq !== navSeq) return;
      console.error('[nav] client navigation fallback:', err);
      location.href = targetUrl.href;
    }
  }

  /* Intercept clicks on internal links */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const rawHref = a.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('javascript:')) return;
    let u;
    try { u = new URL(rawHref, location.href); } catch { return; }
    if (u.origin !== location.origin) return;
    const key = pageKeyFromPath(u.pathname);
    if (!key) return;
    e.preventDefault();
    navigate(u, true);
  });

  /* Handle browser Back / Forward */
  window.addEventListener('popstate', () => {
    const u = new URL(location.href);
    const key = pageKeyFromPath(u.pathname);
    if (key) navigate(u, false);
  });

  /* Warm small page shells in idle; warm heavy summary.json only on stack intent */
  const warmAll = () => {
    const saveData = navigator.connection && navigator.connection.saveData;
    if (saveData) return;
    Object.keys(PAGES).forEach((k) => loadPage(k).catch(() => {}));
  };
  const scheduleWarm = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(warmAll, { timeout: 1200 });
    else setTimeout(warmAll, 300);
  };
  if (document.readyState === 'complete') scheduleWarm();
  else window.addEventListener('load', scheduleWarm, { once: true });

  const onIntent = (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    let u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch { return; }
    if (u.origin !== location.origin) return;
    const key = pageKeyFromPath(u.pathname);
    if (!key) return;
    if (key !== currentKey) loadPage(key).catch(() => {});
    if (key === 'stack') warmSummary();
  };
  document.addEventListener('pointerenter', onIntent, true);
  document.addEventListener('focusin', onIntent, true);
})();
