import { createContext, useContext, useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("sentinel_theme")
      if (saved === "light" || saved === "dark") {
        return saved
      }
      return "dark"
    } catch {
      return "dark"
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === "light") {
      root.classList.add("light")
      root.setAttribute("data-theme", "light")
      root.style.colorScheme = "light"
    } else {
      root.classList.remove("light")
      root.setAttribute("data-theme", "dark")
      root.style.colorScheme = "dark"
    }

    try {
      localStorage.setItem("sentinel_theme", theme)
    } catch (err) {
      console.warn("Could not persist theme to localStorage:", err)
    }
  }, [theme])

  // Synchronize theme across multiple tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "sentinel_theme" && (event.newValue === "light" || event.newValue === "dark")) {
        setThemeState(event.newValue)
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const setTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setThemeState(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeToggle({ className = "", compact = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      id="sentinel-theme-toggle-btn"
      onClick={(e) => {
        e.stopPropagation()
        toggleTheme()
      }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      className={`relative inline-flex items-center justify-center rounded-lg border border-border bg-secondary/80 hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer shadow-xs ${
        compact ? "w-8 h-8" : "w-9 h-9"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 rotate-0 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 rotate-0 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
    </button>
  )
}
