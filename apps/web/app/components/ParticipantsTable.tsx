import type { APIUser } from "discord-api-types/v9";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

type participantsTableProps = {
  participants: APIUser[];
};
function ParticipantsTable({
  participants,
}: participantsTableProps): ReactElement {
  const formatter = new Intl.NumberFormat("en-US");
  const [me, setMe] = useState<APIUser | null>(null);
  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (user) {
      setMe(participants.find((x) => x.id === user) ?? null);
    }
  }, [participants]);

  return (
    <>
      {participants.length > 0 ? (
        <table className="table-compact table w-full">
          <thead>
            <tr>
              <th></th>
              <th>Userame</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((entrant, index) => (
              <tr key={entrant.id}>
                <th>{formatter.format(index + 1)}</th>
                <td>
                  {`${entrant.username}#${entrant.discriminator}`}
                  {me && me.id === entrant.id && (
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
    </>
  );
}

export default ParticipantsTable;
