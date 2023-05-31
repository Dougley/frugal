import type { ReactElement } from "react";
import { BsCheckLg, BsDashLg, BsXLg } from "react-icons/bs";

function PlusFeaturesCard(): ReactElement {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Plus Features</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <BsDashLg className="mr-2 h-7 w-7 text-warning" />
            <span>Giveaways can last up to 4 weeks (30 days)</span>
          </li>
          <li className="flex items-center">
            <BsDashLg className="mr-2 h-7 w-7 text-warning" />
            <span>Giveaways can have up to 30 winners</span>
          </li>
          <li className="flex items-center">
            <BsDashLg className="mr-2 h-7 w-7 text-warning" />
            <span>Run up to 10 giveaways per channel at once</span>
          </li>
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>Use custom emojis for the giveaway button</span>
          </li>
          <li className="flex items-center">
            <BsXLg className="mr-2 h-7 w-7 text-error" />
            <span>No images for the giveaway embed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default PlusFeaturesCard;
