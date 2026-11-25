#!/usr/bin/env python3
"""Build the summary file that the Safety Stack page reads, from one dataset release.

    python build_summary.py <release folder> <output folder>

The release folder is a release of thesafetystack/the-safety-stack as published
(release.json, data/corpus.parquet, taxonomies/). The script writes summary.json
into the output folder, and summary.js, which holds the same content in a form
the page can also load when it is opened from disk.

All counting is done by the DuckDB queries in QUERIES and OUTPUTS below. The
Python around them only reads the taxonomy files (DuckDB cannot read YAML), runs
the queries in order, and arranges their rows into the file. SUMMARY-FORMAT.md
describes the output.

Needs: duckdb, pyyaml.
"""
import json
import sys
from pathlib import Path

import duckdb
import yaml

# --------------------------------------------------------------------------
# Settings
# --------------------------------------------------------------------------

# Which sources, organisations and names count as which lab.
#   card_channels  sources that hold the lab's cards and policy documents
#   own_channels   other sources published by the lab (its blogs)
#   orgs           organisation ids in the orgs taxonomy; every organisation
#                  below them in the taxonomy is included
#   names          names matched as whole words in evidence sentences
#   model_names    names that may be followed by a version ("Claude-3", "GPT4")
# Matching is case-sensitive. Names of one or two characters are left out.
LABS = [
    {"id": "anthropic", "name": "Anthropic",
     "card_channels": ["anthropic_cards"],
     "own_channels": ["anthropic_alignment_blog", "transformer_circuits"],
     "orgs": ["anthropic"],
     "names": ["Anthropic"], "model_names": ["Claude", "Opus", "Sonnet", "Haiku", "Mythos", "Fable"]},
    {"id": "openai", "name": "OpenAI",
     "card_channels": ["openai_cards"],
     "own_channels": ["openai_blog", "openai_alignment_blog"],
     "orgs": ["openai"],
     "names": ["OpenAI"], "model_names": ["ChatGPT", "InstructGPT", "GPT", "DALL-E", "DALL·E", "Sora", "Codex"]},
    {"id": "google", "name": "Google DeepMind",
     "card_channels": ["deepmind_cards"],
     "own_channels": ["deepmind_blog", "google_research"],
     "orgs": ["google"],
     "names": ["Google", "DeepMind"], "model_names": ["Gemini", "Bard", "PaLM", "Gemma"]},
    {"id": "meta", "name": "Meta",
     "card_channels": ["meta_cards"],
     "own_channels": [],
     "orgs": ["meta"],
     "names": ["Meta", "Facebook"], "model_names": ["Llama", "LLaMA", "LLaMa", "Muse Spark"]},
    {"id": "xai", "name": "xAI",
     "card_channels": ["xai_cards"],
     "own_channels": [],
     "orgs": ["xai"],
     "names": ["xAI"], "model_names": ["Grok"]},
    {"id": "deepseek", "name": "DeepSeek",
     "card_channels": ["deepseek_cards"],
     "own_channels": [],
     "orgs": ["deepseek"],
     "names": [], "model_names": ["DeepSeek"]},
    {"id": "alibaba", "name": "Alibaba (Qwen)",
     "card_channels": ["qwen_cards"],
     "own_channels": [],
     "orgs": ["alibaba"],
     "names": ["Alibaba"], "model_names": ["Qwen", "Tongyi"]},
]

# Names that contain a lab's model name and belong to no lab; they are taken
# out of a sentence before the lab names are looked for.
IGNORE_NAMES = ["GPT-NeoX", "GPT-Neo", "GPT-J", "GPT4All"]

# A lab's own document outside its card sources also counts as a card when the
# dataset's labelling read it as one of these kinds (for example a system card
# that reached the dataset through a paper index).
CARD_KINDS = ["system_card", "model_card"]

