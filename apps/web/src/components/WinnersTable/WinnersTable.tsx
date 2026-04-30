import { useTranslation } from "react-i18next";
import { type User, UserTable } from "~/components/UserTable";

export interface WinnersTableProps {
  winners: User[];
}

export default function WinnersTable({ winners }: WinnersTableProps) {
  const { t } = useTranslation();

  return (
    <UserTable
      users={winners}
      title={t("tables.winners.title")}
      searchPlaceholder={t("tables.winners.searchPlaceholder")}
    />
  );
}
