# codeowners-automerge
Automerges PRs from code owners that only change owned files.


## Main usecase
You want CODEOWNERS to be able to self-merge PRs to files they are "owners" of.

The code owners could be external users of a public repo, or collaborators added
to a repo that has "Require a pull request before merging" enabled + "Require review from Code Owners".

This bot will check if all files changed in a given PR have the submitter as
their codeowner, and if so the PR will be merged automatically.

Note that if you have branch rules, you will need to give the bot a admin token
in order to be able to bypass rules:

```diff
- GITHUB_TOKEN = ${{ secrets.GITHUB_TOKEN }}
+ GITHUB_TOKEN = ${{ secrets.AUTOMERGE_TOKEN }}
```

>[!NOTE]
>The bot will use as source of truth the CODEOWNERS file at the latest commmit
>of the default branch. In other words a PR that modifies CODEOWNERS will not be
>able to hijack the bot.

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
      - name: Codeowners Automerge Check
        uses: kristoff-it/codeowners-automerge@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Supported options:

```yaml
- name: Codeowners automerge check
  uses: kristoff-it/codeowners-automerge@v1
  with:
    dir: ".github/"
    merge_method: 'merge' # 'merge' 'squash' 'rebase'
```







  
