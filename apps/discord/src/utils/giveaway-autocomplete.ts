import { and, asc, eq, Schema } from "@dougley/frugal-drizzle/workers";
import * as Sentry from "@sentry/cloudflare";
import { getContext } from "../context";

const GIVEAWAY_ID_PATTERN = /^[a-f0-9]{64}$/;

export function isValidGiveawayId(value: unknown): value is string {
  return typeof value === "string" && GIVEAWAY_ID_PATTERN.test(value);
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export async function getGiveawayAutocompleteChoices({
  guildId,
  locale,
  state,
}: {
  guildId: string | undefined;
  locale: string | undefined;
  state: "OPEN" | "CLOSED";
}) {
  if (!guildId || !getContext().env?.D1 || !getContext().drizzle) {
    return [];
  }

  try {
    const giveaways = await getContext()
      .drizzle.select()
      .from(Schema.giveaways)
      .where(
        and(
          eq(Schema.giveaways.guildId, guildId),
          eq(Schema.giveaways.state, state)
        )
      )
      .orderBy(asc(Schema.giveaways.endTime))
      .limit(25);

    const language = locale ?? "en-US";
    const { i18n } = getContext();

    return Promise.all(
      giveaways.map(async (giveaway) => {
        const name = await i18n.translate("autocomplete.giveaway.format", {
          language,
          params: {
            prize: giveaway.prize.slice(0, 48),
            winners: giveaway.winners.toString(),
            date: formatDate(new Date(giveaway.endTime), language),
          },
        });

        return {
          name: name.slice(0, 100),
          value: giveaway.durableObjectId,
        };
      })
    );
  } catch (error) {
    console.error("Failed to load giveaway autocomplete choices:", error);
    Sentry.captureException(error);
    return [];
  }
}
