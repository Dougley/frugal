import {
  Button,
  ComponentHandler,
  createElement,
  Fragment,
  Message,
  useButton,
} from "slshx";
import { Timer } from "../../timers";
import {
  ConfirmLeaveButton,
  handlerConfirmLeaveButton,
} from "./confirmLeaveButton";

type joinButtonProps = { id: string; objectId: string };
export function JoinButton({ id, objectId }: joinButtonProps) {
  return (
    <>
      <Button primary id={id + "?" + objectId}>
        Join!
      </Button>
    </>
  );
}

export function handlerJoinButton(): ComponentHandler<Env> {
  const confirmLeave = useButton(handlerConfirmLeaveButton());
  return async (interaction, env, ctx) => {
    const data = interaction.data.custom_id.substring(
      interaction.data.custom_id.indexOf("?") + 1
    );
    const timers = Timer.from<Timer>(env.TIMERS).getByString(data);
    const status = await timers.class.status();
    if (status === false) {
      return <Message ephemeral>Giveaway has ended!</Message>;
    }
    if (await timers.class.getEntry(interaction.member!.user.id)) {
      return (
        <Message ephemeral>
          You have already joined this giveaway!
          <ConfirmLeaveButton id={confirmLeave} objectId={data} />
        </Message>
      );
    }
    const entry = await timers.class.entry(interaction.member!.user);
    return (
      <Message ephemeral>
        You have {entry ? "joined" : "left"} the giveaway!
      </Message>
    );
  };
}
