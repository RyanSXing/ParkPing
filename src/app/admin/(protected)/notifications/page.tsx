import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getAdminNotifications, requireAdminUser } from "@/lib/admin/queries";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminNotificationsPage() {
  await requireAdminUser();
  const notifications = await getAdminNotifications();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Delivery records with masked recipients and resolve links.
        </p>
      </div>

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
    </div>
  );
}
