import {
  RESTGetAPIChannelMessageResult,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPatchAPIChannelMessageResult,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  Routes,
  Snowflake,
} from "discord-api-types/v9";
import { call } from "slshx";

export const createMessage = async (
  channel: Snowflake,
  msg: string | RESTPostAPIChannelMessageJSONBody
): Promise<RESTPostAPIChannelMessageResult> => {
  return await call(
    "POST",
    Routes.channelMessages(channel),
    {
      ...(typeof msg === "string" ? { content: msg } : msg),
    },
    {
      bot: SLSHX_APPLICATION_TOKEN,
    }
  );
};

export const editMessage = async (
  channel: Snowflake,
  message: Snowflake,
  msg: string | RESTPatchAPIChannelMessageJSONBody
): Promise<RESTPatchAPIChannelMessageResult> => {
  return await call(
    "PATCH",
    Routes.channelMessage(channel, message),
    {
      ...(typeof msg === "string" ? { content: msg } : msg),
    },
    {
      bot: SLSHX_APPLICATION_TOKEN,
    }
  );
};

export const deleteMessage = async (
  channel: Snowflake,
  message: Snowflake
): Promise<void> => {
  await call(
    "DELETE",
    Routes.channelMessage(channel, message),
    {},
    {
      bot: SLSHX_APPLICATION_TOKEN,
    }
  );
};

export const getMessage = async (
  channel: Snowflake,
  message: Snowflake
): Promise<RESTGetAPIChannelMessageResult> => {
  return await call(
    "GET",
    Routes.channelMessage(channel, message),
    {},
    {
      bot: SLSHX_APPLICATION_TOKEN,
    }
  );
};
