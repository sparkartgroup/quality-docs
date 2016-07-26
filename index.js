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

var docFiles = argv._;

var getFiles = (filePath, cb) => {
  fs.readFile(filePath, 'utf-8', (err, contents) => {
    cb(null, {name: filePath, contents: contents});
  });
};

map(docFiles, getFiles, function(err, files){
  var allResults = [];
  var hasErrors = false;
  files.forEach((file) => {
    remark()
      .use(lint, {
        'maximum-line-length': false,
        'list-item-indent': false
      })
      .use(remark2retext, retext() // Convert markdown to plain text
        .use(readability, {age: 18, minWords: 7}) // Target age is low so that understanding requires less effort
        .use(simplify) // Check for unneccesary complexity
        .use(equality) // Check for inconsiderate language
        .use(concise, {ignore: ['about']}) // Check for filler words to make writing more concise
      )
      .process(file.contents, function (err, results) {
        results.filename = file.name;
        allResults.push(results);
      });
  });

  console.log(report(err || allResults));

  allResults.forEach((result) => {
    if (result.messages.length >= 1) hasErrors = true;
  });

  if (hasErrors) throw new Error('Readability checks found issues.');
});
