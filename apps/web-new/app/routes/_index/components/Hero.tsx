import { Link } from "@remix-run/react";

export function Hero({ clientId }: { clientId: string }) {
  return (
    <div className="hero min-h-screen xl:min-h-[60vh]">
      <div className="hero-content items-center justify-center px-2 py-10 text-center">
        <div className="max-w-md">
          <h1 className="text-center text-5xl font-black">
            The most popular
            <br />
            <span className="relative bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              giveaway bot
            </span>
            <br />
            on Discord
          </h1>
          <div className="prose py-6">
            <p>
              Trusted by over <strong>2,5 million</strong> servers,{" "}
              <strong>GiveawayBot</strong> is the most popular bot on Discord
              for doing <strong>giveaways</strong>.
            </p>
            <p>
              Invite <strong>GiveawayBot</strong> to your server today and start
              making giveaways!
            </p>
          </div>
          <Link
            to={`https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&scope=bot%20applications.commands`}
            target="_blank"
          >
            <div>
              <button className="btn btn-primary">Get Started</button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
