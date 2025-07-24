const { context, getOctokit } = require('@actions/github');
const core = require('@actions/core');
const ignore = require('ignore');

require('source-map-support').install();

async function main() {
  const octokit = getOctokit(process.env.GITHUB_TOKEN);
  const pr = context.payload.pull_request;
  const repo_details = { owner: context.repo.owner, repo: context.repo.repo };
  
  const submitter = context.payload.sender.login;
  core.info(`submitter = ${submitter}`);
  
  if (submitter !== repo_details.owner) {
    const response = await octokit.rest.repos.checkCollaborator(
      { ...repo_details, username: submitter }
    );

    if (response.status != 204) {
      // 204 collaborator, 404 not collaborator
      core.info("submitter is not a collaborator, bailing!");
      return;
    };
  }
  
  const rules_promise = parseCodeRules(octokit, repo_details);
  const changes_promise = getChanges(octokit, pr.number, repo_details);
  const rules = await rules_promise;
  const changes = await changes_promise;
  const all_matches = matchFiles(submitter, rules, changes);

  core.info(`all file changes matched = ${all_matches}`)
  if (!all_matches) return;
  
  await octokit.rest.pulls.merge({
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name,
    pull_number: pr.number,
    sha: pr.head.sha,
    merge_method: core.getInput("merge_method") || "merge",
  });
}

async function parseCodeRules(octokit, repo_details) {
  const dir = core.getInput("dir") || ".github/";
  
  let src;
  try {
    const response = await octokit.rest.repos.getContent({
      ...repo_details,
      path: dir + "CODEOWNERS",
    });

    src = Buffer.from(
      response.data.content,
      response.data.encoding
    ).toString();

  } catch (error) {
    core.error(error);
    core.info(`Error trying to find CODEOWNERS file. Please set cwd properly. (cwd = '${dir}')`);
    return;
  }

  const lines = src.split(/\r\n|\r|\n/);
  let rules = [];
  for (const line of lines) {
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      const [pathString, ...usernames] = line.split(/\s+/);

      rules.push({
        path: pathString,
        usernames,
        matcher: ignore().add(pathString),
      });
    }

  return rules.reverse();
}

async function getChanges(octokit, pr_number, repo_details) {
  const options = octokit.rest.pulls.listFiles.endpoint.merge({
      ...repo_details,
      pull_number: pr_number,
  });

  const files = await octokit.paginate(options);
  const fileStrings = files.map((f) => f.filename);
  return fileStrings;
}



function matchFiles(submitter, rules, changes) {
  file_label: for (let file of changes) {
    for (let rule of rules) {
      core.info(`matching '${file}' against rule '${rule.path}'`);
      if (rule.matcher.ignores(file)) {
        core.info(`glob match success`);
        for (let owner of rule.usernames) {
          if (owner.startsWith('@')) owner = owner.slice(1);
          core.info(`matching user '${owner}' with '${submitter}'`);
          if (owner == submitter) continue file_label;
        }
        return false;
      }
      core.info(`glob match failure`);
    }
    return false;
  }
  return true;
}

process.on("uncaughtException", function (err) {
  core.setFailed(err.message);
  console.error(new Date().toUTCString() + " uncaughtException:", err.message);
  console.error(err.stack);
  process.exit(1);
});

main();
