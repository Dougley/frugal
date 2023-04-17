declare type SavedUserInformation = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

declare type SummaryOutput = {
  _version: 2; // fixed
  details: {
    channel: string;
    message: string;
    prize: string;
    winners: number;
    originalWinners: string[];
    time: {
      start: string;
      end: string;
    };
  };
  entries: SavedUserInformation[];
};
