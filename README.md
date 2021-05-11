# `quality-docs-fork`

Fork of [`Quality Docs`](https://github.com/sparkartgroup/quality-docs), a CLI tool to check the quality of writing in your project's markdown or plain text documentation.

[`Unified`](https://github.com/unifiedjs/unified) - interface for parsing, inspecting, transforming, and serializing content through syntax trees.

This tool uses [`retext`](https://github.com/wooorm/retext) to check the quality of writing in your project's documentation using these plugins;

- [`retext-equality`](https://github.com/wooorm/retext-equality) warns on insensitive, inconsiderate language.
- [`retext-intensify`](https://github.com/wooorm/retext-intensify) warns on filler, weasel and hedge words.
- [`remark-lint`](https://github.com/wooorm/remark-lint) checks for proper markdown formatting.
- [`retext-readability`](https://github.com/wooorm/retext-readability) checks the reading level of the whole document.
- [`retext-simplify`](https://github.com/wooorm/retext-simplify) warns on complicated phrases.
- [`retext-spell`](https://github.com/wooorm/retext-spell) checks spelling against a US English dictionary and [custom dictionary](#custom-dictionary).
- [`write-good`](https://github.com/btford/write-good)
- [`remark-validate-links`](https://github.com/remarkjs/remark-validate-links) validates that Markdown links and images reference existing local files and headings.
