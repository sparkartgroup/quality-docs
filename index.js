#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2));
var concise = require('retext-intensify');
var equality = require('retext-equality');
var fs = require('fs');
var lint = require('remark-lint');
var map = require("async/map");
var readability = require('retext-readability');
var remark = require('remark');
var remark2retext = require('remark-retext');
var report = require('vfile-reporter');
var retext = require('retext');
var simplify = require('retext-simplify');
var toVFile = require('to-vfile');

// Build array of files that match input glob
var docFiles = [];
argv._.forEach((file) => { if (!file.includes('*')) docFiles.push(file); });
if (docFiles.length <= 0) {
  throw new Error('No documentation files found. Please check glob argument.');
}

map(docFiles, toVFile.read, function(err, files){
  var allResults = [];
  var hasErrors = false;
  files.forEach((file) => {
    remark()
      .use(lint, {
        maximumLineLength: false,
        listItemIndent: false
      })
      .use(remark2retext, retext() // Convert markdown to plain text
        .use(readability, {age: 18, minWords: 7}) // Target age is low so that understanding requires less effort
        .use(simplify) // Check for unneccesary complexity
        .use(equality) // Check for inconsiderate language
        .use(concise) // Check for filler words to make writing more concise
      )
      .process(file, function (err, results) {

        // Remove warnings about hedge and weasel words
        var filteredMessages = [];
        results.messages.forEach((message) => {
          if (!/(hedge|weasel)/gi.test(message.ruleId)) {
            filteredMessages.push(message);
          }
        });
        results.messages = filteredMessages;

        allResults.push(results);
      });
  });

  console.log(report(err || allResults));

  allResults.forEach((result) => {
    if (result.messages.length >= 1) hasErrors = true;
  });

  if (hasErrors) throw new Error('Readability checks found issues.');
});
