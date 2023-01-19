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
      </div>
      <div>
        <span className="footer-title">Social</span>
        <div className="grid grid-flow-col gap-4">
          <Link
            to="//github.com/Dougley/frugal"
            target="_blank"
            rel="noreferrer"
          >
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
      </div>
    </div>
  );
}

export default FooterContent;
