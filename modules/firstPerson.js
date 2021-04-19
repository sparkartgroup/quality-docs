module.exports = {
  firstPerson: {
    fn: function (text) {
      var positives = ["(?:^|\\s)I\\s","(?:^|\\s)I,\\s","\\bI'm\\b","\\bme\\b","\\bmy\\b","\\bmine\\b"];
      var re = new RegExp(positives.join('|'), 'gi');
      var suggestions = [];
      while (match = re.exec(text)) {
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }

      return suggestions;
    },
    explanation: 'Try not to use first-person language'
  }
}