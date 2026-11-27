# The Safety Stack website

This repository holds the website of The Safety Stack as plain files. Nothing is built. GitHub Pages can serve the top level of the `main` branch as it is.

## Files

| File | What it is |
|---|---|
| `index.html` | The front page. |
| `why.html` | The "Why Stack?" page. |
| `team.html` | The Team page. |
| `Main.dc.html`, `Mobile.dc.html` | The scroll story for wide and for narrow windows. They are no longer linked from the front page or any other page; they open only by their own address. |
| `stack.html` | The stack visualisation. |
| `explorer.html` | The Dataset explorer, shown in a frame under the site header. The explorer's address is a constant at the top of the page's script; the frame gets `?embed=1&theme=` with `light` or `dark`, and the page posts `{type: "tss-theme", theme}` to the frame when the site theme changes. The page is reached and left by ordinary page loads, not by the in-page page switching of `nav.js`. |
| `nav.js` | Shared navigation ribbon, light/dark theme tokens and toggle, and instant client-side page switching across the four pages. Pass `?style=classic` to preview the earlier cream/monospace palette. |
| `summary.json`, `summary.js` | The data of the stack visualisation. Both hold the same content. The page reads `summary.json` when it is served from a web address and `summary.js` when it is opened from disk. |
| `release.js` | The id, date and number of documents of the release the summary files were built from, as `window.__TSS_RELEASE = {id, created_at, documents}` (about 100 bytes). `nav.js` loads it on every page, and each footer shows the release id next to the Hugging Face link. When the file is missing the footers show the value written in `nav.js`. |
| `support.js` | The Design Components runtime used by the interactive pages. |
| `vendor/` | Local copies of React 18.3.1 UMD (`react.production.min.js`, `react-dom.production.min.js`) so pages render with zero third-party runtime requests. |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `og-image.png` | Site icons (transparent adaptive SVG + PNG/ICO fallbacks) and 1200×630 Open Graph preview image. |
| `404.html`, `robots.txt`, `sitemap.xml` | Custom error page and crawler metadata. |
| `.nojekyll` | An empty file that tells GitHub Pages to serve the files unchanged. |
| `tools/build_summary.py` | The script that builds `summary.json`, `summary.js` and `release.js` from one dataset release. |
| `tools/SUMMARY-FORMAT.md` | The description of the summary file. |

## Updating the data of the stack visualisation

The two summary files and `release.js` in this repository were built from release 2026-11-22 of the dataset [thesafetystack/the-safety-stack](https://huggingface.co/datasets/thesafetystack/the-safety-stack). The stack visualisation shows newer data only after both files at the top level are replaced, and the footers show the newer release only after `release.js` is replaced with them.

```
python tools/build_summary.py <release folder> <output folder>
```

The release folder is one release of the dataset as published, with `release.json`, `data/corpus.parquet` and `taxonomies/`. The script needs Python with `duckdb` and `pyyaml`, and it was written against DuckDB 2.0. It takes about 12 seconds, and two runs on the same release give the same bytes. It has run on the releases 2026-11-02, 2026-11-08 and 2026-11-22 and has not been tried on later ones.

## Weekly update

The weekly Railway cycle in [the-safety-stack-pipeline](https://github.com/thesafetystack/the-safety-stack-pipeline) (`tools/scheduled_run.py`, D810) runs its reviewed copy of the summary builder (`tools/build_website_summary.py`, kept in sync with `tools/build_summary.py` here) on the verified public release right after uploading to Hugging Face, validates `summary.json` and `summary.js`, and commits and pushes them to `main` when they change. On Railway, set `WEBSITE_GITHUB_TOKEN` (a GitHub fine-grained personal access token scoped to `Contents: Read and write` on this repository only) to enable it. A staged release can also be pushed by hand with `python tools/scheduled_run.py update-website --release-id <date>`.

Four things in the script are kept by hand and do not follow the data: the list of labs with their sources, the lab and model names used to tie a suspicion to a lab, the three layer definitions, and the wording of the key. They are in the settings block at the top of the script.
