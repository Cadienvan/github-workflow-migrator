#! /usr/bin/env node
const program = require('commander');
const { version } = require('../package.json');
const run = require('../index.js');

program
  .version(version)
  .option('-h, --help', 'Help')
  // Config file
  .option('-cnf, --config <path>', 'Path to a config json file. If provided, all other options will be ignored. See the config.example.json file at https://github.com/Cadienvan/github-workflow-migrator/blob/main/config.example.json for more details.')
  // Github
  .option('-gu, --github-user <user>', 'Github user (user:password or token for https)')
  .option('-gm, --github-mode <mode>', 'Github mode (ssh or https)', 'ssh')
  // Options
  .option('-i, --install', 'Run npm install', false)
  .option('-t, --test', 'Run npm test', false)
  .option('-cm, --commit', 'If not passed, no git commands will be executed on the repositories.', true)
  .option('-v, --verbose', 'Verbose output', true)
  // Repositories
  .option('-rp, --repositories <repos>', 'List of repositories to process. Comma separated.', '')
  // Custom Url
  .option('-cu, --custom-url <url>', 'Custom url to clone the repositories. Use {{username}} and {{repo}} as placeholders.')
  // Folder
  .option('-f, --folder <path>', 'Path to the folder where the repositories will be cloned', '.')
  // Commands
  .option('-ci, --commands-install <command>', 'Command to run npm install', 'npm install')
  .option('-ct, --commands-test <command>', 'Command to run npm test', 'npm test')

  .parse(process.argv);

const opts = program.opts();

if (opts.help) {
  program.outputHelp();
  process.exit(0);
}

const config = opts.config ? require(opts.config) :
  {
    github: {
      user: opts.githubUser,
      mode: opts.githubMode,
    },
    options: {
      install: opts.install || false,
      test: opts.test || false,
      safeRun: opts.commit ? false : true,
      verbose: opts.verbose || true,
    },
    repositories: opts.repositories.split(',').map(repo => repo.trim()) || [],
    customUrl: opts.customUrl || undefined,
    folder: opts.folder || '.',
    commands: {
      install: opts.commandsInstall || 'npm install',
      test: opts.commandsTest || 'npm test',
    },
  };

run(config);