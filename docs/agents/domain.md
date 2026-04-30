# Domain Docs

## Layout

**Single-context** — one `CONTEXT.md` at the repo root and `docs/adr/` for architectural decision records.

## Consumer rules

When skills read domain documentation, they expect:

1. `CONTEXT.md` (repo root) — the project's domain language, ubiquitous vocabulary, key concepts, and architectural boundaries.
2. `docs/adr/` (repo root) — architectural decision records in numbered markdown files (e.g. `001-use-tanstack-start.md`).

## Notes

- Neither `CONTEXT.md` nor `docs/adr/` currently exist. They should be created as the project's domain model crystallizes.
- ADRs should be short, dated, and describe the context, decision, and consequences.
