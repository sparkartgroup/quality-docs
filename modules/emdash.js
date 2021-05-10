module.exports = {
    emdash: {
        fn: function (text) {
            var re = /\s[—–]\s/gi;
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Don\'t put a space before or after an em dash. https://developers.google.com/style/dashes'
    }
}