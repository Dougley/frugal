import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { MdOutlineWbSunny } from 'react-icons/md';
import { IoMdMoon } from 'react-icons/io';

function Navbar(): ReactElement {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setTheme(theme);
    document.querySelector('html')!.setAttribute('data-theme', theme);
  }, [theme]);
  return (
    <div className="navbar bg-neutral text-neutral-content">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl" href="/">
          GiveawayBot
        </a>
      </div>
      <div className="flex-none">
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
}

function ThemeSwitcher(props: { theme: string; setTheme: any }) {
  return (
    <label className="swap swap-rotate">
      <input
        type="checkbox"
        className="swap swap-rotate"
        checked={props.theme === 'light'}
        onChange={(e) => {
          props.setTheme(e.target.checked ? 'light' : 'dark');
          localStorage.setItem(
            'theme',
            e.target.checked ? 'light' : 'dark'
          );
        }}
      />

      <IoMdMoon className="swap-off fill-current w-8 h-8" />
      <MdOutlineWbSunny className="swap-on fill-current w-8 h-8" />
    </label>
  );
}

export default Navbar;
