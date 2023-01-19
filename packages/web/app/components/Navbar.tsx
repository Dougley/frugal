import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { MdLogin, MdLogout, MdOutlineWbSunny } from 'react-icons/md';
import { IoMdMoon } from 'react-icons/io';
import { useLoaderData } from '@remix-run/react';

function Navbar(): ReactElement {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setTheme(theme);
    document.querySelector('html')!.setAttribute('data-theme', theme);
  }, [theme]);
  return (
    <div className="navbar bg-base-300">
      <div className="flex-1 px-2 lg:flex-none">
        <a className="btn btn-ghost normal-case text-lg font-bold" href="/">
          GiveawayBot
        </a>
      </div>
      <div className="flex justify-end flex-1 px-2">
        <div className="flex items-stretch space-x-2">
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
          <AuthControl />
        </div>
      </div>
    </div>
  );
}

function ThemeSwitcher(props: { theme: string; setTheme: any }) {
  return (
    <button
      className="btn btn-square btn-ghost gap-2"
      onClick={() => {
        props.setTheme(props.theme === 'light' ? 'dark' : 'light');
        localStorage.setItem(
          'theme',
          props.theme === 'light' ? 'dark' : 'light'
        );
      }}
    >
      <label className="swap swap-rotate">
        <input
          disabled
          type="checkbox"
          className="swap swap-rotate"
          checked={props.theme === 'light'}
        />

        <IoMdMoon className="swap-off fill-current w-8 h-8" />
        <MdOutlineWbSunny className="swap-on fill-current w-8 h-8" />
      </label>
    </button>
  );
}

function AuthControl() {
  const data = useLoaderData();
  if (!data) {
    return null;
  }
  const { session } = data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    sessionStorage.setItem('user', session.data.user?.id ?? '');
  }, [session]);
  if (data.hasSession) {
    return (
      <div className="dropdown dropdown-end">
        <button tabIndex={0} className="avatar">
          <div className="rounded-full w-10 h-10 m-1">
            <img
              alt="avatar"
              src={
                session.data.user.avatar
                  ? `https://cdn.discordapp.com/avatars/${session.data.user.id}/${session.data.user.avatar}.png`
                  : `https://cdn.discordapp.com/embed/avatars/${
                      session.data.user.discriminator % 5
                    }.png`
              }
            />
          </div>
        </button>
        <ul
          tabIndex={0}
          className="menu dropdown-content p-2 shadow bg-base-100 rounded-box w-52 mt-4"
        >
          <li className="disabled">
            <span className="text-sm">
              Logged in as:{' '}
              {`${session.data.user.username}#${session.data.user.discriminator}
              (${session.data.user.id})`}
            </span>
          </li>
          {/* <li>
            <a href="/dashboard">
              <MdOutlineSpaceDashboard className="inline-block w-5 h-5 mr-2" />
              Dashboard
            </a>
          </li> */}
          <li className="divider" />
          <li>
            <button
              className="text-error"
              onClick={async () => {
                await fetch('/auth/logout', { method: 'POST' });
                window.location.reload();
              }}
            >
              <MdLogout className="inline-block w-5 h-5 mr-2" />
              Logout
            </button>
          </li>
        </ul>
      </div>
    );
  } else {
    return (
      <a href="/auth/login" className="btn btn-ghost">
        <MdLogin className="inline-block w-5 h-5 mr-2" />
        Login
      </a>
    );
  }
}

export default Navbar;
