import db from "database";
import {
  CommandHandler,
  createElement,
  Message,
  useDescription,
  useString,
} from "slshx";
import { Timer } from "../../timers";

export function end(): CommandHandler<Env> {
  useDescription("End a giveaway immediately.");
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
    await timers.class.editAlarm(1); // basically just forces the alarm to fire immediately
    return <Message ephemeral>Giveaway ended!</Message>;
  };
}
