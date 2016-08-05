#!/usr/bin/env node
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const concise = require('retext-intensify');
const control = require('remark-message-control');
const dictionary = require('dictionary-en-us');
const equality = require('retext-equality');
const fs = require('fs');
const lint = require('remark-lint');
const map = require("async/map");
const meow = require('meow');
const readability = require('retext-readability');
const remark = require('remark');
const remark2retext = require('remark-retext');
const report = require('vfile-reporter');
const retext = require('retext');
const simplify = require('retext-simplify');
const spell = require('retext-spell');
const toString = require('nlcst-to-string');
const toVFile = require('to-vfile');
const visit = require('unist-util-visit');

const cli = meow(`
    Usage
      $ quality-docs <glob>

    Options
      -r, --rules  A JSON file to override default linting rules.

    Examples
      $ quality-docs --rules docStyle.json
`, {
    alias: {
        r: 'rules'
    }
});

// Build array of files that match input glob
var docFiles = [];
cli.input.forEach((file) => { if (!file.includes('*')) docFiles.push(file); });
if (docFiles.length <= 0) {
  console.warn('No files found to lint.');
  process.exit(1);
}

// Use --rules file if provided, otherwise defaults
var rules = cli.flags.rules ? JSON.parse(
  fs.readFileSync(cli.flags.rules, 'utf8')
) : {};

map(docFiles, toVFile.read, function(err, files){
  var hasErrors = false;

  map(files, checkFile, function(err, results) {
    console.log(report(err || results));

    // Check for errors and exit with error code if found
    results.forEach((result) => {
      result.messages.forEach((message) => {
        if (message.fatal) hasErrors = true;
      });
    });
    if (hasErrors) process.exit(1);

  })

  function checkFile(file, cb) {
    remark()
      .use(lint, rules.lint || {})
      .use(remark2retext, retext() // Convert markdown to plain text
        .use(readability, rules.readability  || {})
        .use(simplify, {ignore: rules.ignore || []})
        .use(equality, {ignore: rules.ignore || []})
        .use(concise, {ignore: rules.ignore || []})
        .use(function () {
          return function (tree) {
            visit(tree, 'WordNode', function (node) {
              var word = toString(node);
              // Temporary workaround to remove ending punctuation marks from
              // words before checks https://github.com/wooorm/nlcst/issues/4
              if (node.children[node.children.length - 1].type == 'PunctuationNode') {
                node.children.pop();
              }
            });
          };
        })
        .use(spell, {
          dictionary: dictionary,
          ignore: rules.ignore || [],
          ignoreLiteral: true
        })
      )
      .use(control, {name: 'quality-docs', source: [
        'remark-lint',
        'retext-readability',
        'retext-simplify',
        'retext-equality',
        'retext-intensify'
      ]})
      .process(file, function (err, results) {
        var filteredMessages = [];
        results.messages.forEach((message) => {
          // Make equality and simplify rules easier to flag as fatal
          if (/(equality|simplify)/.test(message.source)) {
            message.ruleId = message.source;
          }
          if (rules.fatal && _.includes(rules.fatal, message.ruleId)) {
            message.fatal = true;
          }
          filteredMessages.push(message);
        });
        results.messages = filteredMessages;
        cb(null, results);
      });
   }
});
