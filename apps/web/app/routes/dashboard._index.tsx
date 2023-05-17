import * as Avatar from "@radix-ui/react-avatar";
import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { MdPerson, MdQuestionMark } from "react-icons/md";
import type { Authenticator } from "remix-auth";
import type { DiscordUser } from "~/services/authenticator.server";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context, request }: LoaderArgs) => {
  return (context.authenticator as Authenticator).isAuthenticated(request, {
    failureRedirect: "/login",
  });
};

export default function Index() {
  const user = useLoaderData() as DiscordUser;
  return (
    <div className="flex min-h-screen flex-col justify-center overflow-x-auto">
      <h1 className="m-5 text-center text-4xl font-semibold">
        GiveawayBot Dashboard
      </h1>
      <div className="alert m-auto w-96 shadow-lg">
        <div>
          <MdQuestionMark className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="text-xl font-semibold">Missing servers?</p>
            <div className="text-xs">
              We're only showing servers you own or have "Manage Server"
              permissions in, for privacy reasons.
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-wrap justify-center">
        {user.guilds
          .filter(
            (g) =>
              g.owner || (BigInt(g.permissions) & BigInt(0x20)) == BigInt(0x20)
          )
          .map((guild) => (
            <a
              href={`/dashboard/${guild.id}`}
              key={guild.id}
              className="card btn m-4 h-auto w-96 bg-base-300 p-4 normal-case shadow-xl"
            >
              <figure>
                <div className="h-32 w-32">
                  <Avatar.Root className="avatar">
                    <Avatar.Image
                      className="rounded-full"
                      src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                    />
                    <Avatar.Fallback delayMs={600}>
                      <img
                        className="rounded-full"
                        src={`https://cdn.discordapp.com/embed/avatars/${Math.abs(
                          // this isnt strictly correct but it's close enough
                          ((guild.id as any) >> 22) % 5
                        )}.png`}
                        alt="avatar"
                      />
                    </Avatar.Fallback>
                  </Avatar.Root>
                </div>
              </figure>
              <div className="card-body items-center text-center">
                <p className="card-title">{guild.name}</p>
                <p className="text-xs">{guild.id}</p>
                <div className="card-actions">
                  {guild.owner && (
                    <span className="badge-ghost badge-outline badge">
                      <MdPerson className="mr-1 inline-block h-4 w-4" />
                      Owner
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
