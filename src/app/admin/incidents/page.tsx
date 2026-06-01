import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { getAdminIncidents, requireAdminUser } from "@/lib/admin/queries";

type IncidentsPageProps = {
  searchParams?: Promise<{
    status?: string;
    plate?: string;
  }>;
};

const statusOptions = [
  "",
  "pending",
  "notified",
  "resolved",
  "failed",
  "rate_limited",
  "cancelled",
];

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminIncidentsPage({ searchParams }: IncidentsPageProps) {
  await requireAdminUser();
  const params = await searchParams;
  const status = params?.status ?? "";
  const plate = params?.plate?.trim() ?? "";
  const incidents = await getAdminIncidents({ status, plate });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Incidents</h1>
        <p className="mt-1 text-sm text-slate-600">
          Filter resident pings by status or plate.
        </p>
      </div>

      <form className="grid gap-2 rounded-lg border border-[#E4ECFC] bg-white p-3 sm:grid-cols-[1fr_180px_auto]">
        <Input
          type="search"
          name="plate"
          defaultValue={plate}
          placeholder="Plate"
          className="min-h-10"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-10 rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        >
          {statusOptions.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? option.replaceAll("_", " ") : "All statuses"}
            </option>
          ))}
        </select>
        <Button type="submit" className="min-h-10 px-4">
          Filter
        </Button>
      </form>

      {incidents.length ? (
        <div className="overflow-x-auto rounded-lg border border-[#E4ECFC] bg-white">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Plate</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Resolved</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-semibold text-slate-950">
                    {incident.plateNumber}
                  </TableCell>
                  <TableCell>{incident.location || "-"}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    {incident.message || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge tone={incident.status} />
                  </TableCell>
                  <TableCell>{formatDate(incident.createdAt)}</TableCell>
                  <TableCell>{formatDate(incident.resolvedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No incidents found"
          message="Adjust the status or plate filters to broaden the result set."
        />
      )}
    </div>
  );
}
