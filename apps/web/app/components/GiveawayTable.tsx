import * as Avatar from "@radix-ui/react-avatar";
import { Link, useLoaderData } from "@remix-run/react";
import formatDistance from "date-fns/formatDistance";
import isPast from "date-fns/isPast";
import { PermissionFlags, PermissionsBitField } from "discord-bitflag";
import type { ReactElement } from "react";
import React from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuPartyPopper,
} from "react-icons/lu";
import type { DiscordUser } from "~/services/authenticator.server";

type GiveawayTableProps = {
  title?: string;
  data: {
    durable_object_id: string;
    message_id: string;
    end_time: string;
    prize: string;
    winners: number;
    guild_id: string;
  }[];
};

function ViewButton({
  giveaway,
}: {
  giveaway: GiveawayTableProps["data"][number];
}) {
  const { user, premium } = useLoaderData<{
    user: DiscordUser;
    premium: {
      discord_user_id: string;
      active: boolean;
    };
  }>();

  // Determine if the giveaway has ended or not
  const ended = isPast(new Date(giveaway.end_time));

  // Determine if the user has permission to manage the guild the giveaway was hosted in
  const managableGuilds = user.guilds.filter((g) =>
    new PermissionsBitField(Number(g.permissions)).has(
      PermissionFlags.ManageGuild,
    ),
  );

  // If the giveaway has ended, show a button to view the giveaway summary
  if (ended) {
    return (
      <Link to={`/summaries/${giveaway.durable_object_id}`}>
        <button className="btn">View</button>
      </Link>
    );
  }

  // If the user is premium and can manage the guild, show a button to view the giveaway
  if (
    premium.active &&
    managableGuilds.some((g) => g.id === giveaway.guild_id)
  ) {
    return (
      <Link to={`/giveaways/${giveaway.message_id}`}>
        <button className="btn">View</button>
      </Link>
    );
  } else {
    // If the user is not premium, show a button to upgrade to premium
    if (!premium.active) {
      return (
        <div
          className="tooltip"
          data-tip="You can view the summary once the giveaway has ended. Upgrade to premium to view the summary now."
        >
          <Link to="/premium">
            <button className="btn btn-disabled">View</button>
          </Link>
        </div>
      );
    } else {
      // If the user is premium but cannot manage the guild, show a button to upgrade to premium
      return (
        <div
          className="tooltip"
          data-tip="You cannot view the summary because you do not have permission to manage the guild this giveaway was hosted in."
        >
          <button className="btn btn-disabled">View</button>
        </div>
      );
    }
  }
}

function GiveawayTable({ data, title }: GiveawayTableProps): ReactElement {
  const { user } = useLoaderData<{
    user: DiscordUser;
  }>();
  const pages = Math.ceil(data.length / 10);
  const [page, setPage] = React.useState(1);

  if (!data || data.length === 0) {
    return (
      <div className="">
        {title && (
          <h2 className="self-start text-2xl font-semibold">{title}</h2>
        )}
        <div className="flex flex-col items-center justify-center lg:min-h-screen">
          <div className="mx-auto my-4 flex min-w-max place-self-center">
            <div className="my-auto content-center text-center">
              <LuPartyPopper className="mx-auto h-12 w-12" />
              <h2 className="text-2xl font-semibold">No giveaways found</h2>
              <p className="opacity-50">
                Nothing here but us chickens, try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h2 className="mb-8 text-2xl font-semibold">{title}</h2>}
      <table className="table">
        <thead>
          <tr>
            <th>Giveaway</th>
            <th>Guild</th>
            <th className="hidden xl:table-cell">Winners</th>
            <th className="hidden lg:table-cell">Ends</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.slice((page - 1) * 10, page * 10).map((giveaway) => {
            const guild = user.guilds.find(
              (guild) => guild.id === giveaway.guild_id,
            ) ?? {
              id: "0",
              name: "Unknown",
              icon: null,
            };
            const distance = formatDistance(
              new Date(giveaway.end_time),
              new Date(),
              {
                addSuffix: true,
              },
            );
            const ended = isPast(new Date(giveaway.end_time));

            return (
              <tr key={giveaway.durable_object_id}>
                <td>
                  {(ended && (
                    <Link to={`/summaries/${giveaway.durable_object_id}`}>
                      <div>
                        <span>{giveaway.prize}</span>
                      </div>
                    </Link>
                  )) || (
                    <div>
                      <span>{giveaway.prize}</span>
                    </div>
                  )}
                </td>
                <td>
                  <Link to={`/guilds/${guild.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="avatar hidden h-12 w-12 md:block">
                        <Avatar.Root className="mask mask-squircle h-12 w-12">
                          <Avatar.Image
                            src={
                              guild.icon === null
                                ? `https://cdn.discordapp.com/embed/avatars/${Math.abs(
                                    // this isnt strictly correct but it's close enough
                                    ((guild.id as any) >> 22) % 5,
                                  )}.png`
                                : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                            }
                            alt={guild.name}
                          />
                          <Avatar.Fallback delayMs={600}>
                            <img
                              src={`https://cdn.discordapp.com/embed/avatars/${Math.abs(
                                // this isnt strictly correct but it's close enough
                                ((guild.id as any) >> 22) % 5,
                              )}.png`}
                              alt="avatar"
                            />
                          </Avatar.Fallback>
                        </Avatar.Root>
                      </div>
                      <div>
                        <div className="font-bold">
                          {guild.name.length > 20
                            ? guild.name.slice(0, 20) + "..."
                            : guild.name}
                        </div>
                      </div>
                    </div>
                  </Link>
                </td>
                <td className={"hidden xl:table-cell"}>
                  {giveaway.winners.toLocaleString()}
                </td>
                <td className={"hidden lg:table-cell"}>{distance}</td>
                <td>
                  <ViewButton giveaway={giveaway} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-4 flex justify-center">
        <div className="join shadow-lg">
          <button
            className={"btn join-item" + (page === 1 ? " btn-disabled" : "")}
            onClick={() => {
              if (page === 1) return;
              setPage(1);
            }}
          >
            <LuChevronsLeft />
          </button>
          <button
            className={"btn join-item" + (page === 1 ? " btn-disabled" : "")}
            onClick={() => {
              if (page === 1) return;
              setPage(page - 1);
            }}
          >
            <LuChevronLeft />
          </button>
          <button className="btn btn-ghost join-item lg:btn-wide">
            {page} / {pages}
          </button>
          <button
            className={
              "btn join-item" + (page === pages ? " btn-disabled" : "")
            }
            onClick={() => {
              if (page === pages) return;
              setPage(page + 1);
            }}
          >
            <LuChevronRight />
          </button>
          <button
            className={
              "btn join-item" + (page === pages ? " btn-disabled" : "")
            }
            onClick={() => {
              if (page === pages) return;
              setPage(pages);
            }}
          >
            <LuChevronsRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GiveawayTable;
