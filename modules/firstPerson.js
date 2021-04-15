module.exports = {
  voldemort: {
    fn: function (text) {
      var positives = ["(?:^|\\s)I\\s","(?:^|\\s)I,\\s","\\bI'm\\b","\\bme\\b","\\bmy\\b","\\bmine\\b"];
      // var re = new RegExp('\\b(' + positives.join('|') + ')\\b', 'gi');
      var re = new RegExp(positives.join('|'), 'gi');
      console.log(re)
      var suggestions = [];
      while (match = re.exec(text)) {
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }      
      return suggestions;
    },
    explanation: 'You must not name Him-Who-Must-Not-Be-Named'
  }
}