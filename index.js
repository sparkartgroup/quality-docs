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
// const lint = require('remark-lint-maximum-line-length');
// const lint = require('remark-cli');
// const lint = require('remark-preset-lint-markdown-style-guide');
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
const googGuide = require('retext-google-styleguide');
const validateLinks = require('remark-validate-links')

// writeGood modules
const writeGood = require('remark-lint-write-good');
const writeGoodExtension = require('./modules/writeGoodExtension.js');
const firstPerson = require('./modules/firstPerson.js');
const genderBias = require('./modules/genderBias.js');
const dateFormat = require('./modules/dateFormat.js');
const ellipses = require('./modules/ellipses.js');
const emdash = require('./modules/emdash.js');
const exclamation = require('./modules/exclamation.js');
const general = require('./modules/general.js');


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
cli.input.forEach((file) => {
  if (!file.includes('*')) docFiles.push(file);
});
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
      fs.writeFile(cli.flags.rules, JSON.stringify(rules, null, 2), function (err) {
        if (err) {
          return console.log(err);
        }
        console.log('Added \'' + cli.flags.ignore + '\' to ignore list. Don\'t forget to commit the changes to ' + cli.flags.config + '.');
      });
    } else {
      console.log('Could not add \'' + cli.flags.ignore + '\' to ignore list. Please add it manually.');
    }
  }

  // If custom dictionaries are provided, prepare their paths
  if (customConfig.dictionaries) {
    // Convert dictionaries string to an array
    var customDict = customConfig.dictionaries;
    if (typeof customDict === 'string' || customDict instanceof String) {
      customConfig.dictionaries = [customDict];
    }

    // Add cwd to custom dictionary paths
    customConfig.dictionaries.forEach((dictionaryPath) => {
      dictionaryPath = process.cwd() + dictionaryPath;
    });
  } else {
    // Remove empty dictonaries key so it doesn't override default config
    delete customConfig.dictionaries;
  }

  // Merge default and custom rules, preferring customRules and concating arrays
  config = _.mergeWith(defaultConfig, customConfig, (objValue, srcValue) => {
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
    en_US(function (err, primary) {
      map(config.dictionaries, myReadFile, function (err, results) {
        results.unshift(primary.dic);
        var combinedDictionaries = Buffer.concat(results);
        cb(err, !err && {
          aff: primary.aff,
          dic: combinedDictionaries
        });
      });
    });
  }
}

