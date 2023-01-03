import db from "planetscale-discord";
import {
  CommandHandler,
  createElement,
  useDescription,
  useInput,
  useModal,
  useString,
} from "slshx";
import { Timer } from "../../timers";
import {
  EditCreateModal,
  handlerEditCreateModal,
} from "../components/editCreateModal";

export function edit(): CommandHandler<Env> {
  useDescription("Edit a giveaway.");
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
  const giveawayID = useString("giveaway", "The giveaway to edit.", {
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
    const data = await timers.class.details();
    return (
      <EditCreateModal
        ids={{
          modal: editModal,
          winners: editModalWinnersID,
          duration: editModalDurationID,
          prize: editModalPrizeID,
          objectId: giveawayID,
        }}
        prefill={data}
      />
    );
  };
}
