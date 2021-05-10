module.exports = {
  graduate: {
    fn: function (text) {
      var positives = ["(?:alumna|alumnus)"];
      var re = new RegExp(positives.join('|'), 'gi');
      var suggestions = [];
      while (match = re.exec(text)) {
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }
      // let word; 
      // while ((word = re.exec(text)) !== null) {
      //   let msg = word[0];
      //   console.log(msg);
      // }
      return suggestions;
    },
    explanation: 'Please use "graduate" instead'
  },
    pilot: {
    fn: function (text) {
      var positives = ["air(?:m[ae]n|wom[ae]n)"];
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
    explanation: 'Use "pilots" instead'
  }
}