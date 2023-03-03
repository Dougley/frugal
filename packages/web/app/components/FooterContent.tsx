import type { ReactElement } from 'react';
import { BsGithub, BsTwitter, BsMastodon } from 'react-icons/bs';
import { SiGithubsponsors } from 'react-icons/si';
import { Link } from '@remix-run/react';
import Logo from './Logo';

function FooterContent(): ReactElement {
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
      <div className="grid grid-flow-col gap-4">
        <Link to="//dougley.com/discord/terms" className="link link-hover">
          Terms of Service
        </Link>
        <Link to="//dougley.com/discord/privacy" className="link link-hover">
          Privacy Policy
        </Link>
      </div>
      <div className="items-center grid-flow-col">
        <Link to="//dougley.com" className="link link-hover">
          <Logo />
        </Link>
      </div>
      <div className="grid grid-flow-col gap-4">
        <Link to="//github.com/Dougley/frugal" target="_blank" rel="noreferrer">
          <BsGithub size={24} />
        </Link>
        <Link to="//twitter.com/dougley" target="_blank" rel="noreferrer">
          <BsTwitter size={24} />
        </Link>
        <Link to="//mas.to/@doug" target="_blank" rel="noreferrer">
          <BsMastodon size={24} />
        </Link>
        <Link
          to="//github.com/sponsors/Dougley"
          target="_blank"
          rel="noreferrer"
        >
          <SiGithubsponsors size={24} />
        </Link>
      </div>
    </footer>
  );
}

export default FooterContent;
