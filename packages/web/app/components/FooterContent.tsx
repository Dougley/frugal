import type { ReactElement } from 'react';
import { BsGithub, BsTwitter, BsMastodon } from 'react-icons/bs';
import { FaDog } from 'react-icons/fa';
import { SiGithubsponsors } from 'react-icons/si';
import { Link } from '@remix-run/react';

function FooterContent(): ReactElement {
  return (
    <div className="footer p-10 bg-neutral text-neutral-content">
      <div>
        <FaDog size={50} />
        <Link to="//dougley.com" className="link link-hover">
          <p>&copy; Dougley - {new Date().getFullYear()}</p>
        </Link>
        <p className="text-xs text-slate-700">
          <Link
            to="//github.com/Dougley/frugal/tree/main/packages/web"
            target="_blank"
            rel="noreferrer"
          >
            {process.env.NODE_ENV}
          </Link>
        </p>
      </div>
      <div>
        <span className="footer-title">Social</span>
        <div className="grid grid-flow-col gap-4">
          <Link to="//twitter.com/dougley" target="_blank" rel="noreferrer">
            <BsTwitter size={24} />
          </Link>
          <Link to="//mas.to/@doug" target="_blank" rel="noreferrer">
            <BsMastodon size={24} />
          </Link>
          <Link to="//github.com/Dougley" target="_blank" rel="noreferrer">
            <BsGithub size={24} />
          </Link>
          <Link
            to="//github.com/sponsors/Dougley"
            target="_blank"
            rel="noreferrer"
          >
            <SiGithubsponsors size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FooterContent;
