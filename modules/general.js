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
    optionalPlurals: {
        fn: function (text) {
            var re = /\b\w+\(s\)/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Don\'t use plurals in parentheses. If it\'s important in a specific context to indicate singular and plural, use \"one or more\". https://developers.google.com/style/plurals-parentheses'
    },
    ordinals: {
        fn: function (text) {
            var re = /\d+(?:st|nd|rd|th)/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Spell out all ordinal numbers in text. https://developers.google.com/style/numbers'
    },
    oxfordComma: {
        fn: function (text) {
            var re = /\w+, \w+ (?:and|or)/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'In a series of three or more items, use a comma before the final \"and\" or \"or\". https://developers.google.com/style/commas'
    },
    parentheses: {
        fn: function (text) {
            var re = /\(.+\)/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Don\'t put important information in parentheses if you can help it. https://developers.google.com/style/parentheses'
    },
    quotes: {
        fn: function (text) {
            var re = /"[^"]+"[.,?]/gi
            var suggestions = [];
            while (match = re.exec(text)) {
                suggestions.push({
                    index: match.index,
                    offset: match[0].length,
                });
            }
            return suggestions;
        },
        explanation: 'Commas and periods go inside quotation marks. https://developers.google.com/style/quotation-marks'
    },
    ranges: {
        fn: function (text) {
            var re = /(?:from|between)\s\d+\s?-\s?\d+/gi
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
        explanation: 'Don\'t add words such as \'from\' or \'between\' to describe a range of numbers. https://developers.google.com/style/hyphens'

    },
}