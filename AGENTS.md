<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Owner backup ZIP: source files are snapshotted by the virtual:backup-sources vite plugin (base64, so env-replacement plugins don't rewrite contents); data/users/storage come from the owner-only getFullBackup server fn. Why: lets the owner restore the site elsewhere without Git access.
