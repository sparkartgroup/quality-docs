module.exports = {
    exclamation: {
        fn: function (text) {
            var re = /\w!(?:\s|$)/gi;
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Don\'t use exclamation points in text except when they\'re part of a code example. https://developers.google.com/style/exclamation-points'
    }
}