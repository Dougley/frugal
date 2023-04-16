import { useEffect, useState } from "react";
import { IoMdMoon } from "react-icons/io";
import { MdOutlineWbSunny } from "react-icons/md";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme) {
      setTheme(theme);
    }
  }, []);
  return (
    <button
      className="btn-ghost btn-square btn gap-2"
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

        <IoMdMoon className="swap-off h-8 w-8 fill-current" />
        <MdOutlineWbSunny className="swap-on h-8 w-8 fill-current" />
      </label>
    </button>
  );
}