# The layers of the stack, top to bottom, by the `kind` field of the techniques taxonomy.
# The taxonomy does not define its three kinds; the definitions here are written for the page.
LAYERS = [
    {"id": "intervention", "name": "Interventions",
     "definition": "Techniques that change something: the training data, the training, the model itself, or what the "
                   "running system is allowed to do or say."},
    {"id": "monitoring", "name": "Monitoring",
     "definition": "Techniques that watch a model or a running system and flag what they find: inputs, outputs, "
                   "internal states, behaviour over time, or incidents."},
    {"id": "assessment", "name": "Assessments",
     "definition": "Techniques that measure or test a model, its data or its safeguards without changing them, such "
                   "as evaluations, audits and red-teaming."},
]

MAX_DOCS = 5        # documents kept per lab, technique and evidence group (the count is always complete)
MAX_SENTENCES = 2   # evidence sentences kept per document
TOP_N = 8           # organisations and models listed per technique

# The text of the page's key, and the line at the foot of the page. The {…}
# fields of the line are filled from the counts.
KEY = [
    {"id": "cards", "text": "stated in the lab's cards"},
    {"id": "own", "text": "used in the lab's papers"},
    {"id": "ghost", "text": "ghost matter: suspected by others"},
    {"id": "none", "text": "unknown"},
    {"id": "argues_not", "text": "disputed: another document argues it is not used"},
    {"id": "dark", "text": "dark matter: in the lab's cards, not in the taxonomy"},
    {"id": "hole", "text": "holes are cosmetic"},
]
NOTES = [
    "Data: release {release} of the dataset, {documents} documents, techniques taxonomy {taxonomy}.",
]

# --------------------------------------------------------------------------
# Queries. Each entry is (table name, SQL); they run in order. The tables
# tech, tech_group, tech_group_child, org, model, lab, lab_channel,
# lab_org_root, lab_name, ignore_name and card_kind are filled from the
# taxonomy files and the settings before these run.
# --------------------------------------------------------------------------

