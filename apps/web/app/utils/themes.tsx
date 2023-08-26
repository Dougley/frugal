// adapted from
// https://www.mattstobbs.com/remix-dark-mode/
import { useFetcher } from "@remix-run/react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

enum Theme {
  DARK = "dark",
  LIGHT = "light",
}

type ThemeContextType = [Theme | null, Dispatch<SetStateAction<Theme | null>>];

const prefersDarkMQ = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Array<Theme> = Object.values(Theme);

function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && themes.includes(value as Theme);
}

function ThemeProvider({
  children,
  wantedTheme,
}: {
  children: ReactNode;
  wantedTheme: Theme | null;
}) {
  const [theme, setTheme] = useState<Theme | null>(() => {
    if (wantedTheme && isTheme(wantedTheme)) {
      return wantedTheme;
    }
    return null;
  });
  const persistTheme = useFetcher();

  const persistThemeRef = useRef(persistTheme);
  useEffect(() => {
    persistThemeRef.current = persistTheme;
  }, [persistTheme]);

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!theme || !isTheme(theme)) {
      return;
    }

    persistThemeRef.current.submit(
      { theme },
      {
        action: "actions/preferences/theme",
        method: "post",
      },
    );
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(prefersDarkMQ);
    const handleChange = () => {
      setTheme(mediaQuery.matches ? Theme.DARK : Theme.LIGHT);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {children}
    </ThemeContext.Provider>
  );
}

function PreventFlashOfInvertedColors({ render }: { render: boolean }) {
  return (
    <>
      {!render ? null : (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              ;(() => {
                const theme = window.matchMedia(${JSON.stringify(
                  prefersDarkMQ,
                )}).matches
                  ? 'dark'
                  : 'light';
                document.querySelector('html').setAttribute('data-theme', theme);
                const meta = document.querySelector('meta[name=color-scheme]');
                if (meta) {
                  meta.setAttribute('content', theme === 'dark' ? 'dark light' : 'light dark');
                }
              })();`,
          }}
        />
      )}
    </>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export {
  PreventFlashOfInvertedColors,
  Theme,
  ThemeProvider,
  isTheme,
  useTheme,
};
