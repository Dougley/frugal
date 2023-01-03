import { createElement, Embed } from "slshx";

type giveawayEmbedProps = {
  details: { prize: string; winners: number | string; time: number };
  ended?: boolean;
};
export function GiveawayEmbed({ details, ended = false }: giveawayEmbedProps) {
  const time = (new Date(details.time!).getTime() / 1000).toFixed(0);
  return (
    <Embed
      title={details.prize}
      color={ended ? 0x808080 : 0x00ff00}
      timestamp={new Date(details.time)}
    >
      {`${ended ? "Ended" : "Ends"} <t:${time}:R> (<t:${time}:F>)
      Winners: **${details.winners}**
      `}
    </Embed>
  );
}
