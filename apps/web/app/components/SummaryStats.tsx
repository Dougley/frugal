/// <reference types="@dougley/types/summaries" />

import formatDistance from "date-fns/formatDistance";

function Stats({
  details,
  entries,
}: Pick<SummaryOutput, "details" | "entries">) {
  return (
    <div className="stats stats-vertical justify-center shadow lg:stats-horizontal">
      {getStats({ details, entries }).map((stat) => (
        <Stat title={stat.title} value={stat.value} key={stat.title} />
      ))}
    </div>
  );
}

function getStats({
  details,
  entries,
}: Pick<SummaryOutput, "details" | "entries">) {
  const formatter = new Intl.NumberFormat("en-US");
  return [
    {
      title: "Participants",
      value: formatter.format(entries.length),
    },
    {
      title: "Winners",
      value: formatter.format(Number(details.winners)),
    },
    {
      title: "End Time",
      value: formatDistance(new Date(details.time.end), new Date(), {
        addSuffix: true,
      }),
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
