import { Link } from "@remix-run/react";

export function Closing({ clientId }: { clientId: string }) {
  return (
    <div className="hero min-h-[50vh]">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h2 className="text-center text-4xl font-black leading-[42px]">
            What are you waiting for?
          </h2>
          <p className="text-dark-300 my-8 whitespace-pre-line">
            GiveawayBot is the ultimate giveaway bot for Discord servers.
          </p>
          <Link
            to={`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&scope=bot%20applications.commands`}
            target="_blank"
          >
            <button className="btn-primary btn">Get Started</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
