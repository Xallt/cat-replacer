import { useState, useEffect } from "react"

const CAT_STYLES: { value: string; preview: string }[] = [
  { value: "ascii", preview: "ᓚᘏᗢ" },
  { value: "cute1", preview: "ᓚ₍ ^. .^₎" },
  { value: "cute2", preview: "ꐑ՞•ﻌ•՞ꐑ " }
]

type CatStyle = (typeof CAT_STYLES)[number]["value"]

function IndexPopup() {
  const [selectedStyle, setSelectedStyle] = useState<CatStyle | null>(null)

  useEffect(() => {
    console.log("[Popup] useEffect: Loading initial state")
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["catReplacerStyle"], (result) => {
        console.log("[Popup] Storage get result:", result)
        setSelectedStyle((result.catReplacerStyle as CatStyle) || null)
      })
    } else {
      console.warn("[Popup] Chrome APIs not available in useEffect")
    }
  }, [])

  const handleStyleChange = (style: CatStyle | null) => {
    console.log("[Popup] handleStyleChange: Style changed to", style)
    setSelectedStyle(style)

    if (typeof chrome !== "undefined" && chrome.storage && chrome.tabs) {
      console.log("[Popup] handleStyleChange: Setting storage to", style)
      chrome.storage.local.set({ catReplacerStyle: style }, () => {
        if (chrome.runtime.lastError) {
          console.error("[Popup] Storage set error:", chrome.runtime.lastError.message)
          return
        }
        console.log("[Popup] Storage set successfully, querying tabs...")

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error("[Popup] Tabs query error:", chrome.runtime.lastError.message)
            return
          }
          console.log("[Popup] Tabs query result:", tabs)

          if (tabs[0]?.id) {
            console.log("[Popup] Sending message to tab", tabs[0].id, "with style:", style)
            chrome.tabs.sendMessage(tabs[0].id, { style }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("[Popup] Message send error:", chrome.runtime.lastError.message)
              } else {
                console.log("[Popup] Message sent successfully, response:", response)
              }
            })
          } else {
            console.warn("[Popup] No active tab found")
          }
        })
      })
    } else {
      console.warn("[Popup] Chrome APIs not available:", {
        chrome: typeof chrome,
        storage: typeof chrome !== "undefined" && chrome.storage,
        tabs: typeof chrome !== "undefined" && chrome.tabs
      })
    }
  }

  return (
    <div
      style={{
        padding: 16,
        minWidth: 280,
        fontFamily: "system-ui, sans-serif"
      }}>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>
        ᓚᘏᗢ Cat Replacer
      </h2>
      <p style={{ margin: 0, marginBottom: 16, fontSize: 14, lineHeight: 1.5 }}>
        Select a cat style to replace text:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            backgroundColor: selectedStyle === null ? "#f0f0f0" : "transparent"
          }}>
          <input
            type="radio"
            name="catStyle"
            checked={selectedStyle === null}
            onChange={() => handleStyleChange(null)}
            style={{
              width: 18,
              height: 18,
              cursor: "pointer"
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>None</div>
          </div>
        </label>
        {CAT_STYLES.map((style) => (
          <label
            key={style.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              backgroundColor: selectedStyle === style.value ? "#f0f0f0" : "transparent"
            }}>
            <input
              type="radio"
              name="catStyle"
              value={style.value}
              checked={selectedStyle === style.value}
              onChange={() => handleStyleChange(style.value as CatStyle)}
              style={{
                width: 18,
                height: 18,
                cursor: "pointer"
              }}
            />
            <div style={{ flex: 1 }}>
              {style.preview && (
                <div style={{ fontSize: 14 }}>
                  {style.preview}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default IndexPopup
