import { Transition } from "@headlessui/react";
import * as AlertDialogPrimitive from "@radix-ui/react-dialog";
import { Await, Form, useLoaderData } from "@remix-run/react";
import type { ReactElement } from "react";
import { Fragment, Suspense, useState } from "react";
import { LuBanana, LuFlame, LuGem, LuPlus } from "react-icons/lu";
import type Stripe from "stripe";
import { StripeClimateBadge } from "./StripeClimateBadge";

export default function StripeRedirectModal(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const { pricing } = useLoaderData() as {
    pricing: {
      [key: string]: { data: Stripe.Price[] };
    };
  };
  return (
    <AlertDialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setReady(false);
      }}
    >
      <AlertDialogPrimitive.Trigger asChild>
        <button className="btn btn-primary m-2">Subscribe</button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal forceMount>
        <Transition.Root show={isOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <AlertDialogPrimitive.Overlay
              forceMount
              className="fixed inset-0 z-20 bg-black/50"
            />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <AlertDialogPrimitive.Content
              forceMount
              className="modal modal-open modal-bottom sm:modal-middle"
            >
              <Suspense fallback={<span>Loading...</span>}>
                <Await resolve={pricing}>
                  <Form
                    method="post"
                    action="/premium?index"
                    onSubmit={(event) => {
                      setIsOpen(false);
                    }}
                  >
                    <div className="modal-box">
                      <AlertDialogPrimitive.Title className="text-lg font-bold">
                        Pick a plan
                      </AlertDialogPrimitive.Title>
                      <div className="form-control flex-wrap justify-center">
                        {/* for each plan, render a radio button with the price per plan */}
                        <div className="form-control m-2">
                          {Object.keys(pricing).map((key) => (
                            <label key={key} className="label">
                              <div className="flex flex-col flex-wrap">
                                <PlanBranding {...pricing[key].data[0]} />
                                <span className="text-sm">
                                  {new Intl.ListFormat("en-US", {
                                    style: "short",
                                    type: "disjunction",
                                  }).format(
                                    pricing[key].data.map(
                                      (price) =>
                                        `${new Intl.NumberFormat("en-US", {
                                          style: "currency",
                                          currency: price.currency!,
                                          currencyDisplay: "symbol",
                                        }).format(
                                          price.unit_amount! / 100,
                                        )} per ${price.recurring!.interval}`,
                                    ),
                                  )}
                                </span>
                                <span className="text-sm opacity-50">
                                  (or regional equivalent, if available)
                                </span>
                              </div>
                              <input
                                type="radio"
                                name="priceId"
                                value={
                                  (
                                    pricing[key].data[0]
                                      .product as Stripe.Product
                                  ).default_price as string
                                }
                                className="radio"
                                onChange={() => setReady(true)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <p className="mb-4 text-sm">
                        1% of all proceeds go to
                        <a
                          href="https://climate.stripe.com/GhYWr6"
                          className="link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <StripeClimateBadge className="mx-1 inline h-4 w-4" />
                          Stripe Climate
                        </a>{" "}
                        to help offset carbon emissions.
                      </p>
                      <p className="text-sm opacity-50">
                        By continuing, you agree to our{" "}
                        <a
                          href="https://dougley.com/discord/terms"
                          className="link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Terms of Service
                        </a>
                        ,{" "}
                        <a
                          href="https://dougley.com/discord/privacy"
                          className="link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Privacy Policy
                        </a>
                        , and{" "}
                        <a
                          href="https://dougley.com/discord/paid-services"
                          className="link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Paid Services Agreement
                        </a>
                      </p>
                      <div className="modal-action">
                        <AlertDialogPrimitive.Close className="btn">
                          Cancel
                        </AlertDialogPrimitive.Close>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!ready}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </Form>
                </Await>
              </Suspense>
            </AlertDialogPrimitive.Content>
          </Transition.Child>
        </Transition.Root>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

function PlanBranding(price: Stripe.Price) {
  const name = (price.product as Stripe.Product).name.split(" ");
  const color = (() => {
    switch (name[1]) {
      case "Premium":
        return "secondary";
      case "Ultra":
        return "accent";
      default:
        return "primary";
    }
  })();
  const Icon = (() => {
    switch (name[1]) {
      case "Ultra":
        return LuFlame;
      case "Premium":
        return LuGem;
      case "Plus":
        return LuPlus;
      default:
        return LuBanana;
    }
  })();
  return (
    <span className="text-lg font-bold">
      <Icon className={`mr-2 inline h-6 w-6 text-${color}`} />
      {name[0]} <span className={`text-${color}`}>{name[1]}</span>
    </span>
  );
}
