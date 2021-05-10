module.exports = {
    lyHypen: {
        fn: function (text) {
            var re = /\s[^\s-]+ly-/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Don\'t hyphenate adverbs ending in -ly except where needed for clarity. https://developers.google.com/style/hyphens'
    },
}