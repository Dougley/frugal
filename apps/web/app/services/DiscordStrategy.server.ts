import type { APIUser } from "discord-api-types/v9";
import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import { OAuth2Strategy } from "remix-auth-oauth2";

export interface DiscordStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
  prompt?: "none" | "consent";
}

export interface DiscordExtraParams extends Record<string, string | number> {
  expires_in: 604_800;
  token_type: "Bearer";
  scope: string;
}

export interface DiscordProfile extends OAuth2Profile {
  id: string;
  displayName: string;
  username: string;
  discriminator?: string;
  emails?: { value: string }[];
  photos: { value: string }[];
  _json: APIUser;
}

export class DiscordStrategy<User> extends OAuth2Strategy<
  User,
  DiscordProfile,
  DiscordExtraParams
> {
  name = "discord";
  private scope: string[];
  private prompt: "none" | "consent" = "consent";

  constructor(
    options: DiscordStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<DiscordProfile, DiscordExtraParams>
    >
  ) {
    super(
      {
        authorizationURL: "https://discord.com/api/oauth2/authorize",
        tokenURL: "https://discord.com/api/oauth2/token",
        ...options,
      },
      verify
    );

    this.scope = options.scope ?? ["identify", "guilds"];
    this.prompt = options.prompt ?? "consent";
  }

  protected authorizationParams() {
    const params = {
      scope: this.scope.join(" "),
      prompt: this.prompt ?? "consent",
    };
    return new URLSearchParams(params);
  }

  protected async userProfile(accessToken: string) {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = (await response.json()) as APIUser;
    console.log(JSON.stringify(data));
    const profile = {
      provider: "discord",
      id: data.id,
      displayName: data.global_name ?? data.username,
      username: data.username,
      discriminator:
        data.discriminator === "0" ? undefined : data.discriminator,
      emails: data.email ? [{ value: data.email }] : undefined,
      photos: data.avatar
        ? [
            {
              value: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
            },
          ]
        : [
            {
              value: `https://cdn.discordapp.com/embed/avatars/${
                // discord's default avatars
                Math.abs((data.id as any) >> 22) % 6
              }.png`,
            },
          ],
      _json: data,
    };
    return profile;
  }
}
