import db from "database";
import {
  CommandHandler,
  createElement,
  Message,
  useDescription,
  useString,
} from "slshx";
import { Timer } from "../../timers";

export function reroll(): CommandHandler<Env> {
  useDescription("Reroll a single winner for a giveaway.");
  const giveawayID = useString("giveaway", "The giveaway to end.", {
    required: true,
    async autocomplete(interaction, env: Env, ctx) {
      const giveaways = await db
        .selectFrom("giveaways")
        .selectAll()
        .where("giveaways.guild_id", "=", interaction.guild_id!)
        .where("giveaways.end_time", ">", new Date())
        .orderBy("giveaways.end_time", "asc")
        .execute();
      return giveaways.map((g) => ({
        name: g.prize,
        value: g.durable_object_id,
      }));
    },
  });
  return async (interaction, env, ctx) => {
    const timers = Timer.from<Timer>(env.TIMERS).getByString(giveawayID);
    const winners = await timers.class.reroll();
    return (
      <Message allowedMentions={{ users: [winners] }}>
        The new winner is {`<@${winners}>`}! Congratulations!
      </Message>
    );
  };
}
