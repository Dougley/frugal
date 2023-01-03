import {
  createElement,
  Message,
  MessageCommandHandler,
  useInput,
  useModal,
} from "slshx";
import { Timer } from "../../timers";
import {
  EditCreateModal,
  handlerEditCreateModal,
} from "../components/editCreateModal";

export function edit(): MessageCommandHandler<Env> {
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

  return async (interaction, env, ctx, message) => {
    const objid = await env.KV.get(`timer:${message.id}`);
    if (!objid) {
      return <Message>That message is not a giveaway!</Message>;
    }
    const timers = Timer.from<Timer>(env.TIMERS).getByString(objid);
    const details = await timers.class.details();
    return (
      <EditCreateModal
        ids={{
          modal: editModal,
          winners: editModalWinnersID,
          duration: editModalDurationID,
          prize: editModalPrizeID,
          objectId: objid,
        }}
        prefill={details}
      />
    );
  };
}
