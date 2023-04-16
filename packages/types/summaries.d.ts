declare type SavedUserInformation = {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
};

declare type SummaryOutput = {
  _version: 2; // fixed
  details: {
    channel: string;
    message: string;
    prize: string;
    winners: number;
    originalWinners: SavedUserInformation[];
    time: {
      start: string;
      end: string;
    };
  };
  entries: SavedUserInformation[];
};
