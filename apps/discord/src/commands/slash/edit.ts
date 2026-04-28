import { and, asc, eq, Schema } from "@dougley/frugal-drizzle/workers";
import { EditModal, type EditModalTranslations } from "@dougley/frugal-utils";
import {
  type AutocompleteContext,
  type CommandContext,
  CommandOptionType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

/**
 * Helper to get edit modal translations from i18n
 */
async function getEditModalTranslations(
  locale: string
): Promise<EditModalTranslations> {
  const { i18n } = getContext();
  const [buttonLabel, modalTitle, prizeLabel, winnersLabel, descriptionLabel] =
    await Promise.all([
      i18n.translate("components.edit_modal.button_label", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.title", { language: locale }),
      i18n.translate("components.edit_modal.fields.prize", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.winners", {
        language: locale,
      }),
      i18n.translate("components.edit_modal.fields.description", {
        language: locale,
      }),
    ]);

  return {
    buttonLabel,
    modalTitle,
    prizeLabel,
    winnersLabel,
    descriptionLabel,
  };
}

export default class EditCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "edit",
      description: "Edit a giveaway",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "ID of the giveaway to edit",
          required: true,
          autocomplete: true,
        },
      ],
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    console.log("Autocomplete called");

    if (!getContext().env?.D1 || !getContext().drizzle) {
      console.error("D1 environment not available");
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

    console.log("Giveaways:", activeGiveaways);

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
    // No need to defer the response as we're showing a modal immediately

    if (!getContext().env?.GIVEAWAY_STATE || !getContext().state) {
      const errorMessage = await getContext().i18n?.translate(
        "common.errors.giveaway_state_unavailable",
        {
          language: ctx.locale,
        }
      );
      return ctx.send({
        content: errorMessage,
        ephemeral: true,
      });
    }

    const giveawayId = ctx.options.id;

    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      getContext().env.GIVEAWAY_STATE.idFromString(giveawayId)
    );

    const state = await stub.getState.query();

    if (!state) {
      const errorMessage = await getContext().i18n?.translate(
        "common.errors.giveaway_not_found",
        {
          language: ctx.locale,
        }
      );
      return ctx.send({
        content: errorMessage,
        ephemeral: true,
      });
    }

    // Show the modal immediately using the component's createModal method
    const translations = await getEditModalTranslations(ctx.locale ?? "en-US");
    return ctx.sendModal(
      EditModal.createModal(giveawayId, state, translations)
    );
  }
}
