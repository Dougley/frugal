declare type GiveawayEntry = {
  user_id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

declare type Winner = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

declare type GiveawayState = "NEW" | "OPEN" | "CLOSED";
