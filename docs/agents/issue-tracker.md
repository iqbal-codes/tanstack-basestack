# Issue Tracker

Issues are tracked in **GitHub Issues** and managed with the `gh` CLI.

## Commands

| Action | Command |
|---|---|
| Create issue | `gh issue create --title "..." --body "..."` |
| List issues | `gh issue list --label "..." --state open` |
| View issue | `gh issue view <number>` |
| Add comment | `gh issue comment <number> --body "..."` |
| Add labels | `gh issue edit <number> --add-label "label1,label2"` |
| Remove labels | `gh issue edit <number> --remove-label "label1,label2"` |

## Notes

- No git remote is currently configured. Add one (`git remote add origin <url>`) before issue operations work.
- Authenticate with `gh auth login` if not already done.
- Use `--repo owner/repo` when running from a different directory.
