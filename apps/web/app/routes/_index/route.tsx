import type { LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LuArrowBigDown } from "react-icons/lu";
import { defaultMeta } from "~/utils/meta";
import { Closing } from "./components/Closing";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { Hero } from "./components/Hero";
import { Testimonial } from "./components/Testimonial";

export const meta: V2_MetaFunction = () => {
  return defaultMeta();
};

export const loader = async ({ context }: LoaderArgs) => {
  return context.DISCORD_CLIENT_ID;
};

export default function Index() {
  const clientId = useLoaderData() as string;
  return (
    <>
      <Hero clientId={clientId} />
      <div className="flex flex-col items-center justify-start">
        <a href="#features">
          <button className="btn-primary btn mb-12 hidden animate-bounce rounded-full xl:block">
            <LuArrowBigDown className="h-6 w-6" />
          </button>
        </a>
        <div
          className="flex w-full flex-col items-center justify-center lg:flex-row"
          id="features"
        >
          <div className="mx-auto w-full max-w-[1240px] xl:p-12 xl:w-1/2">
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
              We get it, managing giveaways can be a hassle. But fear not,
              because GiveawayBot is here to make it a cakewalk. From wrangling
              entries to picking winners, it's like having a personal assistant
              who knows how to juggle without dropping the balls. Kick back,
              relax, and let the bot do the heavy lifting.
            </FeatureShowcase>
          </div>
          <div className="mx-auto w-full max-w-[1240px] xl:p-12 xl:w-1/2">
            <FeatureShowcase
              title="Discord BFF Status Achieved"
              image="https://placehold.co/600x400"
            >
              GiveawayBot and Discord are like two peas in a pod. They go
              together like pizza and cheese or memes and laughter. With
              seamless integration, GiveawayBot becomes your server's best
              friend forever, making giveaways feel like a native part of your
              Discord experience. It's a match made in bot heaven!
            </FeatureShowcase>
            <FeatureShowcase
              title="More Fun, Less Boredom"
              image="https://placehold.co/600x400"
            >
              Giveaways aren't just about prizes; they're about injecting life
              and laughter into your Discord server. GiveawayBot brings the fun
              factor on steroids, transforming your server into a playground of
              excitement. Prepare for wild conversations, lively banter, and a
              community that never wants to hit the snooze button.
            </FeatureShowcase>
          </div>
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
                avatar="https://cdn.discordapp.com/avatars/66161308789121024/92fdb20bee012b04578e199588a829dd.png"
              >
                they weren't lying this giveawaybot can give away
              </Testimonial>
              <Testimonial
                user="Dougley"
                server="Dougley's Very Cool Server"
                avatar="https://cdn.discordapp.com/avatars/107904023901777920/a48c81d4e17763ad97f0161c4aecd131.png"
              >
                i made this so it must be good
              </Testimonial>
            </div>
          </div>
        </div>
      </div>
      <Closing clientId={clientId} />
    </>
  );
}
