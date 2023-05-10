import { useRouteLoaderData } from "@remix-run/react";
import type { APIUser } from "discord-api-types/v9";
import type { ReactElement } from "react";
import type { DiscordUser } from "~/services/authenticator.server";

type participantsTableProps = {
  participants: APIUser[];
};
function ParticipantsTable({
  participants,
}: participantsTableProps): ReactElement {
  const data = useRouteLoaderData("root") as DiscordUser | null;
  const formatter = new Intl.NumberFormat("en-US");

  return (
    <div className="collapse-arrow rounded-box collapse border border-base-300 bg-base-100">
      <input type="checkbox" />
      <div className="collapse-title text-xl font-medium">
        Participants ({formatter.format(participants.length)})
      </div>
      <div className="collapse-content">
        {participants.length > 0 ? (
          <table className="table-compact table w-full">
            <thead>
              <tr>
                <th></th>
                <th>Username</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((entrant, index) => (
                <tr key={entrant.id}>
                  <th>{formatter.format(index + 1)}</th>
                  <td>
                    {`${entrant.username}#${entrant.discriminator}`}
                    {data && data.id === entrant.id && (
                      <>
                        <br></br>
                        <span className="text-gray-500">That's you!</span>
                      </>
                    )}
                  </td>
                  <td>{entrant.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text text-center">Nobody!</div>
        )}
      </div>
    </div>
  );
}

export default ParticipantsTable;