QUERIES = [
    # every organisation at or below a lab's listed organisations
    ("lab_org", """
        WITH RECURSIVE down(lab, org_id) AS (
            SELECT lab, org_id FROM lab_org_root
            UNION
            SELECT d.lab, o.id FROM down d JOIN org o ON o.parent = d.org_id
        )
        SELECT lab, org_id FROM down
    """),

    # the organisation at the top of each organisation's line of parents
    ("org_root", """
        WITH RECURSIVE up(id, reached, parent) AS (
            SELECT id, id, parent FROM org
            UNION ALL
            SELECT u.id, p.id, p.parent FROM up u JOIN org p ON p.id = u.parent
        )
        SELECT u.id, o.name AS root_name FROM up u JOIN org o ON o.id = u.reached WHERE u.parent IS NULL
    """),

    # one row per document
    ("doc", """
        SELECT doc_id, title, canonical_url AS url, year(published_date) AS year,
               annotations.safety_techniques.payload.doc_kind AS kind,
               identity.channels AS channels,
               coalesce(annotations.affiliation_orgs.payload.org_ids, []::VARCHAR[]) AS org_ids
        FROM corpus
    """),

    # a lab's own documents: from its sources, or with one of its organisations
    # among the author affiliations. is_card marks those from its card sources
    # and those the labelling read as a card.
    ("lab_doc", """
        SELECT x.lab, x.doc_id, bool_or(x.is_card) OR bool_or(ck.kind IS NOT NULL) AS is_card
        FROM (
            SELECT lc.lab, c.doc_id, lc.is_card
            FROM (SELECT doc_id, unnest(channels) AS channel FROM doc) c
            JOIN lab_channel lc ON lc.channel = c.channel
            UNION ALL
            SELECT lo.lab, o.doc_id, false
            FROM (SELECT doc_id, unnest(org_ids) AS org_id FROM doc) o
            JOIN lab_org lo ON lo.org_id = o.org_id
        ) x
        JOIN doc d ON d.doc_id = x.doc_id
        LEFT JOIN card_kind ck ON ck.kind = d.kind
        GROUP BY x.lab, x.doc_id
    """),

    # one row per label: a document and a taxonomy entry, with the twelve role
    # levels (0 to 4), the markers and the evidence sentences
    ("label_all", """
        SELECT c.doc_id, t.slug AS slug, t.roles AS roles, t.flags AS flags,
               [q.text FOR q IN t.quotes] AS sentences
        FROM corpus c, unnest(c.annotations.safety_techniques.payload.techniques) AS u(t)
    """),
    # the labels on techniques; labels on the taxonomy's group names are left out
    ("label", """
        SELECT l.* FROM label_all l JOIN tech t ON t.id = l.slug
    """),

    # suspected use: every label with suspected_use at level 1 to 4. A label
    # marked claims_absent argues the system does not use the technique.
    ("suspicion", """
        SELECT doc_id, slug, roles.suspected_use AS level,
               CASE WHEN list_contains(flags, 'claims_absent') THEN 'argues_not' ELSE 'suspected' END AS grp,
               list_contains(flags, 'confirmed') AS confirmed,
               list_contains(flags, 'quote_unverified') AS unverified,
               sentences,
               regexp_replace(array_to_string(sentences, ' | '),
                              coalesce((SELECT string_agg(regexp_escape(name), '|') FROM ignore_name), 'a^'), ' ', 'g') AS sentence_text
        FROM label
        WHERE roles.suspected_use >= 1
    """),

    # lookup, first part: the labs named in a label's evidence sentences
    ("lab_pattern", """
        SELECT lab,
               '(^|[^A-Za-z0-9-])' || regexp_escape(name) ||
               CASE WHEN versioned THEN '($|[^A-Za-z])' ELSE '($|[^A-Za-z0-9-])' END AS pattern
        FROM lab_name
        WHERE length(name) >= 3
    """),
    ("lab_regex", """
        SELECT lab, string_agg(pattern, '|') AS pattern FROM lab_pattern GROUP BY lab
    """),
    ("suspicion_named", """
        SELECT s.doc_id, s.slug, list(DISTINCT p.lab ORDER BY p.lab) AS labs
        FROM suspicion s JOIN lab_pattern p ON regexp_matches(s.sentence_text, p.pattern)
        GROUP BY s.doc_id, s.slug
    """),

    # lookup, second part: the makers of the models a document names. A model
    # takes its maker from the nearest entry above it in the models taxonomy
    # that names one; '(other)' stands for a maker that is none of the labs,
    # and for a model the taxonomy does not hold.
    ("model_maker", """
        WITH RECURSIVE up(node_id, reached, makers) AS (
            SELECT node_id, node_id, makers FROM model
            UNION ALL
            SELECT u.node_id, p.node_id, p.makers
            FROM up u JOIN model m ON m.node_id = u.reached JOIN model p ON p.node_id = m.parent
            WHERE len(u.makers) = 0
        )
        SELECT node_id, makers FROM up WHERE len(makers) > 0
    """),
    ("model_lab", """
        SELECT DISTINCT x.node_id, coalesce(lo.lab, '(other)') AS lab
        FROM (SELECT node_id, unnest(makers) AS maker FROM model_maker) x
        LEFT JOIN lab_org lo ON lo.org_id = x.maker
    """),
    ("doc_model", """
        SELECT c.doc_id, m.node_id AS node_id
        FROM corpus c, unnest(c.annotations.model_roles.payload.models) AS u(m)
        WHERE m.roles.mentioned >= 1
        UNION ALL
        SELECT c.doc_id, x.node_id
        FROM corpus c, unnest(c.annotations.model_roles.payload.extra_models) AS u(x)
        WHERE x.roles.mentioned >= 1
    """),
    ("doc_model_labs", """
        SELECT dm.doc_id, list(DISTINCT coalesce(ml.lab, '(other)') ORDER BY coalesce(ml.lab, '(other)')) AS labs
        FROM doc_model dm LEFT JOIN model_lab ml ON ml.node_id = dm.node_id
        GROUP BY dm.doc_id
    """),

    # the lookup itself: the lab named in the sentences when exactly one is
    # named; otherwise the lab that makes every model the document names;
    # otherwise no lab. A tie to a lab by one of that lab's own documents is
    # dropped, because a suspicion is what another document says. For a tied
    # label the sentences that name the lab come first.
    ("suspicion_lab", """
        WITH tied AS (
            SELECT s.*,
                   CASE WHEN len(n.labs) = 1 THEN n.labs[1]
                        WHEN len(d.labs) = 1 AND d.labs[1] <> '(other)' THEN d.labs[1]
                   END AS lab0,
                   CASE WHEN len(n.labs) = 1 THEN 'sentence'
                        WHEN len(d.labs) = 1 AND d.labs[1] <> '(other)' THEN 'models'
                        ELSE 'unassigned'
                   END AS how0
            FROM suspicion s
            LEFT JOIN suspicion_named n ON n.doc_id = s.doc_id AND n.slug = s.slug
            LEFT JOIN doc_model_labs d ON d.doc_id = s.doc_id
        )
        SELECT t.doc_id, t.slug, t.level, t.grp, t.confirmed, t.unverified,
               CASE WHEN ld.doc_id IS NULL THEN t.lab0 END AS lab,
               CASE WHEN ld.doc_id IS NULL THEN t.how0 ELSE 'own_document' END AS how,
               CASE WHEN r.pattern IS NULL OR ld.doc_id IS NOT NULL THEN t.sentences
                    ELSE list_filter(t.sentences, lambda q: regexp_matches(q, r.pattern))
                         || list_filter(t.sentences, lambda q: NOT regexp_matches(q, r.pattern))
               END AS sentences
        FROM tied t
        LEFT JOIN lab_doc ld ON ld.lab = t.lab0 AND ld.doc_id = t.doc_id
        LEFT JOIN lab_regex r ON r.lab = t.lab0
    """),

    # the four evidence groups per lab and technique, one row per document:
    #   cards       a card document of the lab uses the technique or reports it in a deployment
    #   own         another document of the lab does the same
    #   suspected   another document suspects the lab uses it
    #   argues_not  another document argues the lab does not use it
    ("evidence", """
        SELECT ld.lab, l.slug, CASE WHEN ld.is_card THEN 'cards' ELSE 'own' END AS grp, l.doc_id,
               greatest(l.roles.used, l.roles.attested_use) AS level,
               l.roles.attested_use >= 1 AS attested, false AS confirmed,
               list_contains(l.flags, 'quote_unverified') AS unverified,
               NULL::VARCHAR AS how, l.sentences
        FROM label l JOIN lab_doc ld ON ld.doc_id = l.doc_id
        WHERE l.roles.used >= 1 OR l.roles.attested_use >= 1
        UNION ALL
        SELECT lab, slug, grp, doc_id, level, false, confirmed, unverified, how, sentences
        FROM suspicion_lab
        WHERE lab IS NOT NULL
    """),

    # one row per lab and technique that has any evidence: which groups it has
    ("cell", """
        SELECT lab, slug, bool_or(grp = 'cards') AS cards, bool_or(grp = 'own') AS own,
               bool_or(grp = 'suspected') AS suspected, bool_or(grp = 'argues_not') AS argues_not
        FROM evidence GROUP BY lab, slug
    """),
]

