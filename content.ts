const CAT_CHARS = "ᓚᘏᗢ"

function replaceTextWithCats(text: string): string {
  let catIndex = 0
  return text
    .split("")
    .map((char) => {
      if (/\s/.test(char)) {
        return char
      }
      const catChar = CAT_CHARS[catIndex % CAT_CHARS.length]
      catIndex++
      return catChar
    })
    .join("")
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

function processElement(element: Element): void {
  if (!shouldProcessElement(element)) {
    return
  }
  
  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE
  ) as Text[]
  
  textNodes.forEach((textNode) => {
    const originalText = textNode.textContent || ""
    if (originalText.trim().length > 0) {
      const replacedText = replaceTextWithCats(originalText)
      textNode.textContent = replacedText
    }
  })
  
  Array.from(element.children).forEach((child) => {
    if (isStyleOrLinkTag(child.tagName) && shouldProcessElement(child)) {
      processElement(child)
    }
  })
}

function processDocument(): void {
  if (!document.body) {
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
  
  elementsToProcess.forEach(processElement)
}

let observer: MutationObserver | null = null

function initObserver(): void {
  if (observer) {
    observer.disconnect()
  }
  
  observer = new MutationObserver((mutations) => {
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
    
    elementsToProcess.forEach(processElement)
  })
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    processDocument()
    initObserver()
  })
} else {
  processDocument()
  initObserver()
}

