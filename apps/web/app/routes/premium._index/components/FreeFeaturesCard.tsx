import type { ReactElement } from "react";
import { LuX } from "react-icons/lu";

function FreeFeaturesCard(): ReactElement {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Free Features</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <LuX className="mr-2 h-7 w-7 text-error" />
            <span>Giveaways can last up to 2 weeks (14 days)</span>
          </li>
          <li className="flex items-center">
            <LuX className="mr-2 h-7 w-7 text-error" />
            <span>Giveaways can have up to 20 winners</span>
          </li>
          <li className="flex items-center">
            <LuX className="mr-2 h-7 w-7 text-error" />
            <span>
              Run up to 10 giveaways <i>per server</i> at once
            </span>
          </li>
          <li className="flex items-center">
            <LuX className="mr-2 h-7 w-7 text-error" />
            <span>Use default emojis for the giveaway button</span>
          </li>
          <li className="flex items-center">
            <LuX className="mr-2 h-7 w-7 text-error" />
            <span>No images for the giveaway embed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FreeFeaturesCard;
