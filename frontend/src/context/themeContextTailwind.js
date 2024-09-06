import React, { createContext, useState, useEffect } from "react"

export const ThemeContext = createContext()

export const ThemeProviderTailwind = ({ children }) => {
  const [themeTailwindCSS, setTheme] = useState("system")

  useEffect(() => {
    const root = window.document.documentElement

    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light"
    const initialTheme = localStorage.getItem("theme") || systemPreference

    root.classList.remove("light", "dark")
    root.classList.add(
      initialTheme === "system" ? systemPreference : initialTheme
    )

    setTheme(initialTheme)
  }, [])

  const toggleTheme = (selectedTheme) => {
    const root = window.document.documentElement

    localStorage.setItem("themeTailwindCSS", selectedTheme)

    if (selectedTheme === "system") {
      const systemPreference = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      root.classList.remove("light", "dark")
      root.classList.add(systemPreference)
    } else {
      root.classList.remove("light", "dark")
      root.classList.add(selectedTheme)
    }

    setTheme(selectedTheme)
  }

  return (
    <ThemeContext.Provider value={{ themeTailwindCSS, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
