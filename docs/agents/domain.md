# Domain Docs

This is a single-context repo. Engineering skills should use one project-wide domain glossary.

## Before exploring

Read `docs/CONTEXT.md` before investigating code, writing tests, or proposing architecture changes. It defines the project language for concepts such as `Board`, `Move`, `Player`, `Stone`, `WinLine`, `Difficulty`, and `AIMove`.

If `docs/adr/` exists, read ADRs that touch the area being changed. If it does not exist, proceed silently.

## Layout

```text
/
├── docs/
│   ├── CONTEXT.md
│   ├── agents/
│   │   ├── domain.md
│   │   ├── issue-tracker.md
│   │   └── triage-labels.md
│   └── adr/
└── js/
```

## Vocabulary rule

When naming tests, issues, hypotheses, or refactor proposals, prefer the terms from `docs/CONTEXT.md`. If a needed concept is missing, note the gap instead of inventing a competing term.
