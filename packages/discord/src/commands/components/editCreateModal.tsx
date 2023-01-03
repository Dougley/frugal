import db from "database";
import {
  Button,
  createElement,
  Fragment,
  Input,
  Message,
  Modal,
  ModalHandler,
  Row,
  useButton,
} from "slshx";
import { Timer } from "../../timers";
import { editMessage } from "../../utils/discord";
import { parseTime } from "../../utils/timeUtil";
import {
  CreateConfirmButton,
  handlerCreateConfirmButton,
} from "./createConfirmButton";
import { GiveawayEmbed } from "./giveawayEmbed";
import { handlerJoinButton, JoinButton } from "./joinButton";

type editCreateModalProps = {
  ids: {
    modal: string;
    winners: string;
    duration: string;
    prize: string;
    objectId: string;
  };
  prefill?: { duration?: string; winners?: string; prize?: string };
};
export function EditCreateModal({ ids, prefill }: editCreateModalProps) {
  return (
    <Modal
      id={`${ids.modal}?${ids.objectId}`}
      title={prefill ? "Edit giveaway" : "Create giveaway"}
    >
      <Input
        minLength={1}
        id={ids.winners}
        label="Winners"
        placeholder="1"
        value={prefill?.winners}
      />
      <Input
        minLength={2}
        id={ids.duration}
        label="Duration"
        placeholder="1d 2h 3m 4s"
        value={prefill?.duration}
      />
      <Input
        minLength={1}
        id={ids.prize}
        label="Prize"
        placeholder="A prize"
        value={prefill?.prize}
        paragraph
      />
    </Modal>
  );
}

export function handlerEditCreateModal(values: {
  winners: string;
  duration: string;
  prize: string;
}): ModalHandler<Env> {
  const declineButton = useButton(async (interaction, env, ctx) => {
    return <Message update>Giveaway cancelled</Message>;
  });

  const confirmButton = useButton<Env>(handlerCreateConfirmButton());
  const joinButton = useButton(handlerJoinButton());

  return async (interaction, env, ctx) => {
    const time = parseTime(values.duration) + Date.now();
    const data = interaction.data.custom_id.substring(
      interaction.data.custom_id.indexOf("?") + 1
    );
    const timers = Timer.from<Timer>(env.TIMERS).getByString(data);
    await timers.class.edit({
      duration: values.duration,
      winners: values.winners,
      prize: values.prize,
      time,
    });
    const details = await timers.class.details();
    if (interaction.message?.flags === 64) {
      return (
        <Message ephemeral update>
          Edited! How does this look?
          <GiveawayEmbed details={{ ...values, time }} />
          <Row>
            <CreateConfirmButton id={confirmButton} objectId={data} />
            <Button disabled emoji="✏️" id={interaction.data.custom_id}>
              Edit
            </Button>
            <Button danger emoji="✖️" id={declineButton}>
              Cancel
            </Button>
          </Row>
        </Message>
      );
    } else {
      await db
        .updateTable("giveaways")
        .set({
          end_time: new Date(time),
          winner_count: Number(values.winners),
          prize: values.prize,
        })
        .where("durable_object_id", "=", data)
        .execute();
      await timers.class.editAlarm(time);
      const msg = (
        <Message>
          <GiveawayEmbed details={{ ...values, time }} />
          <Row>
            <JoinButton id={joinButton} objectId={data} />
          </Row>
        </Message>
      );
      await editMessage(details.channel!, details.message!, msg);
      return <Message ephemeral>Edited!</Message>;
    }
  };
}
