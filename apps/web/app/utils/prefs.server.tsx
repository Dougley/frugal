import { createCookieSessionStorage } from "@remix-run/cloudflare";
import { Theme, isTheme } from "./themes";

const prefStorage = createCookieSessionStorage({
  cookie: {
    name: "preferences",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    path: "/",
  },
});

async function getThemeSession(request: Request) {
  const session = await prefStorage.getSession(request.headers.get("Cookie"));
  return {
    getTheme: () => {
      const CHheader = request.headers.get("sec-ch-prefers-color-scheme");
      const CHprefersDark = CHheader === "dark" ? Theme.DARK : Theme.LIGHT;
      const theme = session.get("theme");
      if (isTheme(theme)) {
        return theme;
      }
      return CHheader !== null ? CHprefersDark : null;
    },
    setTheme: (theme: Theme) => {
      session.set("theme", theme);
    },
    commit: () => {
      return prefStorage.commitSession(session);
    },
  };
}

export { getThemeSession, prefStorage };
