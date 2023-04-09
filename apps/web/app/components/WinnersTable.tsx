import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { GiPartyPopper } from 'react-icons/gi';
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
  const [me, setMe] = useState<APIUser | null>(null);
  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      setMe(participants.find((x) => x.id === user) ?? null);
    }
  }, [participants]);
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
              .map((entrant, index) => (
                <tr key={entrant.id}>
                  <th>{formatter.format(index + 1)}</th>
                  <td>
                    <a href={`discord:///users/${entrant.id}`}>
                      <Avatar user={entrant} />
                    </a>
                  </td>
                  <td>
                    {`${entrant.username}#${entrant.discriminator}`}
                    {me && me.id === entrant.id && (
                      <>
                        <br></br>
                        <span className="text-gray-500">
                          That's you! <GiPartyPopper className="inline" />
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
function Avatar({ user }: AvatarProps) {
  const [avatar, setAvatar] = useState<string>(
    `https://cdn.discordapp.com/embed/avatars/${
      Number(user.discriminator) % 5
    }.png`
  );
  useEffect(() => {
    if (!user.avatar) return;
    const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    fetch(avatarURL, {
      method: 'HEAD',
    }).then((res) => {
      if (res.ok) {
        setAvatar(avatarURL);
      }
    });
  }, [user]);
  return (
    <div className="avatar placeholder">
      <div className="w-16 rounded-full">
        <img
          className="avatar"
          src={avatar}
          alt={`${user.username}#${user.discriminator}`}
        />
      </div>
    </div>
  );
}

export default WinnersTable;
