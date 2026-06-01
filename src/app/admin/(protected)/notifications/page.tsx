import Link from "next/link";

import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getAdminNotificationsPage, requireAdminUser } from "@/lib/admin/queries";

type NotificationsPageProps = {
  searchParams?: Promise<{
    status?: string;
    method?: string;
    page?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const notificationStatuses = ["", "simulated_sent", "pending", "sent", "failed"];
const notificationMethods = ["", "simulated", "sms", "email"];

export default async function AdminNotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  await requireAdminUser();
  const params = await searchParams;
  const status = params?.status ?? "";
  const method = params?.method ?? "";
  const page = Number(params?.page ?? "1");
  const notificationsPage = await getAdminNotificationsPage({ status, method, page });
  const notifications = notificationsPage.items;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Delivery records with masked recipients and resolve links.
        </p>
      </div>

      <form className="grid gap-2 rounded-lg border border-[#E4ECFC] bg-white p-3 sm:grid-cols-[180px_180px_auto]">
        <label htmlFor="notification-status" className="sr-only">
          Filter notifications by status
        </label>
        <select
          id="notification-status"
          name="status"
          defaultValue={status}
          className="min-h-10 rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        >
          {notificationStatuses.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? option.replaceAll("_", " ") : "All statuses"}
            </option>
          ))}
        </select>
        <label htmlFor="notification-method" className="sr-only">
          Filter notifications by method
        </label>
        <select
          id="notification-method"
          name="method"
          defaultValue={method}
          className="min-h-10 rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        >
          {notificationMethods.map((option) => (
            <option key={option || "all"} value={option}>
              {option || "All methods"}
            </option>
          ))}
        </select>
        <Button type="submit" className="min-h-10 px-4">
          Filter
        </Button>
      </form>

      {notifications.length ? (
        <div className="overflow-x-auto rounded-lg border border-[#E4ECFC] bg-white">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Incident</TableHeaderCell>
                <TableHeaderCell>Method</TableHeaderCell>
                <TableHeaderCell>Recipient</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
                <TableHeaderCell>Resolve</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-mono text-xs text-slate-950">
                    {notification.incidentId}
                  </TableCell>
                  <TableCell>{notification.method}</TableCell>
                  <TableCell>{notification.recipient}</TableCell>
                  <TableCell>
                    <Badge tone={notification.status} />
                  </TableCell>
                  <TableCell>{formatDate(notification.sentAt)}</TableCell>
                  <TableCell className="max-w-sm whitespace-normal">
                    {notification.message || "-"}
                  </TableCell>
                  <TableCell>
                    {notification.resolveLink ? (
                      <Link
                        href={notification.resolveLink}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        Open
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No notifications yet"
          message="Notification delivery records will appear here after pings are sent."
        />
      )}
      <Pagination
        pageInfo={notificationsPage}
        basePath="/admin/notifications"
        params={{ status, method }}
      />
    </div>
  );
}
