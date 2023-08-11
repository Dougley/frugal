import { Link } from "@remix-run/react";
import type { ReactElement } from "react";
import { LuCloudSun, LuGithub } from "react-icons/lu";
import Logo from "~/components/Logo";

export function FooterContent(): ReactElement {
  return (
    <div className="footer footer-center rounded bg-base-200 p-10 text-base-content">
      <div className="grid grid-flow-col gap-4">
        <Link to="//dougley.com/discord/terms" className="link-hover link">
          Terms of Service
        </Link>
        <Link to="//dougley.com/discord/privacy" className="link-hover link">
          Privacy Policy
        </Link>
      </div>
      <div className="grid-flow-col items-center">
        <Link
          to="//dougley.com"
          className="link-hover btn btn-ghost link btn-lg"
        >
          <Logo />
        </Link>
      </div>
      <div className="grid grid-flow-col gap-4">
        <Link to="//github.com/Dougley/frugal" target="_blank" rel="noreferrer">
          <LuGithub size={24} />
        </Link>
        <Link
          to="//bsky.app/profile/dougley.com"
          target="_blank"
          rel="noreferrer"
        >
          <LuCloudSun size={24} />
        </Link>
      </div>
    </div>
  );
}
