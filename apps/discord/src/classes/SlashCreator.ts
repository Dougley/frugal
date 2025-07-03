import {
  type AnyRequestData,
  SlashCreator as BaseSlashCreator,
  ComponentContext,
  type ComponentRegisterCallback,
  InteractionType,
  ModalInteractionContext,
  type ModalRegisterCallback,
  type RespondFunction,
} from "slash-create/web";

interface BaseCallback<T> {
  callback: T;
  expires?: number;
  onExpired?: () => void;
}

type ComponentCallback = BaseCallback<ComponentRegisterCallback>;
type ModalCallback = BaseCallback<ModalRegisterCallback>;

export class SlashCreator extends BaseSlashCreator {
  regexComponentHandlers = new Map<RegExp, ComponentCallback>();
  regexModalHandlers = new Map<RegExp, ModalCallback>();

  public addRegexComponentHandler(
    regex: RegExp,
    callback: ComponentRegisterCallback,
    expires?: number,
    onExpired?: () => void
  ) {
    this.regexComponentHandlers.set(regex, { callback, expires, onExpired });
  }

  public addRegexModalHandler(
    regex: RegExp,
    callback: ModalRegisterCallback,
    expires?: number,
    onExpired?: () => void
  ) {
    this.regexModalHandlers.set(regex, { callback, expires, onExpired });
  }

  protected async _onInteraction(
    interaction: AnyRequestData,
    respond: RespondFunction | null,
    webserverMode: boolean,
    serverContext: unknown
  ) {
    switch (interaction.type) {
      case InteractionType.MESSAGE_COMPONENT: {
        const ctx = new ComponentContext(
          this,
          interaction,
          respond!,
          !this.options.disableTimeouts,
          serverContext
        );
        this.cleanRegisteredComponents();

        // Process with our custom handlers first
        for (const [regex, { callback }] of this.regexComponentHandlers) {
          if (regex.test(ctx.customID)) {
            callback(ctx);
            // Note: We don't return here to allow multiple handlers to process the same interaction
          }
        }

        // Always pass to original handler after our custom handlers
        break;
      }
      case InteractionType.MODAL_SUBMIT: {
        const ctx = new ModalInteractionContext(
          this,
          interaction,
          respond!,
          !this.options.disableTimeouts,
          serverContext
        );
        this.cleanRegisteredComponents();

        // Process with our custom handlers first
        for (const [regex, { callback }] of this.regexModalHandlers) {
          if (regex.test(ctx.customID)) {
            callback(ctx);
            // Note: We don't return here to allow multiple handlers to process the same interaction
          }
        }

        // Always pass to original handler after our custom handlers
        break;
      }
    }

    // Pass the interaction to the parent handler regardless
    return super._onInteraction(
      interaction,
      respond,
      webserverMode,
      serverContext
    );
  }
}
