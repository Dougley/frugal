import db from "planetscale-discord";
import {
  CommandHandler,
  createElement,
  Embed,
  Message,
  useDescription,
} from "slshx";
import { interactionTX } from "../../utils/sentry";

export function list(): CommandHandler<Env> {
  useDescription("Get a list of all running giveaways");
  return async (interaction, env, ctx) => {
    const span = interactionTX("list", interaction);
    const query = db
      .selectFrom("giveaways")
      .selectAll()
      .where("giveaways.guild_id", "=", interaction.guild_id!)
      .where("giveaways.end_time", ">", new Date())
      .orderBy("giveaways.end_time", "asc");
    const dbSpan = span?.startChild({
      op: "db",
      data: { query: query.compile().sql },
    });
    const giveaways = await query.execute();
    dbSpan?.finish();
    span?.finish();
    return (
      <Message>
        These are all the giveaways that are currently running:
        <Embed title="Giveaways">
          {giveaways
            .map(
              (g) =>
                `[**${
                  g.prize
                }**](${`https://discord.com/channels/${g.guild_id}/${g.channel_id}/${g.message_id}`}) - Ends <t:${(
                  new Date(g.end_time!).getTime() / 1000
                ).toFixed(0)}:R> (<t:${(
                  new Date(g.end_time!).getTime() / 1000
                ).toFixed(0)}:F>)`
            )
            .join("\n")}
        </Embed>
      </Message>
    );
  };
}
