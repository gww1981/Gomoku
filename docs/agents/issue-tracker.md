# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues in `gww1981/Gomoku`. Use the `gh` CLI for issue operations.

## Conventions

- Create an issue: `gh issue create --title "..." --body "..."`
- Read an issue: `gh issue view <number> --comments`
- List issues: `gh issue list --state open --json number,title,body,labels,comments`
- Comment on an issue: `gh issue comment <number> --body "..."`
- Apply labels: `gh issue edit <number> --add-label "..."`
- Remove labels: `gh issue edit <number> --remove-label "..."`
- Close an issue: `gh issue close <number> --comment "..."`

Run these commands from inside this repository so `gh` can infer the repo from `origin`.

## Publishing work

When a skill says "publish to the issue tracker", create a GitHub issue in this repo.

When a skill says "fetch the relevant ticket", use `gh issue view <number> --comments`.
