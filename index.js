// Create a node script which takes an array of github repos and, for each, does the following:
// 1. Download repo
// 2. Run npm install
// 3. Run npm test
// 4. If tests pass, copy the content of the .github folder inside the repo to a folder called .github in the root of the project
// 5. If tests fail, console.log it
// 6. git add, commit and push the .github folder to the repo with the message "ci: Added Node CI"

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

if (['ssh', 'https'].indexOf(config.mode) === -1) {
  throw new Error('Invalid mode. Please use either ssh or https');
}
let repobaseUrl;
if (config.customUrl) {
  repoBaseUrl = config.customUrl.replace('{{username}}', config.github_username);
} else {
  if (config.mode === 'ssh') {
    repoBaseUrl = `git@github.com:${config.github_username}/{{repo}}.git`;
  } else {
    repoBaseUrl = `https://github.com/${config.github_username}/{{repo}}.git`;
  }
}

const githubFolder = path.join(__dirname, '.github');

const cloneRepo = (repo) => {
  return new Promise((resolve, reject) => {
    console.log('Cloning repo: ', repo);
    exec(`git clone ${repoBaseUrl.replace('{{repo}}', repo)} ${config.folder}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const runNpmInstall = (repo) => {
  return new Promise((resolve, reject) => {
    console.log('Running npm install', repo);
    exec(`npm install`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const runNpmTest = (repo) => {
  console.log('Running npm test', repo);
  return new Promise((resolve, reject) => {
    exec(`npm test`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const copyGithubFolder = (repo) => {
  console.log('Copying github folder', repo);
  return new Promise((resolve, reject) => {
    exec(`cp -r ${githubFolder} ./${repo}`, { cwd: path.join(__dirname) }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const addGithubFolder = (repo) => {
  console.log('Adding github folder', repo);
  return new Promise((resolve, reject) => {
    exec(`git add --all`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const commitGithubFolder = (repo) => {
  console.log('Committing github folder', repo);
  return new Promise((resolve, reject) => {
    exec(`git commit -m "ci: Added Node CI"`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const pushGithubFolder = (repo) => {
  console.log('Pushing github folder', repo);
  return new Promise((resolve, reject) => {
    exec(`git push`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const run = async () => {
  for (const repo of config.repositories) {
    try {
      await cloneRepo(repo);
      await copyGithubFolder(repo);
      if (config.options.install)
        await runNpmInstall(repo);
      if (config.options.test)
        await runNpmTest(repo);
      if (!config.options.safeRun) {
        await addGithubFolder(repo);
        await commitGithubFolder(repo);
        await pushGithubFolder(repo);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

run();