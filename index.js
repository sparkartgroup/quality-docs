var fs = require('fs');
var glob = require('glob-fs')({ gitignore: true });
var map = require("async/map");
var remark = require('remark');
var retext = require('retext');
var readability = require('retext-readability');
var remark2retext = require('remark-retext');
var report = require('vfile-reporter');

var getFiles = (filePath, cb) => {
  fs.readFile(filePath, 'utf-8', (err, contents) => {
    cb(null, {name: filePath, contents: contents});
  });
};

glob.readdir('**/*.md', function (err, files) {
  map(files, getFiles, function(err, files){
    var allResults = [];
    var hasErrors = false;
    files.forEach((file) => {
      remark()
        .use(remark2retext, retext().use(readability))
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
});
