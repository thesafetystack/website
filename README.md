# The Safety Stack website

This repository holds the website of The Safety Stack as plain files. Nothing is built. GitHub Pages can serve the top level of the `main` branch as it is.

## Files

| File | What it is |
|---|---|
| `index.html` | The front page. |
| `why.html` | The "Why Stack?" page. |
| `Main.dc.html`, `Mobile.dc.html` | The scroll story for wide and for narrow windows. The front page loads one of them by name when its play button is pressed, so the names must stay as they are, including the capital letters. |
| `stack.html` | The stack visualisation. |
| `summary.json`, `summary.js` | The data of the stack visualisation. Both hold the same content. The page reads `summary.json` when it is served from a web address and `summary.js` when it is opened from disk. |
| `support.js` | The script every page loads to draw itself. It fetches React and Babel from unpkg.com. |
| `.nojekyll` | An empty file that tells GitHub Pages to serve the files unchanged. |
| `tools/build_summary.py` | The script that builds `summary.json` and `summary.js` from one dataset release. |
| `tools/SUMMARY-FORMAT.md` | The description of the summary file. |

## Updating the data of the stack visualisation

The two summary files in this repository were built from release 2026-11-08 of the dataset [thesafetystack/the-safety-stack](https://huggingface.co/datasets/thesafetystack/the-safety-stack). The stack visualisation shows newer data only after both files at the top level are replaced.

```
python tools/build_summary.py <release folder> <output folder>
```

The release folder is one release of the dataset as published, with `release.json`, `data/corpus.parquet` and `taxonomies/`. The script needs Python with `duckdb` and `pyyaml`, and it was written against DuckDB 2.0. It takes about 12 seconds, and two runs on the same release give the same bytes. It has run on the releases 2026-11-02 and 2026-11-08 and has not been tried on later ones.

## Weekly update, not built yet

No step replaces the two files automatically. The plan under discussion is a last step in the weekly pipeline run that runs the script on the new release and commits `summary.json` and `summary.js` to the top level of this repository. That step needs a credential that is allowed to write to this repository.

Four things in the script are kept by hand and do not follow the data: the list of labs with their sources, the lab and model names used to tie a suspicion to a lab, the three layer definitions, and the wording of the key. They are in the settings block at the top of the script.
