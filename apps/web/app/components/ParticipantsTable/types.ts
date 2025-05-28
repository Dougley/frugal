export interface Participant {
  id: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
}

export interface ParticipantsTableProps {
  participants: Participant[];
}
