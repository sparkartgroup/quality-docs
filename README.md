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

### Options

#### Rules

The `-r`, `--rules` flag passes in a JSON file to override default linting rules.

```bash
quality-docs {,**/}*.md --rules sample-rules-override.json
```

The override uses this format (without comments):

```js
{
  "lint": { // Options for remark-lint rules
    "list-item-indent": false
  },
  "readability": { // Options for remark-readability
    "minWords": 7
  },
  "ignore": [ // Words and phrases to ignore
    "address",
    "function",
    "host",
    "submit"
  ],
  "fatal": [ // Rules to mark as fatal errors
    "equality",
    "no-tabs",
    "simplify"
  ]
}
```

See [sample-rules-override.json](./sample-rules-override.json) for an example.

### Reports

The tool prints a report of writing quality issues with their location and description. For example, a warning in README.md from line 23 column 9 to line 23 column 16 prints;

```bash
README.md
  23:9-23:16   warning  Replace “utilize” with “use”
```

### Changing Default Rules

`quality-docs` ships with an opinionated set of rules to improve your writing and we recommend  you use the defaults. If you want to make an exception, you have three options;

1. [Exclude documentation files from the glob argument](http://tldp.org/LDP/GNU-Linux-Tools-Summary/html/x11655.htm#STANDARD-WILDCARDS).
2. Use the `--rules` flag to pass in a JSON file with overrides. See [sample-rules-override.json](./sample-rules-override.json).
3. Use [remark-message-control marks](https://github.com/wooorm/remark-message-control) to turn on/off specific rules for individual documents or text nodes.

## Other Notes

This tool uses [retext](https://github.com/wooorm/retext) to check the quality of writing in your project's documentation using these plugins;

* [remark-lint](https://github.com/woorm/remark-lint) checks for proper markdown formatting.
* [retext-readability](https://github.com/woorm/retext-readability) checks the reading level of the whole document.
* [retext-simplify](https://github.com/woorm/retext-simplify) warns on over-complicated phrases.
* [retext-equality](https://github.com/woorm/retext-equality) warns on insensitive, inconsiderate language.
* [retext-intensify](https://github.com/woorm/retext-intensify) warns on filler, weasel and hedge words.
