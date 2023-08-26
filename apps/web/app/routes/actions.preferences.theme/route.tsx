import type { ActionFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getThemeSession } from "~/utils/prefs.server";
import { isTheme } from "~/utils/themes";

export const action: ActionFunction = async ({ request }) => {
  const themeSession = await getThemeSession(request);
  const requestText = await request.text();
  const form = new URLSearchParams(requestText);
  const theme = form.get("theme");

  if (!isTheme(theme)) {
    return json(
      {
        success: false,
        error: "Invalid theme",
      },
      { status: 400 },
    );
  }
  themeSession.setTheme(theme);
  return json(
    {
      success: true,
    },
    {
      headers: {
        "Set-Cookie": await themeSession.commit(),
      },
    },
  );
};
