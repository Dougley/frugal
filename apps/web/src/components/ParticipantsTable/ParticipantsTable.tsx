import { useTranslation } from "react-i18next";
import {
  type ServerPaginationProps,
  type User,
  UserTable,
} from "~/components/UserTable";

export interface ParticipantsTableProps {
  participants: User[];
  /** Server-side pagination - if provided, disables client-side pagination */
  pagination?: ServerPaginationProps;
  /** Callback for page changes when using server-side pagination */
  onPageChange?: (page: number) => void;
}

export default function ParticipantsTable({
  participants,
  pagination,
  onPageChange,
}: ParticipantsTableProps) {
  const { t } = useTranslation();

  return (
    <UserTable
      users={participants}
      title={t("tables.participants.title")}
      searchPlaceholder={t("tables.participants.searchPlaceholder")}
      serverPagination={pagination}
      onPageChange={onPageChange}
    />
  );
}
