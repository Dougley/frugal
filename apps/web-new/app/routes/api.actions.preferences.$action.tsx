import type { ActionFunction } from "@remix-run/cloudflare";
import { data } from "@remix-run/cloudflare";
import { getThemeSession } from "~/utils/prefs.server";
import { isTheme } from "../components/contexts/ThemeContext";

export const action: ActionFunction = async ({ request, params }) => {
  switch (params.action) {
    case "theme": {
      const themeSession = await getThemeSession(request);
      const requestText = await request.text();
      const form = new URLSearchParams(requestText);
      const theme = form.get("theme");

      if (!isTheme(theme)) {
        return data(
          {
            success: false,
            error: "Invalid theme",
          },
          { status: 400 },
        );
      }
      themeSession.setTheme(theme);
      return data(
        {
          success: true,
        },
        {
          headers: {
            "Set-Cookie": await themeSession.commit(),
          },
        },
      );
    }
    default: {
      return data(
        {
          success: false,
          error: "Invalid action",
        },
        { status: 400 },
      );
    }
  }
};
