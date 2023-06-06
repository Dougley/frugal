import { Suspense, useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme) {
      setTheme(theme);
    }
  }, []);
  return (
    <Suspense fallback={null}>
      <button
        // className="btn-ghost btn-square btn gap-2"
        onClick={() => {
          setTheme(theme === "light" ? "dark" : "light");
          localStorage.setItem("theme", theme === "light" ? "dark" : "light");
          document
            .querySelector("html")!
            .setAttribute("data-theme", theme === "light" ? "dark" : "light");
        }}
      >
        <label className="swap swap-rotate">
          <input
            disabled
            type="checkbox"
            className="swap swap-rotate"
            checked={theme === "light"}
          />

          <LuMoon className="swap-on h-5 w-5" />
          <LuSun className="swap-off h-5 w-5" />
        </label>
        Switch to {theme === "light" ? "dark " : "light "}
        mode
      </button>
    </Suspense>
  );
}
