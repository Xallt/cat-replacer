---
name: Cat Symbol Decorator Extension
overview: "Chrome extension using Plasmo that decorates Σ/∑/M with cat faces using a glyph+overlay layer structure. For M: the peaks ARE the ears, eyes sit OUTSIDE the peaks, mouth below the valley. For Σ: eyes on outer sides, mouth offset from thickest stroke. Uses real DOM elements (not pseudo-elements) for precise control."
todos:
  - id: setup-plasmo
    content: Initialize Plasmo project with npm create plasmo and configure TypeScript
    status: completed
  - id: content-script
    content: Implement content script with text-node splitting and glyph+layer wrapper structure
    status: completed
    dependencies:
      - setup-plasmo
  - id: css-decorations
    content: Create CSS with cat-layer overlay, CSS variables for tuning, and em+percent positioning
    status: completed
    dependencies:
      - setup-plasmo
  - id: mutation-observer
    content: Add debounced MutationObserver to handle dynamically loaded content
    status: completed
    dependencies:
      - content-script
  - id: prevent-double-wrap
    content: Use node.parentElement.closest('.catify') check before wrapping
    status: completed
    dependencies:
      - content-script
---

# Cat Symbol Decorator Chrome Extension

## Architecture Overview

The extension uses Plasmo's MV3 structure with a content script that:

1. Scans the DOM for target symbols (Σ, ∑, M)
2. Wraps them in a **glyph + overlay layer** structure (not pseudo-elements)
3. Uses real DOM elements for eyes/mouth for precise positioning control
4. Observes DOM mutations with debouncing for dynamic content

## Project Structure

```javascript
cat-replacer/
├── package.json
├── tsconfig.json
├── contents/
│   └── catify.ts         # Content script (Plasmo convention)
├── styles/
│   └── catify.css        # Cat decoration styles
└── assets/
    └── icon.png
```



## DOM Wrapper Structure

Each symbol gets wrapped like this:

```html
<span class="catify catify-m">
  <span class="cat-glyph">M</span>
  <span class="cat-layer" aria-hidden="true">
    <span class="cat-eye cat-eye-l"></span>
    <span class="cat-eye cat-eye-r"></span>
    <span class="cat-mouth">3</span>
  </span>
</span>
```

Key principles:

- `cat-glyph`: the original character, unchanged, z-index: 1
- `cat-layer`: absolute-positioned overlay spanning the glyph box, z-index: 2
- Eyes and mouth are **real elements** (not pseudo-elements) for fine-tuned offsets
- No separate ear elements needed — the M peaks / Σ corners ARE the ears

## Implementation Details

### 1. Content Script (`contents/catify.ts`)

- Walk DOM tree using TreeWalker to find text nodes
- Split text nodes around target symbols (Σ, ∑, M)
- Build wrapper using DocumentFragment with glyph+layer structure
- Skip `<script>`, `<style>`, `<code>`, `<pre>` tags
- Skip wrapping inside `<a>`, `<button>`, `<input>` (configurable)
- Prevent double-wrapping: check `node.parentElement?.closest('.catify')` before touching
- Debounced MutationObserver for dynamic content

### 2. CSS Styling (`styles/catify.css`)

**Base structure:**

```css
.catify {
  position: relative;
  display: inline-block;
  line-height: 1;
}
.cat-glyph { position: relative; z-index: 1; }
.cat-layer {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  inset: var(--cat-inset, -0.15em -0.2em -0.05em -0.2em);
}
```

**Eyes:** Small circles using `border-radius: 50%`, `background: currentColor`**Mouth:** The "3" character, absolutely positioned, `transform: translate(-50%, 0)`**For M — `.catify-m`:**

- The two peaks ARE the ears (no extra elements)
- Eyes sit OUTSIDE the peaks (left eye left of left peak, right eye right of right peak)
- Eyes positioned slightly below cap height
- Mouth "3" sits BELOW the valley (not overlapping M strokes)
- Example: `left: 0.12em; top: 0.18em` for left eye, `left: 50%; top: 0.78em` for mouth

**For Σ — `.catify-sigma`:**

- The top/bottom angles ARE the ears
- Eyes on the outer sides (upper third and lower third)
- Mouth offset away from thickest stroke

**CSS Variables for tuning:**

- `--cat-inset`: overlay box expansion
- `--cat-eye-size`: eye dot size
- `--cat-mouth-size`: mouth font size

### 3. Plasmo Configuration

- Manifest V3 handled by Plasmo
- Content script runs on all URLs
- CSS injected via Plasmo's content CSS system

## Key Technical Decisions

- **Real elements over pseudo-elements**: Allows precise per-element positioning without collision
- **Glyph + layer separation**: Prevents line-height weirdness and text selection issues
- **em + percent positioning**: `%` anchors to wrapper box, `em` scales with font size
- **Expanded overlay box**: Eyes/ears often need space outside the glyph bounds
- **Debounced MutationObserver**: Prevents performance issues on large DOM changes

## Edge Cases Handled (MVP)

- Basic text nodes in paragraphs, headings, lists
- Dynamically loaded content via MutationObserver
- Prevents double-wrapping via `.closest()` check
- Skips script/style/code tags
- Skips interactive elements (links, buttons)

## Future Enhancements (Post-MVP)

- MathJax/KaTeX support (different DOM structure)
- Per-font calibration via `getBoundingClientRect()` measurement
- Options page to toggle symbols, adjust positions