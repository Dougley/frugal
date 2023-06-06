import * as Avatar from "@radix-ui/react-avatar";
import { useRouteLoaderData } from "@remix-run/react";
import type { APIUser } from "discord-api-types/v9";
import type { ReactElement } from "react";
import { LuPartyPopper } from "react-icons/lu";
import type { DiscordUser } from "~/services/authenticator.server";

type winnnersTableProps = {
  winners: string[];
  participants: APIUser[];
};
function WinnersTable({
  winners,
  participants,
}: winnnersTableProps): ReactElement {
  const data = useRouteLoaderData("root") as DiscordUser | null;
  const formatter = new Intl.NumberFormat("en-US");
  return (
    <>
      {(winners.length > 0 && (
        <table className="table-zebra table w-full">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Username</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {participants
              .filter((x) => winners.includes(x.id))
              .map((entrant, index) => (
                <tr key={entrant.id}>
                  <th>{formatter.format(index + 1)}</th>
                  <td>
                    <a href={`discord:///users/${entrant.id}`}>
                      <AvatarContainer user={entrant} />
                    </a>
                  </td>
                  <td>
                    {entrant.discriminator === "0" || !entrant.discriminator
                      ? `@${entrant.username}`
                      : `${entrant.username}#${entrant.discriminator}`}
                    {data && data.id === entrant.id && (
                      <>
                        <br></br>
                        <span className="text-gray-500">
                          That's you! <LuPartyPopper className="inline" />
                        </span>
                      </>
                    )}
                  </td>
                  <td>{entrant.id}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )) || <div className="text text-center">Nobody!</div>}
    </>
  );
}

type AvatarProps = {
  user: APIUser;
};
function AvatarContainer({ user }: AvatarProps) {
  return (
    <div className="h-16 w-16">
      <Avatar.Root className="avatar">
        <Avatar.Image
          className="rounded-full"
          src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
          alt="avatar"
        />
        <Avatar.Fallback delayMs={600}>
          <img
            className="rounded-full"
            src={`https://cdn.discordapp.com/embed/avatars/${
              // pomelo 🍊
              Math.abs(((user.id as any) >> 22) % 5)
            }.png`}
            alt="avatar"
          />
        </Avatar.Fallback>
      </Avatar.Root>
    </div>
  );
}

export default WinnersTable;
