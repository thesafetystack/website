# The summary file

`build_summary.py` reads one release of the dataset and writes `summary.json`.
The page reads that one file and nothing else. `summary.js` holds the same
content as a script, so that the page also opens from disk, where a browser
refuses to fetch a JSON file.

    python build_summary.py <release folder> <output folder>

All counting is done by the DuckDB queries in the script. The settings block at
the top of the script says which sources, organisations and names count as
which lab. Two runs on the same release give the same file.

## Contents

`format` is 1.

`release` holds the release date (`id`), the techniques taxonomy version and
these counts: `documents` (all documents in the release), `labels` and
`documents_with_labels` (labels on techniques, and the documents that carry
one), `suspected_use_labels` and `suspected_use_tied` (labels of suspected use
on techniques, and how many of them the script tied to a lab),
`labels_on_group_names` (labels on the taxonomy's group names, which are not
techniques and are left out of everything else), and
`labels_on_unknown_names` (labels whose name the taxonomy file does not hold).

`layers` lists the three layers of the stack from top to bottom
(interventions, monitoring, assessments, from the taxonomy's `kind` field) with
the number of techniques in each and a one-sentence `definition`. The taxonomy
does not define its three kinds, so the definitions are written in the
script's settings.

`labs` lists the labs in the order of the settings block. Each lab has its
`id` and `name`, the number of its card documents (`card_docs`) and of its
other documents (`own_docs`), `counts`, and `dark_matter`. `counts` holds the
number of techniques whose strongest evidence is `cards`, `own` or
`suspected`, the number with none of the three (`none`), the number that
another document suspects and the lab's cards do not state (`ghost`), and the
number that a document argues the lab does not use (`argues_not`).
`dark_matter` lists the technique names in the lab's card documents that are
not in the taxonomy, each with the gloss, the document, the sentences and the
`level`, which is 0 when the card names the technique without saying it is
used.

`techniques` lists the 234 techniques in the order in which the page stacks
them, which is the order of the taxonomy file. Each technique has `id`, `name`,
`kind`, `definition`, `aliases`, `under` (the names of the taxonomy entries it
is listed under: its parent technique and the groups that list it), `n_docs`
(documents that name it, dated or not), `n_docs_org` (how many of those have an
organisation on record), `years` (dated documents per year), `orgs` (the
organisations most often among the authors, each counted under the top of its
line of parent organisations), `models` (the models most often named in those
documents), and `labs`.

`techniques[].labs[<lab id>]` holds the evidence that ties the technique to the
lab, in up to four groups.

- `cards`: a card document of the lab uses the technique or reports it in a
  deployment.
- `own`: another document of the lab does the same.
- `suspected`: a document that is not the lab's own suspects that the lab uses
  it.
- `argues_not`: a document that is not the lab's own argues that the lab does
  not use it.

Each group has `n` (the number of documents), `level` (the highest level, 1 to
4, which is the prominence of the statement in the document and not a
confidence), `n_attested` or `n_confirmed`, `n_unverified`, and `docs`: the five
strongest documents. Each document has `d` (document id), `l` (level), `s` (up
to two evidence sentences, word for word from the dataset; for a suspicion the
sentences that name the lab come first), `a` (true when the document reports
the technique in a deployment), `c` (true when a suspicion relays an official
statement), `u` (true when the dataset did not find the label's sentences in
the document's text) and `h` (how a suspicion was tied to the lab: `sentence`
or `models`).

`techniques[].unassigned` holds the suspicions about the technique that are
tied to no lab, in the same form.

`lookup` counts how the labels of suspected use were handled: tied by a name in
the evidence sentences (`sentence`), tied by the models the document names
(`models`), tied to no lab (`unassigned`), or dropped because the document
belongs to the lab it would be tied to (`own_document`).

`documents` maps each document id used above to its title (`t`), address
(`u`), year (`y`) and kind (`k`).

`key` is the text of the page's key, and `notes` holds the line at the foot
of the page that names the release.

## Rules the script applies

A lab's own documents are those from its sources and those with one of its
organisations among the author affiliations. Its card documents are those from
its card sources, and its other documents that the dataset's labelling read as
a system card or a model card.

A technique counts as used in a document when the label's level for `used` or
`attested_use` is 1 or more.

A label of suspected use (`suspected_use` at level 1 or more) is tied to a lab
in two steps. First, the lab whose name, or whose model's name, is in the
label's evidence sentences, when exactly one lab is named there. Otherwise,
the lab that makes every model the document names, when there is exactly one
such lab; a model the models taxonomy does not hold counts as made by none of
the labs, and named derivatives of a model are not counted. Otherwise the label
is tied to no lab. A tie to a lab by one of that lab's own documents is
dropped. A label marked `claims_absent` goes to `argues_not`; every other one
goes to `suspected`.

Labels on the taxonomy's group names are left out.
