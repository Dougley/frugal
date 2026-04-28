import { and, asc, eq, Schema } from "@dougley/frugal-drizzle/workers";
import {
  type AutocompleteContext,
  type CommandContext,
  CommandOptionType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

export default class StopCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "stop",
      description: "Stop a running giveaway",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "ID of the giveaway to stop",
          required: true,
          autocomplete: true,
        },
      ],
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    if (!getContext().env?.D1 || !getContext().drizzle) {
      return [];
    }

    // Get active giveaways for this guild, ordered by end time ascending
    const activeGiveaways = await getContext()
      .drizzle.select()
      .from(Schema.giveaways)
      .where(
        and(
          // biome-ignore lint/style/noNonNullAssertion: the context here forces guild context
          eq(Schema.giveaways.guildId, ctx.guildID!),
          eq(Schema.giveaways.state, "OPEN")
        )
      )
      .orderBy(asc(Schema.giveaways.endTime))
      .limit(25); // Limit to 25 choices as per Discord's limits

    const { i18n } = getContext();
    const locale = ctx.locale ?? "en-US";

    // dd-mm-yyyy hh:mm:ss
    const datestr = (date: Date) => {
      return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    };

    const choices = await Promise.all(
      activeGiveaways.map(async (g) => {
        const formattedText = await i18n.translate(
          "autocomplete.giveaway.format",
          {
            language: locale,
            params: {
              prize: g.prize.slice(0, 20),
              winners: g.winners,
              date: datestr(new Date(g.endTime)),
            },
          }
        );
        return {
          name: formattedText.slice(0, 100), // Discord limits choice names to 100 chars
          value: g.durableObjectId,
        };
      })
    );

    return choices;
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      );
      return ctx.editOriginal(errorMessage);
    }

    const giveawayId = ctx.options.id;
    console.log("Stopping giveaway:", giveawayId);

    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      const errorMessage = await getContext().i18n.translate(
        "common.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
      );
      return ctx.editOriginal(errorMessage);
    }

    // Update giveaway state to closed and trigger winner selection
    await stub.startAlarm.mutate(1);

    const successMessage = await getContext().i18n.translate(
      "commands.stop.messages.success",
      { language: ctx.locale }
    );
    return ctx.editOriginal(successMessage);
  }
}
