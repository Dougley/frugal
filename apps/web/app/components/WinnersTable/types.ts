export interface Winner {
  id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
}

export interface WinnersTableProps {
  winners: Winner[];
}
