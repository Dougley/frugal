import { Entry } from "./entries";
import { Giveaway } from "./giveaways";
import { PremiumSubscription } from "./premium-subscriptions";

export interface Database {
  giveaways: Giveaway;
  premium_subscriptions: PremiumSubscription;
  entries: Entry;
}
