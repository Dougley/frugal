import type { ReactElement } from "react";
import { BsCheckLg } from "react-icons/bs";

function PremiumFeaturesCard(): ReactElement {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Premium Features</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>
              Giveaways can last up to <b>6 weeks (42 days)</b>
            </span>
          </li>
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>
              Giveaways can have up to <b>50 winners</b>
            </span>
          </li>
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>
              Run up to <b>25 giveaways per channel</b> at once
            </span>
          </li>
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>
              Use <b>custom emojis</b> for the giveaway button
            </span>
          </li>
          <li className="flex items-center">
            <BsCheckLg className="mr-2 h-7 w-7 text-success" />
            <span>
              <b>Upload images</b> for the giveaway embed
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default PremiumFeaturesCard;
