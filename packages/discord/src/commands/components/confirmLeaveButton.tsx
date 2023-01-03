import {
  Button,
  ComponentHandler,
  createElement,
  Fragment,
  Message,
} from "slshx";
import { Timer } from "../../timers";

type confirmLeaveButtonProps = { id: string; objectId: string };
export function ConfirmLeaveButton({ id, objectId }: confirmLeaveButtonProps) {
  return (
    <>
      <Button danger id={id + "?" + objectId}>
        Leave giveaway
      </Button>
    </>
  );
}

export function handlerConfirmLeaveButton(): ComponentHandler<Env> {
  return async (interaction, env, ctx) => {
    const data = interaction.data.custom_id.substring(
      interaction.data.custom_id.indexOf("?") + 1
    );
    const timers = Timer.from<Timer>(env.TIMERS).getByString(data);
    const status = await timers.class.status();
    if (status === false) {
      return <Message ephemeral>Giveaway has ended!</Message>;
    }
    const entry = await timers.class.entry(interaction.member!.user);
    return (
      <Message ephemeral>
        You have {entry ? "joined" : "left"} the giveaway!
      </Message>
    );
  };
}
