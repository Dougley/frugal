import { JoinButton } from "@dougley/frugal-utils";
import {
  type CommandContext,
  CommandOptionType,
  type SlashCreator,
} from "slash-create/web";
import { BaseCommand } from "../../classes/BaseCommand";
import { getContext } from "../../context";

export default class SaveTestCommand extends BaseCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "savetest",
      description: "Test the savestate system",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "type",
          description: "Type of test to run",
          required: true,
          choices: [
            { name: "Full Test", value: "full" },
            { name: "Alarm Only", value: "alarm" },
            { name: "Get Info", value: "info" },
          ],
        },
        {
          type: CommandOptionType.STRING,
          name: "duration",
          description: "The duration of the test alarm (in seconds)",
          required: false,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "winners",
          description: "Number of winners to draw",
          required: false,
          min_value: 1,
        },
        {
          type: CommandOptionType.STRING,
          name: "id",
          description: "The Durable Object ID of the giveaway",
          required: false,
        },
        {
          type: CommandOptionType.INTEGER,
          name: "entries",
          description: "Number of test entries to generate (default: 10)",
          required: false,
          min_value: 1,
          max_value: 10000,
        },
      ],
    });
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

    const testType = ctx.options.type ?? "full";

    switch (testType) {
      case "full":
        return this.handleFullTest(ctx);
      case "alarm":
        return this.handleAlarmTest(ctx);
      case "info":
        return this.handleInfoTest(ctx);
      default:
        return ctx.editOriginal(
          await getContext().i18n.translate(
            "commands.savetest.errors.unknown_test_type",
            {
              language: ctx.locale,
            }
          )
        );
    }
  }

  private async handleFullTest(ctx: CommandContext) {
    await ctx.defer();

    const id = getContext().env.GIVEAWAY_STATE.newUniqueId();
    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      id
    );
    const durationSeconds = parseInt(ctx.options.duration ?? "60", 10);
    const duration = durationSeconds * 1000;
    const endTime = new Date(Date.now() + duration);
    const winnersCount = ctx.options.winners ?? 1;

    const message = (await ctx.send(
      await getContext().i18n.translate(
        "commands.savetest.messages.starting_full_test",
        {
          language: ctx.locale,
        }
      )
    )) as unknown as Message;

    // Step 1: Begin the giveaway
    const giveawayResult = await stub.beginGiveaway.mutate({
      message_id: message.id,
      channel_id: ctx.channelID ?? "0",
      guild_id: ctx.guildID ?? "0",
      prize: "Test Giveaway Prize",
      winners: winnersCount,
      end_time: endTime.toISOString(),
      host_id: ctx.user.id,
    });

    // Step 2: Start the alarm
    const alarmResult = await stub.startAlarm.mutate(endTime.toISOString());

    console.trace(giveawayResult, alarmResult);

    // Step 3: Generate test entries
    const entryCount = ctx.options.entries ?? 10;

    // Add the command user as an entry
    const commandUser = {
      user_id: ctx.user.id,
      username: ctx.user.username,
      discriminator: ctx.user.discriminator,
      avatar: ctx.user.avatar || null,
    };
    await stub.addEntry.mutate(commandUser);

    // Generate fake users for remaining entries
    for (let i = 1; i < entryCount; i++) {
      const paddedId = i.toString().padStart(18, "0");
      await stub.addEntry.mutate({
        user_id: paddedId,
        username: `TestUser${i}`,
        discriminator: i.toString().padStart(4, "0"),
        avatar: null,
      });
    }

    // Fetch current state
    const state = await stub.getState.query();
    const entries = await stub.getEntries.query();

    return ctx.editOriginal({
      content: await getContext().i18n.translate(
        "commands.savetest.messages.full_test_started",
        {
          language: ctx.locale,
          params: {
            prize: "Test Giveaway Prize",
            winners: winnersCount.toString(),
            duration: durationSeconds.toString(),
            entries: entries.length.toString(),
            status: state.state,
            id: id.toString(),
            endTime: endTime.toLocaleString(),
          },
        }
      ),
      components: [JoinButton.createActionRow(id.toString())],
    });
  }

  private async handleAlarmTest(ctx: CommandContext) {
    const id = getContext().env.GIVEAWAY_STATE.newUniqueId();
    const stub = getContext().state.getInstance(
      getContext().env.GIVEAWAY_STATE,
      id
    );
    const duration = parseInt(ctx.options.duration ?? "60", 10) * 1000;
    const endTime = new Date(Date.now() + duration);

    const output = await stub.startAlarm.mutate(endTime.toISOString());
    console.log(
      `Test alarm started successfully with Object ID: ${id}`,
      output
    );

    return ctx.editOriginal(
      await getContext().i18n.translate(
        "commands.savetest.messages.alarm_started",
        {
          language: ctx.locale,
          params: {
            duration: (duration / 1000).toString(),
            id: id.toString(),
          },
        }
      )
    );
  }

  private async handleInfoTest(ctx: CommandContext) {
    const objectIdStr = ctx.options.id;

    if (!objectIdStr) {
      return ctx.editOriginal(
        await getContext().i18n.translate(
          "commands.savetest.errors.missing_object_id",
          {
            language: ctx.locale,
          }
        )
      );
    }

    const stub = getContext().state?.getInstance(
      getContext().env?.GIVEAWAY_STATE,
      getContext().env?.GIVEAWAY_STATE.idFromString(objectIdStr)
    );

    const state = await stub.getState.query();
    const entries = await stub.getEntries.query();

    const endTime = new Date(state.endTime);
    const now = new Date();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    const entriesList =
      entries.length > 0
        ? (await getContext().i18n.translate(
            "commands.savetest.messages.entries_header",
            {
              language: ctx.locale,
            }
          )) +
          "\n" +
          entries
            .slice(0, 5)
            .map((e) => `- ${e.username}#${e.discriminator}`)
            .join("\n") +
          (entries.length > 5
            ? `\n${await getContext().i18n.translate(
                "commands.savetest.messages.and_more",
                {
                  language: ctx.locale,
                  params: { count: (entries.length - 5).toString() },
                }
              )}`
            : "")
        : await getContext().i18n.translate(
            "commands.savetest.messages.no_entries",
            {
              language: ctx.locale,
            }
          );

    return ctx.editOriginal(
      await getContext().i18n.translate(
        "commands.savetest.messages.giveaway_info",
        {
          language: ctx.locale,
          params: {
            prize: state.prize,
            winners: state.winners.toString(),
            entries: entries.length.toString(),
            status: state.state,
            endTime: endTime.toLocaleString(),
            remaining: `${remainingMinutes}m ${remainingSeconds}s`,
            id: objectIdStr,
            entriesList,
          },
        }
      )
    );
  }
}