# Queries whose rows go into the summary file. :max_docs, :max_sentences and
# :top_n are replaced by the settings above.
OUTPUTS = {
    "techniques": """
        SELECT id, name, kind, definition, aliases, status FROM tech ORDER BY ord
    """,
    "layer_counts": """
        SELECT kind, count(*) AS n FROM tech GROUP BY kind
    """,
    # the taxonomy entries a technique is listed under: its parent technique and the groups that list it
    "tech_under": """
        SELECT child, list(name ORDER BY name) AS names FROM (
            SELECT gc.child_id AS child, g.name FROM tech_group_child gc JOIN tech_group g ON g.id = gc.group_id
            UNION
            SELECT t.id, p.name FROM tech t JOIN tech p ON p.id = t.parent
        ) GROUP BY child
    """,
    # per lab, technique and group: the number of documents, the highest
    # level, and the strongest documents with their sentences
    "evidence": """
        SELECT e.lab, e.slug, e.grp, count(*) AS n, max(e.level) AS level,
               count(*) FILTER (WHERE e.attested) AS n_attested,
               count(*) FILTER (WHERE e.confirmed) AS n_confirmed,
               count(*) FILTER (WHERE e.unverified) AS n_unverified,
               (list({'d': e.doc_id, 'l': e.level, 'a': e.attested, 'c': e.confirmed, 'u': e.unverified, 'h': e.how,
                      's': e.sentences[1:(:max_sentences)]}
                     ORDER BY e.level DESC, d.year DESC NULLS LAST, e.doc_id))[1:(:max_docs)] AS docs
        FROM evidence e JOIN doc d ON d.doc_id = e.doc_id
        GROUP BY e.lab, e.slug, e.grp
        ORDER BY e.lab, e.slug, e.grp
    """,
    # suspicions the lookup tied to no lab, per technique
    "unassigned": """
        SELECT s.slug, s.grp, count(*) AS n, max(s.level) AS level,
               count(*) FILTER (WHERE s.confirmed) AS n_confirmed,
               count(*) FILTER (WHERE s.unverified) AS n_unverified,
               (list({'d': s.doc_id, 'l': s.level, 'c': s.confirmed, 'u': s.unverified, 's': s.sentences[1:(:max_sentences)]}
                     ORDER BY s.level DESC, d.year DESC NULLS LAST, s.doc_id))[1:(:max_docs)] AS docs
        FROM suspicion_lab s JOIN doc d ON d.doc_id = s.doc_id
        WHERE s.lab IS NULL
        GROUP BY s.slug, s.grp
        ORDER BY s.slug, s.grp
    """,
    # how the lookup went, over all suspected-use labels on techniques
    "lookup": """
        SELECT grp, how, count(*) AS n FROM suspicion_lab GROUP BY grp, how ORDER BY grp, how
    """,
    # per lab: the number of techniques whose strongest evidence is each group,
    # the number with ghost matter, and the number a document argues are not used
    "lab_counts": """
        SELECT l.id AS lab,
               count(*) FILTER (WHERE c.cards) AS cards,
               count(*) FILTER (WHERE c.own AND NOT c.cards) AS own,
               count(*) FILTER (WHERE c.suspected AND NOT c.cards AND NOT c.own) AS suspected,
               (SELECT count(*) FROM tech) - count(*) FILTER (WHERE c.cards OR c.own OR c.suspected) AS none,
               count(*) FILTER (WHERE c.suspected AND NOT c.cards) AS ghost,
               count(*) FILTER (WHERE c.argues_not) AS argues_not
        FROM lab l LEFT JOIN cell c ON c.lab = l.id
        GROUP BY l.id
    """,
    # documents that name each technique, and how many of them have an organisation on record
    "tech_docs": """
        SELECT l.slug, count(*) AS n_docs, count(*) FILTER (WHERE len(d.org_ids) > 0) AS n_docs_org
        FROM label l JOIN doc d ON d.doc_id = l.doc_id
        GROUP BY l.slug
    """,
    "tech_years": """
        SELECT l.slug, d.year, count(*) AS n
        FROM label l JOIN doc d ON d.doc_id = l.doc_id
        WHERE d.year IS NOT NULL
        GROUP BY l.slug, d.year
        ORDER BY l.slug, d.year
    """,
    # organisations most often among the authors of the documents that name a
    # technique; an organisation counts under the top of its line of parents
    "tech_orgs": """
        SELECT slug, name, n FROM (
            SELECT x.slug, r.root_name AS name, count(DISTINCT x.doc_id) AS n,
                   row_number() OVER (PARTITION BY x.slug ORDER BY count(DISTINCT x.doc_id) DESC, r.root_name) AS rk
            FROM (SELECT l.slug, l.doc_id, unnest(d.org_ids) AS org_id FROM label l JOIN doc d ON d.doc_id = l.doc_id) x
            JOIN org_root r ON r.id = x.org_id
            GROUP BY x.slug, r.root_name
        ) WHERE rk <= :top_n
        ORDER BY slug, n DESC, name
    """,
    # models most often named in the documents that name a technique
    "tech_models": """
        SELECT slug, name, n FROM (
            SELECT l.slug, m.name, count(DISTINCT l.doc_id) AS n,
                   row_number() OVER (PARTITION BY l.slug ORDER BY count(DISTINCT l.doc_id) DESC, m.name) AS rk
            FROM label l JOIN doc_model dm ON dm.doc_id = l.doc_id
            JOIN model m ON m.node_id = dm.node_id
            GROUP BY l.slug, m.name
        ) WHERE rk <= :top_n
        ORDER BY slug, n DESC, name
    """,
    # dark matter: names in a lab's card documents that the taxonomy does not
    # hold. level is 0 when the card names the technique without saying it is used.
    "dark_matter": """
        SELECT ld.lab, x.name_as_written AS name, x.gloss, x.hint_technique AS hint, t.kind AS hint_kind,
               c.doc_id, greatest(x.roles.used, x.roles.attested_use) AS level,
               x.roles.attested_use >= 1 AS attested,
               ([q.text FOR q IN x.quotes])[1:(:max_sentences)] AS sentences
        FROM corpus c, unnest(c.annotations.safety_techniques.payload.extra_techniques) AS u(x)
        JOIN lab_doc ld ON ld.doc_id = c.doc_id AND ld.is_card
        LEFT JOIN tech t ON t.id = x.hint_technique
        ORDER BY ld.lab, level DESC, name
    """,
    # each lab's documents
    "lab_docs": """
        SELECT lab, count(*) FILTER (WHERE is_card) AS card_docs, count(*) FILTER (WHERE NOT is_card) AS own_docs
        FROM lab_doc GROUP BY lab
    """,
    "totals": """
        SELECT (SELECT count(*) FROM doc) AS documents,
               (SELECT count(DISTINCT doc_id) FROM label) AS documents_with_labels,
               (SELECT count(*) FROM label) AS labels,
               (SELECT count(*) FROM suspicion) AS suspected_use_labels,
               (SELECT count(*) FROM suspicion_lab WHERE lab IS NOT NULL) AS suspected_use_tied,
               (SELECT count(*) FROM label_all l JOIN tech_group g ON g.id = l.slug) AS labels_on_group_names,
               (SELECT count(*) FROM label_all l WHERE l.slug NOT IN (SELECT id FROM tech) AND l.slug NOT IN (SELECT id FROM tech_group)) AS labels_on_unknown_names
    """,
    "group_names": """
        SELECT name FROM tech_group ORDER BY name
    """,
    # settings that name a source or an organisation the release does not hold
    "settings_check": """
        SELECT 'source ' || lc.channel AS missing FROM lab_channel lc
        WHERE lc.channel NOT IN (SELECT unnest(channels) FROM doc)
        UNION ALL
        SELECT 'organisation ' || lr.org_id FROM lab_org_root lr WHERE lr.org_id NOT IN (SELECT id FROM org)
    """,
}

