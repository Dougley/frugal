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

    return activeGiveaways.map((g) => ({
      name: `${g.prize} (${g.winners} ${g.winners === 1 ? "winner" : "winners"})`,
      value: g.durableObjectId,
    }));
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
        "commands.stop.errors.giveaway_not_found",
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
