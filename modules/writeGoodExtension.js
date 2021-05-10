module.exports = {
  voldemort: {
    fn: function (text) {
      var positives = ['Tom Riddle', 'Voldemort']
      var re = new RegExp('\\b(' + positives.join('|') + ')\\b', 'gi');
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