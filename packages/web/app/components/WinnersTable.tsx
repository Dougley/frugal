import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import type { APIUser } from 'discord-api-types/v9';

type winnnersTableProps = {
  winners: string[];
  participants: APIUser[];
};
function WinnersTable({
  winners,
  participants,
}: winnnersTableProps): ReactElement {
  const formatter = new Intl.NumberFormat('en-US');
  console.log(winners, participants);
  return (
    <>
      {(winners.length > 0 && (
        <table className="table table-zebra w-full">
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
              .map((entrant, index) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const [avatar, setAvatar] = useState(
                  `https://cdn.discordapp.com/embed/avatars/${
                    Number(entrant.discriminator) % 5
                  }.png`
                );
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                  if (entrant.avatar) {
                    fetch(
                      `https://cdn.discordapp.com/avatars/${entrant.id}/${entrant.avatar}.png`,
                      {
                        method: 'HEAD',
                      }
                    ).then((x) => {
                      if (x.ok) {
                        setAvatar(
                          `https://cdn.discordapp.com/avatars/${entrant.id}/${entrant.avatar}.png`
                        );
                      }
                    });
                  }
                }, [entrant.avatar, entrant.id]);
                return (
                  <tr key={entrant.id}>
                    <th>{formatter.format(index + 1)}</th>
                    <td>
                      <div className="avatar placeholder">
                        <div className="w-16 rounded-full">
                          <img alt="Avatar" src={avatar} />
                        </div>
                      </div>
                    </td>
                    <td>{`${entrant.username}#${entrant.discriminator}`}</td>
                    <td>{entrant.id}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )) || <div className="text text-center">Nobody!</div>}
    </>
  );
}

export default WinnersTable;