var lintRules = _.mapValues(config.rules, (value) => {
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


var fatalRules = _.keys(_.pickBy(config.rules, function (value) {
  return value.severity == 'fatal';
}));

var warnRules = _.keys(_.pickBy(config.rules, function (value) {
  return (value && (value.severity == 'warn' || !value.severity));
}));

var suggestRules = _.keys(_.pickBy(config.rules, function (value) {
  return value.severity == 'suggest';
}));

const linterRules = [
  require('remark-lint'),

  // http://www.cirosantilli.com/markdown-style-guide/#file-extension
  [require('remark-lint-file-extension'), 'md'],

  // http://www.cirosantilli.com/markdown-style-guide/#file-name
  require('remark-lint-no-file-name-mixed-case'),
  require('remark-lint-no-file-name-articles'),
  require('remark-lint-no-file-name-irregular-characters'),
  require('remark-lint-no-file-name-consecutive-dashes'),
  require('remark-lint-no-file-name-outer-dashes'),

  // http://www.cirosantilli.com/markdown-style-guide/#newlines
  // http://www.cirosantilli.com/markdown-style-guide/#empty-lines-around-lists
  // http://www.cirosantilli.com/markdown-style-guide/#tables
  require('remark-lint-no-consecutive-blank-lines'),

  // http://www.cirosantilli.com/markdown-style-guide/#spaces-after-sentences.
  // Not enforced, cannot be done properly without false positives, if you
  // want this, use remark-retext and retext-sentence-spacing.

  // http://www.cirosantilli.com/markdown-style-guide/#line-wrapping
  [require('remark-lint-maximum-line-length'), 60],

  // http://www.cirosantilli.com/markdown-style-guide/#dollar-signs-in-shell-code
  require('remark-lint-no-shell-dollars'),

  // http://www.cirosantilli.com/markdown-style-guide/#what-to-mark-as-code.
  // This is a tip, not a rule.

  // http://www.cirosantilli.com/markdown-style-guide/#spelling-and-grammar.
  // Spelling is not in the scope of remark-lint.  If you want this,
  // use remark-retext and retext-spell.

  // http://www.cirosantilli.com/markdown-style-guide/#line-breaks
  require('remark-lint-hard-break-spaces'),

  // http://www.cirosantilli.com/markdown-style-guide/#headers
  [require('remark-lint-heading-style'), 'atx'],
  require('remark-lint-heading-increment'),
  require('remark-lint-no-duplicate-headings'),

  // http://www.cirosantilli.com/markdown-style-guide/#top-level-header
  require('remark-lint-no-multiple-toplevel-headings'),

  // http://www.cirosantilli.com/markdown-style-guide/#header-case.
  // Heading case isn’t tested yet: new rules to fix this are ok though!

  // http://www.cirosantilli.com/markdown-style-guide/#end-of-a-header.
  // Cannot be checked?

  // http://www.cirosantilli.com/markdown-style-guide/#header-length
  require('remark-lint-maximum-heading-length'),

  // http://www.cirosantilli.com/markdown-style-guide/#punctuation-at-the-end-of-headers
  [require('remark-lint-no-heading-punctuation'), ':.'],

  // http://www.cirosantilli.com/markdown-style-guide/#header-synonyms.
  // Cannot be checked?

  // http://www.cirosantilli.com/markdown-style-guide/#blockquotes
  [require('remark-lint-blockquote-indentation'), 2],
  require('remark-lint-no-blockquote-without-marker'),

  // http://www.cirosantilli.com/markdown-style-guide/#unordered
  [require('remark-lint-unordered-list-marker-style'), '-'],

  // http://www.cirosantilli.com/markdown-style-guide/#ordered
  [require('remark-lint-ordered-list-marker-style'), '.'],
  [require('remark-lint-ordered-list-marker-value'), 'one'],

  // http://www.cirosantilli.com/markdown-style-guide/#spaces-after-list-marker
  [require('remark-lint-list-item-indent'), 'mixed'],

  // http://www.cirosantilli.com/markdown-style-guide/#indentation-of-content-inside-lists
  require('remark-lint-list-item-content-indent'),

  // http://www.cirosantilli.com/markdown-style-guide/#empty-lines-inside-lists
  require('remark-lint-list-item-spacing'),

  // http://www.cirosantilli.com/markdown-style-guide/#case-of-first-letter-of-list-item
  // Not checked.

  // http://www.cirosantilli.com/markdown-style-guide/#punctuation-at-the-end-of-list-items.
  // Not checked.

  // http://www.cirosantilli.com/markdown-style-guide/#definition-lists.
  // Not checked.

  // http://www.cirosantilli.com/markdown-style-guide/#code-blocks
  [require('remark-lint-code-block-style'), 'fenced'],
  [require('remark-lint-fenced-code-flag'), {
    allowEmpty: false
  }],
  [require('remark-lint-fenced-code-marker'), '`'],

  // http://www.cirosantilli.com/markdown-style-guide/#horizontal-rules
  [require('remark-lint-rule-style'), '---'],

  // http://www.cirosantilli.com/markdown-style-guide/#tables
  require('remark-lint-no-table-indentation'),
  require('remark-lint-table-pipes'),
  require('remark-lint-table-pipe-alignment'),
  [require('remark-lint-table-cell-padding'), 'padded'],

  // http://www.cirosantilli.com/markdown-style-guide/#separate-consecutive-elements.
  // Not checked.

  // http://www.cirosantilli.com/markdown-style-guide/#span-elements
  require('remark-lint-no-inline-padding'),

  // http://www.cirosantilli.com/markdown-style-guide/#reference-style-links
  require('remark-lint-no-shortcut-reference-image'),
  require('remark-lint-no-shortcut-reference-link'),
  require('remark-lint-final-definition'),
  require('remark-lint-definition-case'),
  require('remark-lint-definition-spacing'),

  // http://www.cirosantilli.com/markdown-style-guide/#single-or-double-quote-titles
  [require('remark-lint-link-title-style'), '"'],

  // http://www.cirosantilli.com/markdown-style-guide/#bold
  [require('remark-lint-strong-marker'), '*'],

  // http://www.cirosantilli.com/markdown-style-guide/#italic
  [require('remark-lint-emphasis-marker'), '*'],

  // http://www.cirosantilli.com/markdown-style-guide/#uppercase-for-emphasis.
  // Not checked.

  // http://www.cirosantilli.com/markdown-style-guide/#emphasis-vs-headers
  require('remark-lint-no-emphasis-as-heading'),

  // http://www.cirosantilli.com/markdown-style-guide/#automatic-links-without-angle-brackets
  require('remark-lint-no-literal-urls'),

  // http://www.cirosantilli.com/markdown-style-guide/#content-of-automatic-links
  require('remark-lint-no-auto-link-without-protocol')

  // http://www.cirosantilli.com/markdown-style-guide/#email-automatic-links.
  // Not checked.)
];

var readabilityConfig = config.rules['retext-readability'];

var ignoreWords = _.difference(config.ignore, config.noIgnore);

console.log(ignoreWords)

if (cli.flags.verbose) {
  console.log(chalk.red.underline('Fatal rules:\n'), chalk.red(fatalRules));
  console.log(chalk.yellow.underline('Warnings:\n'), chalk.yellow(warnRules));
  console.log(chalk.gray.underline('Suggestions:\n'), chalk.gray(suggestRules));
  console.log(chalk.green.underline('Ignoring:\n'), chalk.green(ignoreWords));
}

map(docFiles, toVFile.read, function (err, files) {
  var hasErrors = false;

  map(files, checkFile, function (err, results) {
    console.log(report(err || results, {
      silent: silent
    }));

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
      // .use(linterRules)
      // TODO: import all writeGood modules at once
      // TODO: is visit working with remark-lint-write-good?      
      .use(writeGood, {
        checks: genderBias
      })
      .use(writeGood, {
        checks: firstPerson
      })
      .use(writeGood, {
        checks: dateFormat
      })
      .use(writeGood, {
        checks: ellipses
      })
      .use(writeGood, {
        checks: emdash
      })
      .use(writeGood, {
        checks: exclamation
      })
      .use(writeGood, {
        checks: general
      })
      .use(validateLinks, {})
      .use(remark2retext, retext() // Convert markdown to plain text
        // .use(readability, readabilityConfig || {})
        // .use(simplify, {ignore: ignoreWords || []})
        // .use(equality, {ignore: ignoreWords || []})
        // .use(concise, {ignore: ignoreWords || []})

        .use(function () {
          return function (tree) {
            visit(tree, 'WordNode', function (node, index, parent) {
              var word = toString(node);
              var unitArr = config.units || ['GB', 'MB', 'KB', 'K', 'am', 'pm', 'in', 'ft'];
              unitArr = unitArr.concat(['-', 'x']); // Add ranges and dimensions to RegExp
              var units = unitArr.join('|');
              // Ignore email addresses and the following types of non-words:
              // 500GB, 8am-6pm, 10-11am, 1024x768, 3x5in, etc
              var unitFilter = new RegExp('^\\d+(' + units + ')+\\d*(' + units + ')*$', 'i');
              var emailFilter = new RegExp('^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$', 'i');
              // Ignore URLs:
              var urlFilter = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
              if (emailFilter.test(word) || unitFilter.test(word) || urlFilter.test(word)) {
                parent.children[index] = {
                  type: 'SourceNode',
                  value: word,
                  position: node.position
                };
              }

            });
          };
        })
        .use(googGuide, {
          ignore: ignoreWords || []
        })
        .use(spell, {
          dictionary: dictionary,
          ignore: ignoreWords || [],
          ignoreLiteral: true
        })
      )
      .use(control, {
        name: 'quality-docs',
        source: [
          'remark-lint',
          'remark-line-write-good',
          'retext-readability',
          'retext-simplify',
          'retext-equality',
          'retext-intensify',
          'retext-google-styleguide'
        ]
      })
      .process(file, function (err, results) {
        var filteredMessages = [];
        results.messages.forEach((message) => {
          var hasFatalRuleId = _.includes(fatalRules, message.ruleId);
          var hasFatalSource = _.includes(fatalRules, message.source);
          var hasSuggestedRuleId = _.includes(suggestRules, message.ruleId);
          var hasSuggestedSource = _.includes(suggestRules, message.source);

          if (suggestRules && (hasSuggestedRuleId || hasSuggestedSource)) {
            message.message = message.message.replace(/don\’t use “(.*)”/ig, (match, word) => {
              return 'Use “' + word + '” sparingly';
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