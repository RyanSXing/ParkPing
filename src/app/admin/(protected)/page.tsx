import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminSummary,
  getRecentIncidents,
  requireAdminUser,
} from "@/lib/admin/queries";

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  await requireAdminUser();
  const [summary, recentIncidents] = await Promise.all([
    getAdminSummary(),
    getRecentIncidents(),
  ]);
  const summaryCards = [
    { label: "Active vehicles", value: summary.activeVehicles },
    { label: "Open incidents", value: summary.openIncidents },
    { label: "Failed notifications", value: summary.failedNotifications },
    { label: "Pings today", value: summary.pingsToday },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Operational snapshot for the resident-first parking workflow.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{item.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-950">Recent incidents</h2>
        </div>
        {recentIncidents.length ? (
          <div className="overflow-x-auto rounded-lg border border-[#E4ECFC] bg-white">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Plate</TableHeaderCell>
                  <TableHeaderCell>Location</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Created</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-semibold text-slate-950">
                      {incident.plateNumber}
                    </TableCell>
                    <TableCell>{incident.location || "Not provided"}</TableCell>
                    <TableCell>
                      <Badge tone={incident.status} />
                    </TableCell>
                    <TableCell>{formatDate(incident.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="No incidents yet"
            message="Resident pings will appear here as they are created."
          />
        )}
      </section>
    </div>
  );
}
