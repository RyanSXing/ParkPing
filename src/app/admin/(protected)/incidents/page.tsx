import { Pagination } from "@/components/admin/pagination";
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
import { getAdminIncidentsPage, requireAdminUser } from "@/lib/admin/queries";
import { archiveDemoIncidentsAction } from "./actions";

type IncidentsPageProps = {
  searchParams?: Promise<{
    status?: string;
    plate?: string;
    date?: string;
    location?: string;
    page?: string;
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
  const date = params?.date?.trim() ?? "";
  const location = params?.location?.trim() ?? "";
  const page = Number(params?.page ?? "1");
  const incidentsPage = await getAdminIncidentsPage({
    status,
    plate,
    date,
    location,
    page,
  });
  const incidents = incidentsPage.items;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Incidents</h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter resident pings by status, date, plate, or location.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/admin/incidents/export?${new URLSearchParams({
              status,
              plate,
              date,
              location,
            }).toString()}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Export CSV
          </a>
          <form action={archiveDemoIncidentsAction}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Archive demo pings
            </button>
          </form>
        </div>
      </div>

      <form className="grid gap-2 rounded-lg border border-[#E4ECFC] bg-white p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_180px_auto]">
        <label htmlFor="incident-plate" className="sr-only">
          Filter incidents by plate
        </label>
        <Input
          id="incident-plate"
          type="search"
          name="plate"
          defaultValue={plate}
          placeholder="Plate"
          className="min-h-10"
        />
        <label htmlFor="incident-location" className="sr-only">
          Filter incidents by location
        </label>
        <Input
          id="incident-location"
          type="search"
          name="location"
          defaultValue={location}
          placeholder="Location"
          className="min-h-10"
        />
        <label htmlFor="incident-date" className="sr-only">
          Filter incidents by date
        </label>
        <Input
          id="incident-date"
          type="date"
          name="date"
          defaultValue={date}
          className="min-h-10"
        />
        <label htmlFor="incident-status" className="sr-only">
          Filter incidents by status
        </label>
        <select
          id="incident-status"
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
                <TableHeaderCell>Vehicle</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Message</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Notification</TableHeaderCell>
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
                  <TableCell>{incident.vehicle}</TableCell>
                  <TableCell>{incident.location || "-"}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal">
                    {incident.message || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge tone={incident.status} />
                  </TableCell>
                  <TableCell>
                    {incident.notificationStatus ? (
                      <Badge tone={incident.notificationStatus} />
                    ) : (
                      "-"
                    )}
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
      <Pagination
        pageInfo={incidentsPage}
        basePath="/admin/incidents"
        params={{ status, plate, date, location }}
      />
    </div>
  );
}
