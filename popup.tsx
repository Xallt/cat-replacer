import { useState, useEffect } from "react"

function IndexPopup() {
  const [symbolCatsEnabled, setSymbolCatsEnabled] = useState(false)

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["symbolCatsEnabled"], (result) => {
        setSymbolCatsEnabled(result.symbolCatsEnabled ?? false)
      })
    }
  }, [])

  const handleSymbolCatsToggle = (enabled: boolean) => {
    setSymbolCatsEnabled(enabled)

    if (typeof chrome !== "undefined" && chrome.storage && chrome.tabs) {
      chrome.storage.local.set({ symbolCatsEnabled: enabled }, () => {
        if (chrome.runtime.lastError) {
          console.error("[Popup] Storage set error:", chrome.runtime.lastError.message)
          return
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error("[Popup] Tabs query error:", chrome.runtime.lastError.message)
            return
          }

          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { symbolCatsEnabled: enabled }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("[Popup] Message send error:", chrome.runtime.lastError.message)
              }
            })
          }
        })
      })
    }
  }

  return (
    <div
      style={{
        minWidth: 300,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        background: "#1a1a1a",
        color: "#e0e0e0"
      }}>
      <div style={{
        padding: "14px 16px",
        background: "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)",
        borderBottom: "1px solid #333"
      }}>
        <h2 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <span style={{ fontSize: 20 }}>ᓚᘏᗢ</span>
          <span>Cat Replacer</span>
        </h2>
      </div>

      <div style={{ padding: 16 }}>
        <p style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          lineHeight: 1.5,
          color: "#aaa"
        }}>
          Transform M symbols into cat faces with eyes and mouths!
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            padding: "12px 14px",
            borderRadius: 8,
            background: symbolCatsEnabled
              ? "linear-gradient(135deg, #3d2a3d 0%, #2d2d2d 100%)"
              : "#2d2d2d",
            border: symbolCatsEnabled ? "1px solid #ff6b9d" : "1px solid #444",
            transition: "all 0.2s ease"
          }}>
          <div style={{
            width: 44,
            height: 24,
            background: symbolCatsEnabled ? "#ff6b9d" : "#555",
            borderRadius: 12,
            position: "relative",
            transition: "background 0.2s ease"
          }}>
            <div style={{
              width: 20,
              height: 20,
              background: "#fff",
              borderRadius: "50%",
              position: "absolute",
              top: 2,
              left: symbolCatsEnabled ? 22 : 2,
              transition: "left 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
            }} />
          </div>
          <input
            type="checkbox"
            checked={symbolCatsEnabled}
            onChange={(e) => handleSymbolCatsToggle(e.target.checked)}
            style={{ display: "none" }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {symbolCatsEnabled ? "Enabled" : "Disabled"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              M → 🐱
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}

export default IndexPopup
