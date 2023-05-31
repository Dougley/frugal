import { Transition } from "@headlessui/react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { Form } from "@remix-run/react";
import type { ReactElement } from "react";
import { Fragment, useState } from "react";

export default function StripeRedirectModal({
  priceId,
}: {
  priceId: string;
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <button className="btn-primary btn m-2">Subscribe</button>
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
              <div className="modal-box">
                <AlertDialogPrimitive.Title className="text-lg font-bold">
                  You're about to be redirected
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="prose">
                  <p>
                    In order to complete your purchase, you'll be redirected to
                    our payment processor, Stripe.
                  </p>
                </AlertDialogPrimitive.Description>
                <div className="modal-action">
                  <AlertDialogPrimitive.Cancel className="btn">
                    Cancel
                  </AlertDialogPrimitive.Cancel>
                  <Form method="post" action="/premium?index">
                    <input type="hidden" name="priceId" value={priceId} />
                    <AlertDialogPrimitive.Action
                      type="submit"
                      className="btn-primary btn"
                    >
                      Confirm
                    </AlertDialogPrimitive.Action>
                  </Form>
                </div>
              </div>
            </AlertDialogPrimitive.Content>
          </Transition.Child>
        </Transition.Root>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
