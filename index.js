const { exec } = require('child_process');
const path = require('path');
const config = require('./config.json');

console.log(config)

if (!config.options.verbose) {
  console.log = () => { };
}

if (['ssh', 'https'].indexOf(config.github.mode) === -1) {
  throw new Error('Invalid mode. Please use either ssh or https');
}

if (config.repositories.length === 0) {
  throw new Error('No repositories found. Please add at least one repository to the config.json file');
}

if (config.safeRun) {
  console.log('Safe run enabled. No changes will be made to the repositories');
}

let repoBaseUrl;
if (config.customUrl) {
  repoBaseUrl = config.customUrl.replace('{{username}}', config.github.username);
} else {
  if (config.mode === 'ssh') {
    repoBaseUrl = `git@github.com:${config.github.username}/{{repo}}.git`;
  } else {
    repoBaseUrl = `https://github.com/${config.github.username}/{{repo}}.git`;
  }
}

const migratorGithubFolder = path.join(__dirname, '.github');

const cloneRepo = (repo) => {
  return new Promise((resolve, reject) => {
    console.log(`git clone ${repoBaseUrl.replace('{{repo}}', repo)} ${config.folder}/${repo}`);
    exec(`git clone ${repoBaseUrl.replace('{{repo}}', repo)} ${config.folder}/${repo}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const runNpmInstall = (repo) => {
  const installCommand = config.commands.install || 'npm install';
  return new Promise((resolve, reject) => {
    console.log(config.folder, ' >> ', installCommand);
    exec(installCommand, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const runNpmTest = (repo) => {
  const testCommand = config.commands.test || 'npm test';
  console.log(config.folder, ' >> ', testCommand);
  return new Promise((resolve, reject) => {
    exec(testCommand, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const copyGithubFolder = (repo) => {
  console.log(config.folder, ' >> ', `cp -r ${migratorGithubFolder} ./${repo}/.github`);
  return new Promise((resolve, reject) => {
    exec(`cp -r ${migratorGithubFolder} ./${repo}/.github`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const addGithubFolder = (repo) => {
  console.log(config.folder, ' >> ', `git add --all`)
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
  console.log(config.folder, ' >> ', `git commit -m "ci: Added Github Folder"`)
  return new Promise((resolve, reject) => {
    exec(`git commit -m "ci: Added Github Folder"`, { cwd: config.folder }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

const pushGithubFolder = (repo) => {
  console.log(config.folder, ' >> ', `git push`)
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
    console.log('Processing repo: ', repo)
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
(async () => {
  await run();
})();