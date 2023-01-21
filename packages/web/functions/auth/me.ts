import type { SessionStorage } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import type {
  RESTGetAPICurrentUserResult,
  RESTAPIPartialCurrentUserGuild,
} from 'discord-api-types/rest/v9/user';

export const onRequestGet: PagesFunction<{
  KV_SESSIONS: KVNamespace;
}> = async (context) => {
  const sessionStorage = context.data.sessions as SessionStorage;
  const session = await sessionStorage.getSession(
    context.request.headers.get('Cookie')
  );
  return json(
    {
      success: true,
      data: {
        user: session.get('user') as RESTGetAPICurrentUserResult,
        guilds: session.get('guilds') as {
          guilds: Pick<RESTAPIPartialCurrentUserGuild, 'id' | 'permissions'>[];
        },
      },
    },
    { status: 200 }
  );
};
