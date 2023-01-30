# What is it?

This is a tool to migrate GitHub Actions workflows from one repository to another/multiple repositories.  

# How to use it?

## Prerequisites

-   [Node.js](https://nodejs.org/en/) (>= 10.0.0)

## Installation

```bash
npm install -g github-workflow-migrator
```

## Npx
You can simply execute the migrator via `npx`:

```bash
npx github-workflow-migrator -cnf ./config.json
```


## Usage

### Help

This command will provide you a list of all available options.

```bash
npx github-workflow-migrator -h
```
### All options

```bash
npx github-workflow-migrator -gu Cadienvan -gm ssh -i -t -cm -v -rp 'abc,def,ghi' -cu "customurl" -f "foldercustom" -ci "npm install custom" -ct "npm test custom"
```

### Simple usage

```bash
npx github-workflow-migrator -cnf ./config.json
```

## Configuration

Please, look at the [config.example.json](https://github.com/Cadienvan/github-workflow-migrator/blob/main/config.example.json) file.

# License

MIT

# Contributions

Contributions are welcome! Feel free to open an issue or a pull request.