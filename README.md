# quality-docs

A CLI tool to check the quality of writing in your project's markdown or plain text documentation.

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

### Reports

The tool prints a report of writing quality issues with their location and description. For example, an issue in README.md from line 23 column 9 to line 23 column 16 prints;

```bash
README.md
  23:9-23:16   warning  Replace “utilize” with “use”
```

### Selectively Ignoring Checks

The checks in `quality-docs` have been carefully selected to improve the quality of your writing, and we don't recommend that you bypass them. In the event that you do need to make an exception, you can either [exclude documentation files from the glob argument](http://tldp.org/LDP/GNU-Linux-Tools-Summary/html/x11655.htm#STANDARD-WILDCARDS), or add [remark-message-control comments](https://github.com/wooorm/remark-message-control) to turn on/off specific checks for individual documents or text nodes. For example, adding `<!--lint ignore -->` before a node in a markdown file will turn off all checks for that node;

```markdown
<!--lint ignore -->
> So this is an incredibly dense and unnecessarily wordy quoted source that we would prefer not to lint.

> This node will be checked.
```

## Other Notes

This tool uses [retext](https://github.com/wooorm/retext) to check the quality of writing in your project's documentation using these plugins;

* [remark-lint](https://github.com/woorm/remark-lint) checks for proper markdown formatting.
* [retext-readability](https://github.com/woorm/retext-readability) checks the reading level of the whole document.
* [retext-simplify](https://github.com/woorm/retext-simplify) warns about over-complicated phrases.
* [retext-equality](https://github.com/woorm/retext-equality) warns about insensitive, inconsiderate language.
* [retext-intensify](https://github.com/woorm/retext-intensify) warns about filler words.
