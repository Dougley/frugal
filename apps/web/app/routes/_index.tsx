import type { V2_MetaFunction } from "@remix-run/node";
import { defaultMeta } from "~/utils/meta";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export default function Index() {
  return (
    <div className="hero min-h-screen justify-center">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">GiveawayBot</h1>
          <p className="py-6">
            Hold giveaways on your Discord server quickly and easily
          </p>
          <a href="https://discord.com/api/oauth2/authorize?client_id=1033754043660652605&permissions=0&scope=bot%20applications.commands">
            <button className="btn-primary btn">Get Started</button>
          </a>
        </div>
      </div>
    </div>
  );
}
