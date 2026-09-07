# Zed character sheet

Source for the editable Zed character sheet in Claude Design. Each
`*.dc.html` is one artboard (character sheet, sizes, expressions) and
`canvas.json` lays them out. Colours and eye proportions are tweak chips
on each artboard; each artboard has its own set, so change all three to
keep them in step.

The live, editable canvas is a claude.ai artifact (link in the team's
notes). Edits saved there do not flow back here on their own: when the
team settles on new values, copy them into `src/zed/Zed.tsx`, which is
the production source of truth, and update the defaults in these files
so the two stay aligned.

These files use the same Design Components format as the
`0g-builders-branding` repo.
