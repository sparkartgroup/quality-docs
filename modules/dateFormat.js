module.exports = {
   // TODO: add cases for other formats outlines in https://developers.google.com/style/dates-times
  dateFormatNumerical: {
    fn: function (text) {
      var re = /\d{1,2}(?:\.|\/)\d{1,2}(?:\.|\/)\d{4}/gi;
      var suggestions = [];
      while (match = re.exec(text)) {
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }
      return suggestions;
    },
    explanation: 'In general, spell out the names of months and days of the week in full. Give the full four-digit year, not a two-digit abbreviation. Use July 31, 2016 format. https://developers.google.com/style/dates-times'
  },
    dateFormat: {
    fn: function (text) {
      var re = /\d{1,2} (?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)|May|Jun(?:e)|Jul(?:y)|Aug(?:ust)|Sep(?:tember)?|Oct(?:ober)|Nov(?:ember)?|Dec(?:ember)?) \d{4}/gi;
      var suggestions = [];
      while (match = re.exec(text)) {
        suggestions.push({
          index: match.index,
          offset: match[0].length,
        });
      }

      return suggestions;
    },
    explanation: 'In general, spell out the names of months and days of the week in full. Give the full four-digit year, not a two-digit abbreviation. Use July 31, 2016 format. https://developers.google.com/style/dates-times'
  }
}