# --------------------------------------------------------------------------
# Reading the taxonomy files and the settings into tables
# --------------------------------------------------------------------------


def newest(release, family):
    """Path of the highest version of one taxonomy family listed in release.json."""
    entries = release["taxonomies"][family]
    best = max(entries, key=lambda e: tuple(int(p) for p in e["version"].split(".")))
    return best["path"], best["version"]


def maker_ids(entry):
    maker = entry.get("maker")
    if maker is None:
        return []
    if isinstance(maker, dict):
        maker = [maker]
    return [m["id"] if isinstance(m, dict) else m for m in maker]


def load_tables(con, folder, release):
    tech_path, tech_version = newest(release, "techniques")
    entries = yaml.safe_load((folder / tech_path).read_text())["entries"]
    con.execute("CREATE TABLE tech (ord INTEGER, id VARCHAR, name VARCHAR, kind VARCHAR, parent VARCHAR, "
                "definition VARCHAR, aliases VARCHAR[], status VARCHAR)")
    con.execute("CREATE TABLE tech_group (id VARCHAR, name VARCHAR)")
    con.execute("CREATE TABLE tech_group_child (group_id VARCHAR, child_id VARCHAR)")
    for i, e in enumerate(entries):
        if e["node"] == "technique":
            aliases = [a["text"] for a in e.get("aliases", []) if a.get("kind") != "legacy"]
            con.execute("INSERT INTO tech VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [i, e["id"], e["name"], e["kind"], e.get("parent"), e["definition"], aliases, e.get("status")])
        else:
            con.execute("INSERT INTO tech_group VALUES (?, ?)", [e["id"], e["name"]])
            for child in e.get("children", []):
                con.execute("INSERT INTO tech_group_child VALUES (?, ?)", [e["id"], child])

    org_path, _ = newest(release, "orgs")
    con.execute("CREATE TABLE org (id VARCHAR, name VARCHAR, parent VARCHAR)")
    con.executemany("INSERT INTO org VALUES (?, ?, ?)",
                    [[e["id"], e["name"], e.get("parent")] for e in yaml.safe_load((folder / org_path).read_text())["entries"]])

    model_path, _ = newest(release, "models")
    con.execute("CREATE TABLE model (node_id VARCHAR, name VARCHAR, parent VARCHAR, makers VARCHAR[])")
    con.executemany("INSERT INTO model VALUES (?, ?, ?, ?)",
                    [[e["id"], e["name"], e.get("parent"), maker_ids(e)]
                     for e in yaml.safe_load((folder / model_path).read_text())["entries"]])

    con.execute("CREATE TABLE lab (ord INTEGER, id VARCHAR, name VARCHAR)")
    con.execute("CREATE TABLE lab_channel (lab VARCHAR, channel VARCHAR, is_card BOOLEAN)")
    con.execute("CREATE TABLE lab_org_root (lab VARCHAR, org_id VARCHAR)")
    con.execute("CREATE TABLE lab_name (lab VARCHAR, name VARCHAR, versioned BOOLEAN)")
    con.execute("CREATE TABLE ignore_name (name VARCHAR)")
    con.execute("CREATE TABLE card_kind (kind VARCHAR)")
    for i, lab in enumerate(LABS):
        con.execute("INSERT INTO lab VALUES (?, ?, ?)", [i, lab["id"], lab["name"]])
        for ch in lab["card_channels"]:
            con.execute("INSERT INTO lab_channel VALUES (?, ?, true)", [lab["id"], ch])
        for ch in lab["own_channels"]:
            con.execute("INSERT INTO lab_channel VALUES (?, ?, false)", [lab["id"], ch])
        for org in lab["orgs"]:
            con.execute("INSERT INTO lab_org_root VALUES (?, ?)", [lab["id"], org])
        for name in lab["names"]:
            con.execute("INSERT INTO lab_name VALUES (?, ?, false)", [lab["id"], name])
        for name in lab["model_names"]:
            con.execute("INSERT INTO lab_name VALUES (?, ?, true)", [lab["id"], name])
    for name in IGNORE_NAMES:
        con.execute("INSERT INTO ignore_name VALUES (?)", [name])
    for kind in CARD_KINDS:
        con.execute("INSERT INTO card_kind VALUES (?)", [kind])
    return tech_version


def rows(con, sql):
    """Run one output query and return its rows as dictionaries."""
    sql = (sql.replace(":max_docs", str(MAX_DOCS)).replace(":max_sentences", str(MAX_SENTENCES))
              .replace(":top_n", str(TOP_N)))
    cur = con.execute(sql)
    names = [d[0] for d in cur.description]
    return [dict(zip(names, r)) for r in cur.fetchall()]


# --------------------------------------------------------------------------
# Main: run the queries and arrange their rows into the file
# --------------------------------------------------------------------------


def build(folder):
    release = json.loads((folder / "release.json").read_text())
    con = duckdb.connect()
    parquet = str(folder / "data" / "corpus.parquet").replace("'", "''")
    con.execute(f"CREATE VIEW corpus AS SELECT * FROM read_parquet('{parquet}')")
    tech_version = load_tables(con, folder, release)
    for name, sql in QUERIES:
        con.execute(f"CREATE TABLE {name} AS {sql}")
    out = {name: rows(con, sql) for name, sql in OUTPUTS.items()}
    for r in out["settings_check"]:
        print(f"warning: the settings name a {r['missing']} that this release does not hold", file=sys.stderr)

    used_docs = set()

    def keep(docs):
        used_docs.update(d["d"] for d in docs)
        return docs

    techs = out["techniques"]
    by_id = {t["id"]: t for t in techs}
    for t in techs:
        t.update(under=[], n_docs=0, n_docs_org=0, years=[], orgs=[], models=[], labs={}, unassigned={})
    for r in out["tech_under"]:
        by_id[r["child"]]["under"] = r["names"]
    for r in out["tech_docs"]:
        by_id[r["slug"]].update(n_docs=r["n_docs"], n_docs_org=r["n_docs_org"])
    for r in out["tech_years"]:
        by_id[r["slug"]]["years"].append([r["year"], r["n"]])
    for r in out["tech_orgs"]:
        by_id[r["slug"]]["orgs"].append([r["name"], r["n"]])
    for r in out["tech_models"]:
        by_id[r["slug"]]["models"].append([r["name"], r["n"]])
    for r in out["evidence"]:
        extra = "n_attested" if r["grp"] in ("cards", "own") else "n_confirmed"
        by_id[r["slug"]]["labs"].setdefault(r["lab"], {})[r["grp"]] = {
            "n": r["n"], "level": r["level"], extra: r[extra], "n_unverified": r["n_unverified"], "docs": keep(r["docs"])}
    for r in out["unassigned"]:
        by_id[r["slug"]]["unassigned"][r["grp"]] = {"n": r["n"], "level": r["level"], "n_confirmed": r["n_confirmed"],
                                                     "n_unverified": r["n_unverified"], "docs": keep(r["docs"])}

    lab_docs = {r["lab"]: r for r in out["lab_docs"]}
    lab_counts = {r.pop("lab"): r for r in out["lab_counts"]}
    labs = []
    for lab in LABS:
        dark = [{"name": r["name"], "gloss": r["gloss"], "hint": r["hint"], "kind": r["hint_kind"], "level": r["level"],
                 "attested": r["attested"], "d": r["doc_id"], "s": r["sentences"]}
                for r in out["dark_matter"] if r["lab"] == lab["id"]]
        used_docs.update(d["d"] for d in dark)
        ld = lab_docs.get(lab["id"], {"card_docs": 0, "own_docs": 0})
        labs.append({"id": lab["id"], "name": lab["name"], "card_docs": ld["card_docs"], "own_docs": ld["own_docs"],
                     "counts": lab_counts[lab["id"]], "dark_matter": dark})

    lookup = {}
    for r in out["lookup"]:
        lookup.setdefault(r["grp"], {})[r["how"]] = r["n"]

    placeholders = ", ".join("?" for _ in used_docs)
    docs = {r[0]: {"t": r[1], "u": r[2], "y": r[3], "k": r[4]} for r in con.execute(
        f"SELECT doc_id, title, url, year, kind FROM doc WHERE doc_id IN ({placeholders}) ORDER BY doc_id", sorted(used_docs)).fetchall()}

    totals = out["totals"][0]
    layer_n = {r["kind"]: r["n"] for r in out["layer_counts"]}
    fields = {"release": release["release_id"], "documents": f"{totals['documents']:,}", "taxonomy": tech_version,
              "suspicions": f"{totals['suspected_use_labels']:,}", "tied": f"{totals['suspected_use_tied']:,}",
              "untied": f"{totals['suspected_use_labels'] - totals['suspected_use_tied']:,}",
              "group_labels": f"{totals['labels_on_group_names']:,}",
              "group_example": " or ".join(g["name"] for g in out["group_names"][:2])}
    return {
        "format": 1,
        "release": dict({"id": release["release_id"], "created_at": release["created_at"], "repo": release.get("hf_repo"),
                         "taxonomy_version": tech_version}, **totals),
        "layers": [dict(layer, count=layer_n.get(layer["id"], 0)) for layer in LAYERS],
        "labs": labs,
        "lookup": lookup,
        "key": KEY,
        "notes": [n.format(**fields) for n in NOTES],
        "techniques": techs,
        "documents": docs,
    }


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    folder, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    summary = build(folder)
    text = json.dumps(summary, ensure_ascii=False, separators=(",", ":"))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "summary.json").write_text(text + "\n", encoding="utf-8")
    (out_dir / "summary.js").write_text("window.STACK_SUMMARY = " + text + ";\n", encoding="utf-8")
    print(f"release {summary['release']['id']}: {len(summary['techniques'])} techniques, {len(summary['labs'])} labs, "
          f"{len(summary['documents'])} documents referenced, {len(text) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
