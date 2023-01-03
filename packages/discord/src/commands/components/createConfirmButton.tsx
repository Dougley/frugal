import db from "database";
import {
  Button,
  ComponentHandler,
  createElement,
  Fragment,
  Message,
  Row,
  useButton,
} from "slshx";
import { Timer } from "../../timers";
import { createMessage } from "../../utils/discord";
import { parseTime } from "../../utils/timeUtil";
import { GiveawayEmbed } from "./giveawayEmbed";
import { handlerJoinButton, JoinButton } from "./joinButton";

type createConfirmButtonProps = { id: string; objectId: string };
export function CreateConfirmButton({
  id,
  objectId,
}: createConfirmButtonProps) {
  return (
    <>
      <Button success emoji="✔️" id={`${id}?${objectId}`}>
        Looks good!
      </Button>
    </>
  );
}

export function handlerCreateConfirmButton(): ComponentHandler<Env> {
  const joinButton = useButton(handlerJoinButton());
  return async (interaction, env, ctx) => {
    const data = interaction.data.custom_id.substring(
      interaction.data.custom_id.indexOf("?") + 1
    );
    const timers = Timer.from<Timer>(env.TIMERS).getByString(data);
    const details = await timers.class.details();
    const time = parseTime(details.duration!) + Date.now();
    const msg = (
      <Message allowedMentions={{ parse: [] }}>
        <GiveawayEmbed
          // @ts-ignore
          details={{
            ...details,
            time,
          }}
        />
        <Row>
          <JoinButton id={joinButton} objectId={data} />
        </Row>
      </Message>
    );
    const res = await createMessage(details.channel!, msg);
    await db
      .insertInto("giveaways")
      .values({
        guild_id: interaction.guild_id!,
        message_id: res.id,
        channel_id: details.channel!,
        end_time: new Date(time),
        winner_count: Number(details.winners),
        durable_object_id: data,
        prize: details.prize!,
      })
      .execute();
    await timers.class.setup({ message: res.id, time });
    await timers.class.start();
    return (
      <Message update ephemeral>
        Cool! Your giveaway has been started!
      </Message>
    );
  };
}
