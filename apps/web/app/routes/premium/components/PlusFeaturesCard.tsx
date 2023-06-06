import type { ReactElement } from "react";
import { LuMinus, LuX, LuCheck } from "react-icons/lu";

function PlusFeaturesCard(): ReactElement {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Plus Features</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <LuMinus className="mr-2 h-7 w-7 text-warning" />
            <span>Giveaways can last up to 4 weeks (30 days)</span>
          </li>
          <li className="flex items-center">
            <LuMinus className="mr-2 h-7 w-7 text-warning" />
            <span>Giveaways can have up to 30 winners</span>
          </li>
          <li className="flex items-center">
            <LuMinus className="mr-2 h-7 w-7 text-warning" />
            <span>Run up to 10 giveaways per channel at once</span>
          </li>
          <li className="flex items-center">
            <LuCheck className="mr-2 h-7 w-7 text-success" />
            <span>Use custom emojis for the giveaway button</span>
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

export default PlusFeaturesCard;
