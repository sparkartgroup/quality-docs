module.exports = {
  graduate: {
    fn: function (text) {
      var positives = ["(?:alumna|alumnus)"];
      // var re = new RegExp('\\b(' + positives.join('|') + ')\\b', 'gi');
      var re = new RegExp(positives.join('|'), 'gi');
      // console.log(re)

      var suggestions = [];
      // console.log(re.exec(text))
      while (match = re.exec(text)) {
        // console.log(match[0])
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }
      // console.log(match)

      return suggestions;
    },
    explanation: 'Please use "graduate" instead'
  },
    pilot: {
    fn: function (text) {
      var positives = ["air(?:m[ae]n|wom[ae]n)"];
      // var re = new RegExp('\\b(' + positives.join('|') + ')\\b', 'gi');
      var re = new RegExp(positives.join('|'), 'gi');
      // console.log(re)

      var suggestions = [];
      // console.log(re.exec(text))
      while (match = re.exec(text)) {
        // console.log(match[0])
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }
      // console.log(match)

      return suggestions;
    },
    explanation: 'Use "pilots" instead'
  }
}