import type { ReactElement } from 'react';
import type { APIUser } from 'discord-api-types/v9';

type participantsTableProps = {
  participants: APIUser[];
};
function ParticipantsTable({
  participants,
}: participantsTableProps): ReactElement {
  const formatter = new Intl.NumberFormat('en-US');
  return (
    <>
      {(participants.length > 0 && (
        <table className="table table-compact w-full">
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
                <td>{`${entrant.username}#${entrant.discriminator}`}</td>
                <td>{entrant.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )) || <div className="text text-center">Nobody!</div>}
    </>
  );
}

export default ParticipantsTable;
