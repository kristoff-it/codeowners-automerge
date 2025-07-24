# codeowners-automerge
Automerges PRs from code owners that only change owned files.


## Main usecase
You have a repository where you force all contributors to send changes via PRs,
but you would like for users listed in CODEOWNERS to be able to self-merge PRs
that only modify files that they "own" (i.e. that they are listed as codeowners
for).

GitHub allows you to restrict PRs to require a CODEOWNER review before the PR
can be merged, but this does not work when a path has a single owner, as the PR
submitter cannot review their own PR.

This bot will check if all files changed in a given PR have the submitter as
their codeowner, and if so the PR will be merged automatically.

>[!NOTE]
>The bot will use as source of truth the CODEOWNERS file at the commit the PR is
>based on. In other words a PR that modifies CODEOWNERS will not be able to hijack
>the bot.

## Usage

1. Setup [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) and restrict user's write access to the repo as needed.
2. Add a workflow that uses this Action. If you have other jobs, you might
   want to have the automerge job depend on their success.

Example workflow:

```yaml
name: Codeowners Automerge
on:
  pull_request_target: { types: [opened, synchronize] }

jobs:
  codeowners-automerge:
    runs-on: ubuntu-latest
    # needs: [other-check1, other-check2]
    permissions:
      pull-requests: write
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Codeowners automerge check
        uses: kristoff-it/codeowners-automerge@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Supported options:

```yaml
- name: Codeowners automerge check
  uses: kristoff-it/codeowners-automerge@v1
  with:
    cwd: ".github/"
    merge_method: 'merge' # 'merge' 'squash' 'rebase'
```







  
