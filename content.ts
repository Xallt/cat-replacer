const DATA_ATTR_ORIGINAL = "data-cat-original"

const CAT_STYLES = {
  ascii: "ᓚᘏᗢ",
  cute1: "ᓚ₍ ^. .^₎",
  cute2: " ꐑ՞•ﻌ•՞ꐑ"
} as const

type CatStyle = keyof typeof CAT_STYLES

let currentStyle: CatStyle | null = null

function replaceTextWithCats(text: string, style: CatStyle | null): string {
  if (style === null) {
    return text
  }

  if (style === "ascii") {
    const catChars = CAT_STYLES.ascii
    let catIndex = 0
    return text
      .split("")
      .map((char) => {
        if (/\s/.test(char)) {
          return char
        }
        const catChar = catChars[catIndex % catChars.length]
        catIndex++
        return catChar
      })
      .join("")
  }

  if (style === "cute1" || style === "cute2") {
    const catFace = CAT_STYLES[style]
    return text
      .split(/(\s+)/)
      .map((part) => {
        if (/\s/.test(part)) {
          return part
        }
        if (part.trim().length === 0) {
          return part
        }
        return catFace
      })
      .join("")
  }

  return text
}

function storeOriginalText(element: Element): void {
  if (element.hasAttribute(DATA_ATTR_ORIGINAL)) {
    return
  }

  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE
  ) as Text[]

  if (textNodes.length > 0) {
    const fullText = textNodes.map((node) => node.textContent || "").join("")
    if (fullText.trim().length > 0) {
      element.setAttribute(DATA_ATTR_ORIGINAL, fullText)
    }
  }
}

function restoreElementText(element: Element): void {
  const original = element.getAttribute(DATA_ATTR_ORIGINAL)
  if (original === null) {
    return
  }

  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE
  ) as Text[]

  if (textNodes.length === 0) {
    return
  }

  if (textNodes.length === 1) {
    textNodes[0].textContent = original
  } else {
    const firstNode = textNodes[0]
    firstNode.textContent = original
    for (let i = 1; i < textNodes.length; i++) {
      textNodes[i].textContent = ""
    }
  }
}

function isStyleOrLinkTag(tagName: string): boolean {
  const styleTags = [
    "a", "span", "strong", "em", "b", "i", "u", "mark", "small",
    "sub", "sup", "code", "kbd", "samp", "var", "del", "ins",
    "s", "strike", "font", "big", "tt", "abbr", "acronym", "cite",
    "dfn", "q", "ruby", "rt", "rp", "bdi", "bdo", "wbr"
  ]
  return styleTags.includes(tagName.toLowerCase())
}

function hasOnlyTextNodes(element: Element): boolean {
  const hasTextNodes = Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE
  )

  if (!hasTextNodes) {
    return false
  }

  const allChildrenAreStyleTags = Array.from(element.children).every(
    (child) => isStyleOrLinkTag(child.tagName)
  )

  return allChildrenAreStyleTags
}

function shouldProcessElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase()
  const skipTags = ["script", "style", "noscript", "meta", "title", "head"]

  if (skipTags.includes(tagName)) {
    return false
  }

  return hasOnlyTextNodes(element)
}

function processElement(element: Element, style: CatStyle | null): void {
  if (!shouldProcessElement(element)) {
    return
  }

  const tagName = element.tagName.toLowerCase()
  const textContent = element.textContent?.substring(0, 50) || ""
  console.log("[Content] processElement: Processing", tagName, "element, style =", style, "text preview:", textContent)

  storeOriginalText(element)

  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE
  ) as Text[]

  if (style !== null) {
    console.log("[Content] processElement: Replacing text in", textNodes.length, "text nodes with style", style)
    textNodes.forEach((textNode) => {
      const originalText = textNode.textContent || ""
      if (originalText.trim().length > 0) {
        const replacedText = replaceTextWithCats(originalText, style)
        textNode.textContent = replacedText
      }
    })
  } else {
    console.log("[Content] processElement: Restoring original text")
    restoreElementText(element)
  }

  Array.from(element.children).forEach((child) => {
    if (isStyleOrLinkTag(child.tagName) && shouldProcessElement(child)) {
      processElement(child, style)
    }
  })
}

function processDocument(style: CatStyle | null): void {
  console.log("[Content] processDocument: Called with style =", style)
  if (!document.body) {
    console.warn("[Content] processDocument: document.body not available")
    return
  }

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const element = node as Element
        if (shouldProcessElement(element)) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_SKIP
      }
    }
  )

  const elementsToProcess: Element[] = []
  let node: Node | null = walker.nextNode()

  while (node) {
    elementsToProcess.push(node as Element)
    node = walker.nextNode()
  }

  console.log("[Content] processDocument: Found", elementsToProcess.length, "elements to process")
  elementsToProcess.forEach((element) => processElement(element, style))
  console.log("[Content] processDocument: Finished processing elements")
}

let observer: MutationObserver | null = null

function initObserver(): void {
  if (observer) {
    observer.disconnect()
  }

  observer = new MutationObserver((mutations) => {
    if (currentStyle === null) {
      return
    }

    const elementsToProcess = new Set<Element>()

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (shouldProcessElement(element)) {
              elementsToProcess.add(element)
            }

            const childElements = element.querySelectorAll("*")
            childElements.forEach((child) => {
              if (shouldProcessElement(child)) {
                elementsToProcess.add(child)
              }
            })
          }
        })
      }
    })

    elementsToProcess.forEach((element) => processElement(element, currentStyle))
  })

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

function applyStyle(style: CatStyle | null): void {
  console.log("[Content] applyStyle: Called with style =", style)
  currentStyle = style
  if (document.body) {
    console.log("[Content] applyStyle: Processing document...")
    processDocument(style)
    console.log("[Content] applyStyle: Document processed")
  } else {
    console.warn("[Content] applyStyle: document.body not available")
  }
  console.log("[Content] applyStyle: Initializing observer...")
  initObserver()
  console.log("[Content] applyStyle: Complete, currentStyle =", currentStyle)
}

console.log("[Content] Script loaded, checking chrome APIs...")

if (typeof chrome !== "undefined" && chrome.storage && chrome.runtime) {
  console.log("[Content] Chrome APIs available, initializing...")

  chrome.storage.local.get(["catReplacerStyle"], (result) => {
    console.log("[Content] Storage get callback, result:", result)
    const style = (result.catReplacerStyle as CatStyle) || null
    console.log("[Content] Initial style:", style)

    if (document.readyState === "loading") {
      console.log("[Content] Document still loading, waiting for DOMContentLoaded...")
      document.addEventListener("DOMContentLoaded", () => {
        console.log("[Content] DOMContentLoaded fired, applying style...")
        applyStyle(style)
      })
    } else {
      console.log("[Content] Document ready, applying style immediately...")
      applyStyle(style)
    }
  })

  console.log("[Content] Setting up message listener...")
  chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
    console.log("[Content] Message received:", message, "from sender:", sender)
    if (message && message.style !== undefined) {
      console.log("[Content] Message contains style:", message.style)
      applyStyle(message.style)
      sendResponse({ success: true })
    } else {
      console.warn("[Content] Message doesn't contain style")
    }
    return true
  })
  console.log("[Content] Message listener set up")
} else {
  console.warn("[Content] Chrome APIs not available:", {
    chrome: typeof chrome,
    storage: typeof chrome !== "undefined" && chrome.storage,
    runtime: typeof chrome !== "undefined" && chrome.runtime
  })

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyStyle(null)
    })
  } else {
    applyStyle(null)
  }
}

