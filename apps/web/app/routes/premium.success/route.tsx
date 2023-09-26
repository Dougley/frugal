import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { useEffect } from "react";
import Confetti from "react-confetti";
import { LuCheckCircle } from "react-icons/lu";
import { defaultMeta } from "~/utils/meta";

export const meta: MetaFunction = () => {
  return defaultMeta();
};

export default function Page() {
  useEffect(() => {
    (() => {
      // wow! this is a lot of code for something so simple!
      const observer = new ResizeObserver((entries) => {
        const confetti = document.getElementById(
          "confetti",
        ) as HTMLCanvasElement;
        if (confetti) {
          confetti.width = entries[0].contentRect.width;
          confetti.height = entries[0].contentRect.height;
        }
      });
      // as the body resizes, resize the confetti's canvas
      observer.observe(document.body);
    })();
  }, []);

  return (
    <>
      <Confetti // really i just thought this would be cool
        className="motion-reduce:hidden"
        id="confetti"
        width={2000} // we change this later
        height={2000} // and this
        style={{
          zIndex: -1,
        }}
      />
      <div className="grid min-h-screen grid-cols-1 gap-4 p-4">
        <div className="hero justify-center">
          <div className="hero-content col-span-1 grid rounded-xl bg-base-200 bg-opacity-80 p-8 text-center shadow-xl backdrop-blur">
            <div className="flex flex-col items-center justify-center">
              <LuCheckCircle className="text-success" size={64} />
            </div>
            <div className="max-w-md">
              <h1 className="text-5xl font-black text-success">Awesome!</h1>
              <p className="mt-5 text-xl">
                You have successfully subscribed to GiveawayBot Premium! Thank
                you for your support!
              </p>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center">
              <Link className="btn btn-primary" to="/">
                Go back home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
