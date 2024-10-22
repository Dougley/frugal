import { Link } from "@remix-run/react";
import { getClient } from "@sentry/remix";
import { useEffect, useState, type ReactElement } from "react";
import { FaBluesky, FaGithub } from "react-icons/fa6";
import { RiRemixRunFill } from "react-icons/ri";
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
          <FaGithub size={24} />
        </Link>
        <Link
          to="//bsky.app/profile/did:plc:pjo7hpzugbss3q4zh6aebkar"
          target="_blank"
          rel="noreferrer"
        >
          <FaBluesky size={24} />
        </Link>
      </div>
      <div className="grid grid-flow-row gap-1 opacity-50">
        <span>
          Powered by <RiRemixRunFill size={24} className="inline-block" />
          <Link to="//remix.run" target="_blank" rel="noreferrer">
            Remix
          </Link>
        </span>
        <span className="flex items-center gap-2">
          <EnvironmentBadge />
          <ReleaseRef />
        </span>
      </div>
    </div>
  );
}

const EnvironmentBadge: React.FC = () => {
  const options = getClient()?.getOptions();
  const environment = options?.environment;

  switch (environment) {
    case "production":
      return <span className="badge badge-success">PROD</span>;
    case "staging":
      return <span className="badge badge-info">STG</span>;
    default:
      return <span className="badge badge-warning">DEV</span>;
  }
};

const ReleaseRef: React.FC = () => {
  const [release, setRelease] = useState<string | null>(null);

  useEffect(() => {
    const options = getClient()?.getOptions();
    setRelease(options?.release || null);
  }, []);

  if (!release) {
    return <span className="loading loading-dots loading-xs"></span>;
  }

  return <span className="text-xs">{release}</span>;
};
