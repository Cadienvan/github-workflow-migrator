const { exec } = require('child_process');
const path = require('path');

async function run(config) {
  if (!config) {
    throw new Error('No config file or CLI options found');
  }

  if (!config.options.verbose) {
    console.log = () => { };
  }

  if(!config.sourcePath) {
    console.log('No source path provided. Trying to use the local .github folder');
  }

  if (['ssh', 'https'].indexOf(config.github.mode) === -1) {
    throw new Error('Invalid mode. Please use either ssh or https');
  }

  if (config.repositories.length === 0) {
    throw new Error('No repositories found. Please add at least one repository to the config.json file');
  }

  if (config.options.safeRun) {
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

  const migratorGithubFolder = config.sourcePath || path.join(__dirname, '.github');

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

  if (config.options.safeRun) {
    console.log('If all looks good, run the script again with --safe-run (or -s) flag to false');
  }

  function cloneRepo(repo) {
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

  function runNpmInstall(repo) {
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

  function runNpmTest(repo) {
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

  function copyGithubFolder(repo) {
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

  function addGithubFolder(repo) {
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

  function commitGithubFolder(repo) {
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

  function pushGithubFolder(repo) {
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
}

if (require.main === module) {
  run(require('./config-test.json'));
}

module.exports = run;