const CATIFY_CLASS = "catify"

let symbolCatsEnabled = false

const SYMBOL_PATTERNS = /M/g

const CAT_OFFSETS = {
  layerInset: "-0.15em -0.2em -0.05em -0.2em",
  eyeSize: "0.12em",
  mouthSize: "0.7em",
  eyeLeft: "0.38em",
  eyeRight: "0.38em",
  eyeTop: "0.85em",
  mouthLeft: "50%",
  mouthTop: "1.35em"
} as const

const CAT_DECORATION_STYLES = `
.catify {
  position: relative;
  display: inline;
  line-height: inherit;
  vertical-align: baseline;
  margin: 0;
  padding: 0;
}

.cat-glyph {
  position: relative;
  z-index: 1;
}

.cat-layer {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  inset: var(--cat-inset, ${CAT_OFFSETS.layerInset});
  overflow: visible;
}

.cat-eye {
  position: absolute;
  width: var(--cat-eye-size, ${CAT_OFFSETS.eyeSize});
  height: var(--cat-eye-size, ${CAT_OFFSETS.eyeSize});
  background: currentColor;
  border-radius: 50%;
}

.cat-mouth {
  position: absolute;
  font-size: var(--cat-mouth-size, ${CAT_OFFSETS.mouthSize});
  line-height: 1;
}

.catify .cat-eye-l {
  left: ${CAT_OFFSETS.eyeLeft};
  top: ${CAT_OFFSETS.eyeTop};
}

.catify .cat-eye-r {
  right: ${CAT_OFFSETS.eyeRight};
  top: ${CAT_OFFSETS.eyeTop};
}

.catify .cat-mouth {
  left: ${CAT_OFFSETS.mouthLeft};
  top: ${CAT_OFFSETS.mouthTop};
  transform: translateX(-50%) rotate(90deg);
}
`

function injectCatStyles(): void {
  if (document.getElementById("cat-decoration-styles")) return

  const styleEl = document.createElement("style")
  styleEl.id = "cat-decoration-styles"
  styleEl.textContent = CAT_DECORATION_STYLES
  document.head.appendChild(styleEl)
}

function removeCatStyles(): void {
  const styleEl = document.getElementById("cat-decoration-styles")
  if (styleEl) styleEl.remove()
}

function createCatWrapper(char: string): HTMLSpanElement {
  const wrapper = document.createElement("span")
  wrapper.className = CATIFY_CLASS

  const glyph = document.createElement("span")
  glyph.className = "cat-glyph"
  glyph.textContent = char

  const layer = document.createElement("span")
  layer.className = "cat-layer"
  layer.setAttribute("aria-hidden", "true")

  const eyeL = document.createElement("span")
  eyeL.className = "cat-eye cat-eye-l"

  const eyeR = document.createElement("span")
  eyeR.className = "cat-eye cat-eye-r"

  const mouth = document.createElement("span")
  mouth.className = "cat-mouth"
  mouth.textContent = "3"

  layer.appendChild(eyeL)
  layer.appendChild(eyeR)
  layer.appendChild(mouth)

  wrapper.appendChild(glyph)
  wrapper.appendChild(layer)

  return wrapper
}

function isInsideCatify(node: Node): boolean {
  return !!(node.parentElement?.closest(`.${CATIFY_CLASS}`))
}

function shouldSkipElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase()
  const skipTags = ["script", "style", "noscript", "meta", "title", "head", "code", "pre", "textarea", "input"]
  return skipTags.includes(tagName)
}

function processTextNodeForSymbols(textNode: Text): void {
  const text = textNode.textContent || ""
  if (!SYMBOL_PATTERNS.test(text)) return

  SYMBOL_PATTERNS.lastIndex = 0

  if (isInsideCatify(textNode)) return

  const parent = textNode.parentNode
  if (!parent) return

  const fragment = document.createDocumentFragment()
  let lastIndex = 0
  let match: RegExpExecArray | null

  SYMBOL_PATTERNS.lastIndex = 0
  while ((match = SYMBOL_PATTERNS.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
    }

    fragment.appendChild(createCatWrapper(match[0]))
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
  }

  parent.replaceChild(fragment, textNode)
}

function catifySymbolsInDocument(): void {
  if (!document.body) return

  injectCatStyles()

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT
        if (isInsideCatify(node)) return NodeFilter.FILTER_REJECT
        if (SYMBOL_PATTERNS.test(node.textContent || "")) {
          SYMBOL_PATTERNS.lastIndex = 0
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT
      }
    }
  )

  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  textNodes.forEach(processTextNodeForSymbols)
}

function uncatifySymbolsInDocument(): void {
  if (!document.body) return

  const catified = document.querySelectorAll(`.${CATIFY_CLASS}`)
  catified.forEach((wrapper) => {
    const glyph = wrapper.querySelector(".cat-glyph")
    if (glyph && wrapper.parentNode) {
      const textNode = document.createTextNode(glyph.textContent || "")
      wrapper.parentNode.replaceChild(textNode, wrapper)
    }
  })

  removeCatStyles()
}


let observer: MutationObserver | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function initObserver(): void {
  if (observer) {
    observer.disconnect()
  }

  observer = new MutationObserver((mutations) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
      const textNodesToProcess: Text[] = []

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element

              if (symbolCatsEnabled) {
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
                let textNode: Node | null
                while ((textNode = walker.nextNode())) {
                  if (SYMBOL_PATTERNS.test(textNode.textContent || "")) {
                    SYMBOL_PATTERNS.lastIndex = 0
                    textNodesToProcess.push(textNode as Text)
                  }
                }
              }
            }
          })
        }
      })

      textNodesToProcess.forEach(processTextNodeForSymbols)
    }, 50)
  })

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

function applySymbolCats(enabled: boolean): void {
  symbolCatsEnabled = enabled
  if (enabled) {
    catifySymbolsInDocument()
  } else {
    uncatifySymbolsInDocument()
  }
  initObserver()
}

if (typeof chrome !== "undefined" && chrome.storage && chrome.runtime) {
  chrome.storage.local.get(["symbolCatsEnabled"], (result) => {
    const symbolEnabled = result.symbolCatsEnabled ?? false

    const init = () => {
      applySymbolCats(symbolEnabled)
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init)
    } else {
      init()
    }
  })

  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (message.symbolCatsEnabled !== undefined) {
      applySymbolCats(message.symbolCatsEnabled)
      sendResponse({ success: true })
    }
    return true
  })
} else {
  const init = () => {
    applySymbolCats(false)
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
}
