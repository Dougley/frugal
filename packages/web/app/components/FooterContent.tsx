import type { ReactElement } from 'react';
import { BsTwitter } from 'react-icons/bs';
import { GiCrocJaws } from 'react-icons/gi';
import { Link } from '@remix-run/react';

function FooterContent(): ReactElement {
  return (
    <div className="footer p-10 bg-neutral text-neutral-content">
      <div>
        <GiCrocJaws size={50} />
        <p>&copy; Dougley - {new Date().getFullYear()}</p>
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
        </div>
      </div>
    </div>
  );
}

export default FooterContent;
