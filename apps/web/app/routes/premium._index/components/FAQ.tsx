import { Disclosure, Transition } from "@headlessui/react";
import type { ReactElement } from "react";

export function FAQItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): ReactElement {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`collapse collapse-plus my-2 flex w-full justify-between rounded-lg bg-base-200 px-4 py-2 text-left text-sm font-medium hover:bg-base-100 focus:outline-none focus-visible:ring focus-visible:ring-opacity-75 ${
              open ? "collapse-open" : ""
            }`}
          >
            <p className="collapse-title">{title}</p>
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel
              className="rounded-box m-2 border border-base-300 bg-base-200 p-5"
              unmount
            >
              <div className="flex flex-col">{children}</div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}

export function FAQList({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return <div className="mx-auto w-full max-w-lg grow px-2">{children}</div>;
}

export default function FAQ() {
  return (
    <>
      <FAQList>
        <FAQItem title="What is GiveawayBot Premium?">
          <p>
            GiveawayBot Premium is a subscription that unlocks the full
            potential of GiveawayBot. With Premium, you can run longer
            giveaways, have more winners, and unlock more features to
            supercharge your giveaways!
          </p>
        </FAQItem>
        <FAQItem title="Why aren't you using Discord's own subscription service?">
          <p>
            While Discord's own subscription service is great, the fees are too
            high for us to offer Premium at a reasonable price. We want to make
            Premium as accessible as possible, and we can't do that with
            Discord's subscription service at this time.
          </p>
        </FAQItem>
        <FAQItem title="How do I pay for GiveawayBot Premium?">
          <p>
            GiveawayBot Premium is paid for through Stripe, a secure payment
            processor. You can pay with any major credit card, debit card,
            PayPal, or with Apple Pay or Google Pay.
          </p>
        </FAQItem>
        <FAQItem title="How do I cancel my subscription?">
          <p>
            You can cancel your subscription at any time by clicking the "Cancel
            subscription" button above. You will continue to have access to
            Premium until the end of your billing period.
          </p>
        </FAQItem>
      </FAQList>
      <FAQList>
        <FAQItem title="What is the difference between the plans?">
          <p>
            The main difference between the plans is the number of giveaways you
            can run at once, the duration of the giveaways, and the number of
            winners you can have. The Ultra plan also unlocks the ability to
            automatically send messages to the winners of your giveaways.
          </p>
        </FAQItem>
        <FAQItem title="Can I upgrade or downgrade my plan?">
          <p>
            Yes! You can upgrade or downgrade your plan at any time. You will
            only be charged the difference between the two plans.
          </p>
        </FAQItem>
        <FAQItem title="What happens if I cancel my subscription?">
          <p>
            If you cancel your subscription, you will continue to have access to
            Premium until the end of your billing period. After that, you will
            lose access to Premium features.
          </p>
        </FAQItem>
        <FAQItem title="How many servers does my subscription cover?">
          <p>
            Your subscription covers all servers you personally own, meaning you
            have to be the owner of the server for it to be covered by your
            subscription. If you are not the owner of a server, you can still
            run giveaways in that server, but it will not be covered by your
            subscription.
          </p>
        </FAQItem>
      </FAQList>
    </>
  );
}
