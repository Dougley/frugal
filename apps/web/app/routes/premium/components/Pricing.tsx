import { Disclosure, Transition } from "@headlessui/react";
import type { ReactElement } from "react";
import type Stripe from "stripe";

export default function PricingDisclosure({
  pricing,
}: {
  pricing: Stripe.Price;
}): ReactElement {
  return (
    <Disclosure>
      {({ open }) => (
        <div
          className={
            "collapse-arrow collapse w-60" + (open ? " collapse-open" : "")
          }
        >
          <Disclosure.Button>
            <p className="collapse-title text-xl">
              {`${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: pricing.currency!,
                currencyDisplay: "symbol",
                notation: "compact",
              }).format(pricing.unit_amount! / 100)} per ${
                pricing.recurring!.interval
              }`}
            </p>
          </Disclosure.Button>
          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="rounded-box m-2 border border-base-300 bg-base-200 p-5">
              <div className="flex flex-col">
                {pricing.currency_options &&
                  Object.keys(pricing.currency_options!)
                    .filter((key) => key !== "eur")
                    .map((key) => (
                      <div
                        className="flex flex-row flex-wrap justify-center"
                        key={key}
                      >
                        <div className="flex flex-col">
                          <p>
                            {`${key.toUpperCase()}: ${new Intl.NumberFormat(
                              "en-US",
                              {
                                style: "currency",
                                currency: key.toUpperCase(),
                              }
                            ).format(
                              pricing.currency_options![
                                key as keyof Stripe.Price.CurrencyOptions
                              ].unit_amount! / 100
                            )}`}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
}
