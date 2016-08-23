#!/usr/bin/env node
const _ = require('lodash');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const concise = require('retext-intensify');
const control = require('remark-message-control');
const en_US = require('dictionary-en-us');
const equality = require('retext-equality');
const fs = require('fs');
const lint = require('remark-lint');
const map = require("async/map");
const meow = require('meow');
const path = require('path');
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
      -c, --config  A JSON config file to override default linting rules.
      -i, --ignore  A word or phrase to ignore and add to the config file's list.
      -s, --silent  Silent mode. Mutes warnings and only shows fatal errors.
      -v, --verbose Prints which config is used.

    Examples
      $ quality-docs --config custom-config.json
`, {
    alias: {
        c: 'config',
        i: 'ignore',
        s: 'silent',
        v: 'verbose'
    }
});

var silent = cli.flags.silent || false;

// Build array of files that match input glob
var docFiles = [];
cli.input.forEach((file) => { if (!file.includes('*')) docFiles.push(file); });
if (docFiles.length <= 0) {
  console.warn('No files found to lint.');
  process.exit(1);
}

// Use --config file if provided, otherwise defaults
var config = {};
var customConfig = {};
var defaultConfig = require('./default-config.json');

defaultConfig.dictionaries.forEach((dictPath, index, arr) => {
  arr[index] = path.join(__dirname, dictPath);
});


if (!cli.flags.config) {
  config = defaultConfig;
} else {
  customConfig = JSON.parse(fs.readFileSync(cli.flags.config, 'utf8'));

  // If --config and --ignore are specified, update the config with new ignore
  if (customConfig.ignore && cli.flags.ignore) {
    var isValidString = /^[ A-Za-z0-9_@./#&+-]*$/.test(cli.flags.ignore);
    var isUnique = !_.includes(customConfig.ignore, cli.flags.ignore);
    if (isValidString && isUnique) {
      customConfig.ignore.push(cli.flags.ignore);
      customConfig.ignore.sort();
      fs.writeFile(cli.flags.rules, JSON.stringify(rules, null, 2), function(err) {
        if(err) {
            return console.log(err);
        }
        console.log('Added \'' + cli.flags.ignore + '\' to ignore list. Don\'t forget to commit the changes to ' + cli.flags.config + '.');
      });
    } else {
      console.log('Could not add \'' + cli.flags.ignore + '\' to ignore list. Please add it manually.');
    }
  }

  // Convert dictionaries string to an array
  var customDict = customConfig.dictionaries;
  if (typeof customDict === 'string' || customDict instanceof String) {
    customConfig.dictionaries = [customDict];
  }

  // Add cwd to custom dictionary paths
  customConfig.dictionaries.forEach((dictionaryPath) => {
    dictionaryPath = process.cwd() + dictionaryPath;
  });

  // Merge default and custom rules, preferring customRules and concating arrays
  config = _.mergeWith(defaultConfig, customConfig, (objValue, srcValue)=>{
    if (_.isArray(objValue)) {
      return _.uniq(objValue.concat(srcValue));
    }
  });

}

var dictionary = en_US;

var myReadFile = function (dictPath, cb) {
  fs.readFile(dictPath, function (err, buffer) {
    cb(err, !err && buffer);
  });
}

if (config.dictionaries && config.dictionaries.length >= 1) {
  dictionary = function (cb) {
    en_US(function(err, primary) {
      map(config.dictionaries, myReadFile, function(err, results){
        results.unshift(primary.dic);
        var combinedDictionaries = Buffer.concat(results);
        cb(err, !err && {aff: primary.aff, dic: combinedDictionaries});
      });
    });
  }
}

var lintRules = _.mapValues(config.rules, (value)=>{
  var keys = Object.keys(value);
  if (_.isBoolean(value)) return value;
  if (value.hasOwnProperty('severity')) {
    if (Object.keys(value).length == 1) return true;
    var newValue = {};
    for (var prop in value) {
      if (prop !== 'severity') newValue[prop] = value[prop];
    }
    return newValue;
  }
  return value;
});
var fatalRules = _.keys(_.pickBy(config.rules, function(value) {
  return value.severity == 'fatal';
}));
var warnRules = _.keys(_.pickBy(config.rules, function(value) {
  return (value && (value.severity == 'warn' || !value.severity));
}));
var suggestRules = _.keys(_.pickBy(config.rules, function(value) {
  return value.severity == 'suggest';
}));
var readabilityConfig = config.rules['retext-readability'];
var ignoreWords = _.difference(config.ignore, config.noIgnore);

if (cli.flags.verbose) {
  console.log(chalk.red.underline('Fatal rules:\n'), chalk.red(fatalRules));
  console.log(chalk.yellow.underline('Warnings:\n'), chalk.yellow(warnRules));
  console.log(chalk.gray.underline('Suggestions:\n'), chalk.gray(suggestRules));
  console.log(chalk.green.underline('Ignoring:\n'), chalk.green(ignoreWords));
}

map(docFiles, toVFile.read, function(err, files){
  var hasErrors = false;

  map(files, checkFile, function(err, results) {
    console.log(report(err || results, {silent: silent}));

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
      .use(lint, lintRules || {})
      .use(remark2retext, retext() // Convert markdown to plain text
        .use(readability, readabilityConfig || {})
        .use(simplify, {ignore: ignoreWords || []})
        .use(equality, {ignore: ignoreWords || []})
        .use(concise, {ignore: ignoreWords || []})
        .use(function () {
          return function (tree) {
            visit(tree, 'WordNode', function (node, index, parent) {
              var word = toString(node);

              var unitArr = config.units || ['GB', 'MB', 'KB', 'K', 'am', 'pm', 'in', 'ft'];
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
          dictionary: dictionary,
          ignore: ignoreWords || [],
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
          var hasFatalRuleId = _.includes(fatalRules, message.ruleId);
          var hasFatalSource = _.includes(fatalRules, message.source);
          var hasSuggestedRuleId = _.includes(suggestRules, message.ruleId);
          var hasSuggestedSource = _.includes(suggestRules, message.source);

          if (suggestRules && (hasSuggestedRuleId || hasSuggestedSource)) {
            message.message = message.message.replace( /don\’t use “(.*)”/ig, (match, word) => {
              return 'Use “' +  word + '” sparingly';
            });
            delete message.fatal;
          }

          if (fatalRules && (hasFatalRuleId || hasFatalSource)) {
            message.fatal = true;
          }

          filteredMessages.push(message);
        });
        results.messages = filteredMessages;
        cb(null, results);
      });
   }
});
