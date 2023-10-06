import { LuCheck, LuX } from "react-icons/lu";

const ComparisonTable = () => {
  return (
    <div className="px-4 py-8">
      <h2 className="mb-4 text-center text-3xl font-bold">
        Feature comparison
      </h2>
      <table className="table table-zebra table-xs lg:table-lg">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Free</th>
            <th>Plus</th>
            <th>
              <span className="text-secondary">Premium</span>
            </th>
            <th>
              <span className="text-accent">Ultra</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Giveaway duration</td>
            <td>2 weeks (14 days)</td>
            <td>4 weeks (30 days)</td>
            <td>6 weeks (42 days)</td>
            <td>8 weeks (56 days)</td>
          </tr>
          <tr>
            <td>Giveaway winners</td>
            <td>20</td>
            <td>30</td>
            <td>50</td>
            <td>100</td>
          </tr>
          <tr>
            <td>Max giveaways</td>
            <td>10 (in total)</td>
            <td>10 (per channel)</td>
            <td>25 (per channel)</td>
            <td>50 (per channel)</td>
          </tr>
          <tr>
            <td>Custom emojis</td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
          </tr>
          <tr>
            <td>Embed images</td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
          </tr>
          <tr>
            <td>Automatic delivery</td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuX className="mr-2 h-7 w-7 text-error" />
            </td>
            <td>
              <LuCheck className="mr-2 h-7 w-7 text-success" />
            </td>
          </tr>
          <tr>
            <td>Storage</td>
            <td>3 months</td>
            <td>3 months</td>
            <td>6 months</td>
            <td>6 months</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
