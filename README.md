# quality-docs

A CLI tool to check the quality of writing in your project's documentation.

## Installation

Install the tool globally with npm to use the CLI.

```bash
npm install -g quality-docs
```

## Usage

The CLI accepts one argument which is a glob of the documentation files you want to check. For example, to recursively check every `.md` file in your project;

```bash
quality-docs {,**/}*.md
```

The tool prints a report of writing quality issues with their location and description. For example, an issue in README.md from line 23 column 9 to line 23 column 16 prints;

```bash
README.md
  23:9-23:16   warning  Replace “utilize” with “use”
```

## Other Notes

This tool uses [retext](https://github.com/wooorm/retext) to check the quality of writing in your project's documentation.
