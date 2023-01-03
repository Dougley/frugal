import {
  Button,
  CommandHandler,
  createElement,
  Message,
  Row,
  useButton,
  useChannel,
  useDescription,
  useInput,
  useInteger,
  useModal,
  useString,
} from "slshx";
import { Timer } from "../../timers";
import { parseTime } from "../../utils/timeUtil";
import {
  CreateConfirmButton,
  handlerCreateConfirmButton,
} from "../components/createConfirmButton";
import {
  EditCreateModal,
  handlerEditCreateModal,
} from "../components/editCreateModal";
import { GiveawayEmbed } from "../components/giveawayEmbed";

export function start(): CommandHandler<Env> {
  useDescription("Start a giveaway");
  const channel = useChannel("channel", "Channel to hold the giveaway in", {
    required: true,
  });
  const winners = useInteger("winners", "Number of winners", {
    required: true,
  });
  const duration = useString("duration", "Duration of the giveaway", {
    required: true,
  });
  const prize = useString("prize", "Prize for the giveaway", {
    required: true,
  });

  const [editModalWinnersID, editModalWinnersValue] = useInput();
  const [editModalDurationID, editModalDurationValue] = useInput();
  const [editModalPrizeID, editModalPrizeValue] = useInput();
  const editModal = useModal(
    handlerEditCreateModal({
      winners: editModalWinnersValue,
      duration: editModalDurationValue,
      prize: editModalPrizeValue,
    })
  );
  const editButton = useButton<Env>(async (interaction, env, ctx) => {
    const objectId = interaction.data.custom_id.substring(editButton.length);
    const timers = Timer.from<Timer>(env.TIMERS).getByString(objectId);
    const data = await timers.class.details();
    return (
      <EditCreateModal
        ids={{
          modal: editModal,
          winners: editModalWinnersID,
          duration: editModalDurationID,
          prize: editModalPrizeID,
          objectId,
        }}
        prefill={data}
      />
    );
  });

  const declineButton = useButton(async (interaction, env, ctx) => {
    return <Message update>Giveaway cancelled</Message>;
  });

  const confirmButton = useButton<Env>(handlerCreateConfirmButton());

  return async (interaction, env, ctx) => {
    const objid = env.TIMERS.newUniqueId();
    const timers = Timer.from<Timer>(env.TIMERS).getById(objid);
    const time = parseTime(duration);
    if (time === 0) {
      return <Message>Invalid duration</Message>;
    }
    await timers.class.setup({
      channel: channel.id,
      time: Date.now() + time,
      winners: String(winners),
      prize,
      duration,
      guild: interaction.guild_id,
    });
    return (
      <Message ephemeral>
        How does this look?
        <GiveawayEmbed details={{ time: Date.now() + time, winners, prize }} />
        <Row>
          <CreateConfirmButton id={confirmButton} objectId={objid.toString()} />
          <Button emoji="✏️" id={editButton + objid.toString()}>
            Edit
          </Button>
          <Button danger emoji="✖️" id={declineButton}>
            Cancel
          </Button>
        </Row>
      </Message>
    );
  };
}
