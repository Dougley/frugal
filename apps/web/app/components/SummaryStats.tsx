import formatDistance from "date-fns/formatDistance";
import type { Snowflake } from "discord-api-types/globals";
import type { APIUser } from "discord-api-types/v9";

type StatsProps = {
  details: {
    channel: Snowflake;
    message: Snowflake;
    prize: string;
    winners: `${number}`;
    time: number;
    duration: number;
    originalWinners: Snowflake[];
  };
  entrants: APIUser[];
};
function Stats({ details, entrants }: StatsProps) {
  return (
    <div className="stats stats-vertical justify-center shadow lg:stats-horizontal">
      {getStats({ details, entrants }).map((stat) => (
        <Stat title={stat.title} value={stat.value} key={stat.title} />
      ))}
    </div>
  );
}

function getStats({ details, entrants }: StatsProps) {
  const formatter = new Intl.NumberFormat("en-US");
  return [
    {
      title: "Participants",
      value: formatter.format(entrants.length),
    },
    {
      title: "Winners",
      value: formatter.format(Number(details.winners)),
    },
    {
      title: "Ended",
      value: formatDistance(new Date(details.time), new Date()) + " ago",
    },
  ];
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default Stats;
