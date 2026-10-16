# Third-party notices

## web_sanitize test vectors

The `"spec"` group in [`knowledge/evidence/sanitizer/cases.lua`](knowledge/evidence/sanitizer/cases.lua), and its echo in `ws_results.json` next to it, contains short test strings and expected outputs taken from the spec and README of [leafo/web_sanitize](https://github.com/leafo/web_sanitize) at commit `1ca8317`. They are used under the MIT License:

```
MIT License

Copyright (c) 2022 Leaf Corcoran

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The library itself is not included; the tools clone it at that commit.

## itch.io

This project is independent and is not affiliated with, endorsed by or sponsored by itch.io or itch corp. "itch.io" is used only to name the platform the knowledge base describes.

- **Selector names.** Class names, ids, element structure and CSS custom-property names of itch.io pages (for example `#wrapper`, `.user_page`, `--itchio_link_color`) are cited so that creators' CSS can target them. They describe an interface; no itch.io stylesheet, script or page export is included.
- **Quotations.** Short passages from itch.io's documentation, staff posts and served pages are quoted as evidence, each with its source.
- **Other creators.** Statistics and short original descriptions of public pages are recorded instead of their CSS or HTML. Small creators are pseudonymized as `creator-NN`; see the knowledge base's Appendix.

## Probe and test payloads

The live-probe payloads, local tests and fixtures under `knowledge/` were written for this project. The two `.woff2` files under `knowledge/tests/m/` are 75-byte placeholders, not fonts.
