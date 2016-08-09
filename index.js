#!/usr/bin/env node
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const concise = require('retext-intensify');
const control = require('remark-message-control');
const en_US = require('dictionary-en-us');
const sparkart_dict = require('dictionary-sparkart');
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
        r: 'rules',
        i: 'ignore'
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

var ignore = cli.flags.ignore;

// If --rules and --ignore are specified, update the rules with new ignore
if (rules.ignore && ignore) {
  var isValidString = /^[ A-Za-z0-9_@./#&+-]*$/.test(ignore);
  var isUnique = !_.includes(rules.ignore, ignore);
  if (isValidString && isUnique) {
    rules.ignore.push(ignore);
    rules.ignore.sort();
    fs.writeFile(cli.flags.rules, JSON.stringify(rules, null, 2), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log('Added \'' + ignore + '\' to ignore list. Don\'t forget to commit the changes to ' + cli.flags.rules + '.');
    });
  } else {
    console.log('Could not add \'' + ignore + '\' to ignore list. Please add it manually.');
  }
}

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
            visit(tree, 'WordNode', function (node, index, parent) {
              var word = toString(node);

              var unitArr = rules.units || ['GB', 'MB', 'KB', 'K', 'am', 'pm', 'in', 'ft'];
              unitArr = unitArr.concat(['-', 'x']); // Add ranges and dimensions to RegExp
              var units = unitArr.join('|');

              // Ignore email addresses and the following types of non-words:
              // 500GB, 8am-6pm, 10-11am, 1024x768, 3x5in, etc
              var unitFilter = new RegExp('^\\d+(' + units + ')+\\d*(' + units + ')*$','i');
              var emailFilter = new RegExp('^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$', 'i');
              if (emailFilter.test(word) || unitFilter.test(word)) {
                parent.children[index] = {
                  type: 'SourceNode',
                  value: word,
                  position: node.position
                };
              }

            });
          };
        })
        .use(spell, {
          dictionary: [en_US, sparkart_dict],
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
          var hasFatalRuleId = _.includes(rules.fatal, message.ruleId);
          var hasFatalSource = _.includes(rules.fatal, message.source);
          if (rules.fatal && (hasFatalRuleId || hasFatalSource)) {
            message.fatal = true;
          }
          filteredMessages.push(message);
        });
        results.messages = filteredMessages;
        cb(null, results);
      });
   }
});
