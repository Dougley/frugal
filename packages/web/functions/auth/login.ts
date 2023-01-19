import type { SessionStorage } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

export const onRequest: PagesFunction<{
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;
  sessions: SessionStorage;
}> = (context) => {
  if (context.request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }
  const url = new URL('https://discord.com/oauth2/authorize');
  const state = crypto.randomUUID();
  url.searchParams.append('client_id', context.env.DISCORD_CLIENT_ID);
  url.searchParams.append('redirect_uri', context.env.DISCORD_REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'identify guilds');
  url.searchParams.append('state', state);
  url.searchParams.append('prompt', 'none');
  // url.searchParams.append('nonce', crypto.randomUUID());
  const redirect = Response.redirect(url.toString(), 302);
  redirect.headers.append(
    'Set-Cookie',
    `state=${state}; Path=/; HttpOnly Expires=${new Date(
      Date.now() + 1000 * 60 * 5
    ).toUTCString()}`
  );
  return redirect;
};
