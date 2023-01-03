import { type MetaFunction } from '@remix-run/cloudflare';

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
// https://remix.run/api/conventions#meta
export let meta: MetaFunction = () => {
  return {
    title: 'GiveawayBot',
    description: '',
  };
};

// https://remix.run/guides/routing#index-routes
export default function Index() {
  return (
    <div className="overflow-x-auto hero w-full min-h-screen flex flex-col justify-center">
      <main>
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">GiveawayBot</h1>
            <p className="py-6">
              Hold giveaways on your Discord server quickly and easily
            </p>
            <a href="https://discord.com/api/oauth2/authorize?client_id=1033754043660652605&permissions=0&scope=bot%20applications.commands">
              <button className="btn btn-primary">Get Started</button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
