import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { LuArrowBigDown } from "react-icons/lu";
import { defaultMeta } from "~/utils/meta";
import { Closing } from "./components/Closing";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { Hero } from "./components/Hero";
import { Testimonial } from "./components/Testimonial";

export const meta: MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  return context.cloudflare.env.DISCORD_CLIENT_ID;
};

export default function Index() {
  const clientId = useLoaderData<string>();
  return (
    <>
      <Hero clientId={clientId} />
      <div className="flex flex-col items-center justify-start">
        <div>
          <button className="btn btn-primary mb-12 hidden animate-bounce rounded-full xl:block">
            <a href="#features">
              <LuArrowBigDown className="h-6 w-6" />
            </a>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" id="features">
          <FeatureShowcase
            title="Effortless Giveaways in a Snap"
            image="https://placehold.co/600x400"
          >
            GiveawayBot is as easy to set up as pouring a bowl of cereal. No
            complicated instructions or technical mumbo-jumbo. Just a few
            clicks, and voila! You're ready to rock those giveaways and dazzle
            your Discord community!
          </FeatureShowcase>
          <FeatureShowcase
            title="Manage like a Pro, Relax like a Sloth"
            image="https://placehold.co/600x400"
          >
            We get it, managing giveaways can be a hassle. But fear not, because
            GiveawayBot is here to make it a cakewalk. From wrangling entries to
            picking winners, it's like having a personal assistant who knows how
            to juggle without dropping the balls. Kick back, relax, and let the
            bot do the heavy lifting.
          </FeatureShowcase>
          <FeatureShowcase
            title="Discord BFF Status Achieved"
            image="https://placehold.co/600x400"
          >
            GiveawayBot and Discord are like two peas in a pod. They go together
            like pizza and cheese or memes and laughter. With seamless
            integration, GiveawayBot becomes your server's best friend forever,
            making giveaways feel like a native part of your Discord experience.
            It's a match made in bot heaven!
          </FeatureShowcase>
          <FeatureShowcase
            title="More Fun, Less Boredom"
            image="https://placehold.co/600x400"
          >
            Giveaways aren't just about prizes; they're about injecting life and
            laughter into your Discord server. GiveawayBot brings the fun factor
            on steroids, transforming your server into a playground of
            excitement. Prepare for wild conversations, lively banter, and a
            community that never wants to hit the snooze button.
          </FeatureShowcase>
        </div>
      </div>
      <div className="py-10">
        <div className="mx-auto w-full max-w-[1240px] p-6">
          <h2 className="text-center text-4xl font-black leading-[42px]">
            Not convinced yet?
          </h2>
          <p className="text-dark-300 my-8 whitespace-pre-line text-center">
            See what our users have to say about us!
          </p>
          <div className="flex flex-col items-center justify-center">
            <div className="grid grid-cols-4 flex-wrap gap-4">
              <Testimonial
                user="Jamiea"
                server="Jamiea's Server"
                avatar="https://cdn.discordapp.com/embed/avatars/0.png"
              >
                they weren't lying this giveawaybot can give away
              </Testimonial>
              <Testimonial
                user="Dougley"
                server="Dougley's Very Cool Server"
                avatar="https://cdn.discordapp.com/embed/avatars/1.png"
              >
                i made this so it must be good
              </Testimonial>
              <Testimonial
                user="bup"
                server="terriblecord"
                avatar="https://cdn.discordapp.com/embed/avatars/2.png"
              >
                i think it looks decent
              </Testimonial>
            </div>
          </div>
        </div>
      </div>
      <Closing clientId={clientId} />
    </>
  );
}
