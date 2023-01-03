import { createElement, Message, MessageCommandHandler } from "slshx";
import { Timer } from "../../timers";

export function reroll(): MessageCommandHandler<Env> {
  return async (interaction, env, ctx, message) => {
    const objid = await env.KV.get(`timer:${message.id}`);
    if (!objid) {
      return <Message>That message is not a giveaway!</Message>;
    }
    const timers = Timer.from<Timer>(env.TIMERS).getByString(objid);
    const winners = await timers.class.reroll();
    return (
      <Message allowedMentions={{ users: [winners] }}>
        The new winner is {`<@${winners}>`}! Congratulations!
      </Message>
    );
  };
}
