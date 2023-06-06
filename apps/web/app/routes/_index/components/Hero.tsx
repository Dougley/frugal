import { Link } from "@remix-run/react";

export function Hero({ clientId }: { clientId: string }) {
  return (
    <div className="hero shrink xl:sticky xl:inset-16 xl:w-1/2">
      <div className="hero-content min-h-[calc(100vh-4rem)] items-center justify-center px-2 py-10 text-center xl:justify-start xl:pl-10 xl:pr-0 xl:text-left">
        <div className="max-w-md">
          <h1 className="text-center text-5xl font-black">
            The most popular
            <br />
            <span
              className="relative bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
            >
              giveaway bot
            </span>
            <br />
            on Discord
          </h1>
          <div className="prose py-6">
            <p>
              Trusted by over <strong>2,500,000</strong> servers,{" "}
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
            <button className="btn-primary btn">Get Started</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
