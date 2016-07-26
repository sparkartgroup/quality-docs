# quality-docs
A CLI tool to evaluate the quality of writing in your project's documentation.

## Installation
Install the tool globally with npm to use the CLI.
```
npm install -g quality-docs
```

## Usage
The CLI accepts one argument which is a glob of the documentation files you want to check. For example;
```
quality-docs **/*.md
```

## Other Notes
This tool uses [retext](https://github.com/wooorm/retext) along with selected plugins to evaluate the quality of writing in your project's documentation.
