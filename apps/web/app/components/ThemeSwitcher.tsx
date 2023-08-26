import { Suspense } from "react";
import { LuMoon, LuSun } from "react-icons/lu";
import { Theme, useTheme } from "~/utils/themes";

export function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    );
    window.localStorage.setItem(
      "theme",
      theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    );
  };
  return (
    <Suspense fallback={null}>
      <button
        // className="btn-ghost btn-square btn gap-2"
        onClick={toggleTheme}
      >
        <label className="swap swap-rotate">
          <input
            disabled
            type="checkbox"
            className="swap swap-rotate"
            checked={theme === Theme.LIGHT}
          />

          <LuMoon className="swap-on h-5 w-5" />
          <LuSun className="swap-off h-5 w-5" />
        </label>
        Switch to {theme === Theme.LIGHT ? "dark " : "light "}
        mode
      </button>
    </Suspense>
  );
}
