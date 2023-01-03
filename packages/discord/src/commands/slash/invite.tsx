import {
  Button,
  CommandHandler,
  createElement,
  Message,
  Row,
  useDescription,
} from "slshx";

export function invite(): CommandHandler<Env> {
  useDescription("Get an invite link for the bot");
  return (interaction, env, ctx) => {
    return (
      <Message>
        Invite me to your server! Click the link below, and then click
        "Authorize" in the popup.
        <Row>
          <Button
            url={`https://discord.com/oauth2/authorize?client_id=${SLSHX_APPLICATION_ID}&scope=applications.commands%20bot`}
          >
            Invite
          </Button>
        </Row>
      </Message>
    );
  };
}
