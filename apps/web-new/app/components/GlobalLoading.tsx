import { Transition, TransitionChild } from "@headlessui/react";
import { useNavigation } from "@remix-run/react";
import { Fragment, Suspense, useMemo } from "react";

const messages = [
  "Thinking about the meaning of life",
  "Contemplating the universe",
  "Waiting for the stars to align",
  "Imagining what it would be like to be a cat",
  "Calculating the meaning of life",
  "Wondering if the universe is a simulation",
  "Asking the universe for answers",
];

function GlobalLoading() {
  const navigationTransition = useNavigation();
  const active = navigationTransition.state !== "idle";
  const loadingLine = useMemo(() => {
    const line = messages[Math.floor(Math.random() * messages.length)];
    return line + "...";
  }, []);

  return (
    <Transition show={active}>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          role="progressbar"
          aria-valuetext={active ? "Loading" : undefined}
          aria-hidden={!active}
          className={`pointer-events-none fixed left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 transform-gpu flex-row flex-wrap justify-center ${
            active ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="loading loading-dots loading-lg" />
            <span className="mx-5 text-lg font-semibold text-base-content">
              <Suspense fallback="Loading...">{loadingLine}</Suspense>
            </span>
          </div>
        </div>
      </TransitionChild>
    </Transition>
  );
}

export { GlobalLoading };
