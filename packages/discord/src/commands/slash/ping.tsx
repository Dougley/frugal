import { CommandHandler, createElement, Message, useDescription } from "slshx";

export function ping(): CommandHandler<Env> {
  useDescription("Pong!");
  return (interaction, env, ctx) => {
    return <Message>Pong!</Message>;
  };
}
