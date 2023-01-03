import db from "planetscale-discord";
import {
  CommandHandler,
  createElement,
  Embed,
  Message,
  useDescription,
} from "slshx";

export function showSettings(): CommandHandler<Env> {
  useDescription("Show the current settings for this server.");
  return async (interaction, env, ctx) => {
    const settings = await db
      .selectFrom("guilds")
      .selectAll()
      .where("guilds.id", "=", interaction.guild_id!)
      .executeTakeFirst();
    return (
      <Message>
        These are the current settings for this server:
        <Embed title="Settings">
          {`**Premium:** ${settings?.premium ? "Yes" : "No"}`}
          {"\n"}
          {`**Embed color:** ${settings?.embed_color ?? "Default"}`}
          {"\n"}
        </Embed>
      </Message>
    );
  };
}
