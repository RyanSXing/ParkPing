import Link from "next/link";

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
import { getAdminVehiclesPage, requireAdminUser } from "@/lib/admin/queries";
import { toggleVehicleActiveAction } from "./actions";

type VehiclesPageProps = {
  searchParams?: Promise<{
    q?: string;
    active?: string;
    page?: string;
  }>;
};

export default async function AdminVehiclesPage({ searchParams }: VehiclesPageProps) {
  await requireAdminUser();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const active = params?.active ?? "";
  const page = Number(params?.page ?? "1");
  const vehiclesPage = await getAdminVehiclesPage({ q, active, page });
  const vehicles = vehiclesPage.items;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Vehicles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search by plate, owner, unit, make, model, or colour.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:max-w-3xl">
          <form className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
            <label htmlFor="vehicle-search" className="sr-only">
              Search vehicles by plate, owner, unit, make, model, or colour
            </label>
            <Input
              id="vehicle-search"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Plate, owner, unit, make..."
              className="min-h-10"
            />
            <label htmlFor="vehicle-active" className="sr-only">
              Filter vehicles by active status
            </label>
            <select
              id="vehicle-active"
              name="active"
              defaultValue={active}
              className="min-h-10 rounded-md border border-[#E4ECFC] bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button type="submit" className="min-h-10 px-4">
              Search
            </Button>
          </form>
          <div className="flex gap-2">
            <Link
              href="/admin/vehicles/export"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </Link>
            <Link
              href="/admin/vehicles/new"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
            >
              Add vehicle
            </Link>
          </div>
        </div>
      </div>

      {vehicles.length ? (
        <div className="overflow-x-auto rounded-lg border border-[#E4ECFC] bg-white">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Plate</TableHeaderCell>
                <TableHeaderCell>Vehicle</TableHeaderCell>
                <TableHeaderCell>Owner</TableHeaderCell>
                <TableHeaderCell>Unit</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Active</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => {
                const toggleAction = toggleVehicleActiveAction.bind(
                  null,
                  vehicle.id,
                  !vehicle.active,
                );

                return (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-semibold text-slate-950">
                      {vehicle.plateNumber}
                    </TableCell>
                    <TableCell>{vehicle.vehicle}</TableCell>
                    <TableCell>{vehicle.ownerName}</TableCell>
                    <TableCell>{vehicle.unitNumber || "-"}</TableCell>
                    <TableCell>{vehicle.phone || "-"}</TableCell>
                    <TableCell>{vehicle.email || "-"}</TableCell>
                    <TableCell>
                      <Badge tone={vehicle.active ? "resolved" : "failed"}>
                        {vehicle.active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-40 items-center gap-2">
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <form action={toggleAction}>
                          <button
                            type="submit"
                            className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            {vehicle.active ? "Deactivate" : "Reactivate"}
                          </button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No vehicles found"
          message="Try a different plate, owner, unit, make, model, or colour."
        />
      )}
      <Pagination
        pageInfo={vehiclesPage}
        basePath="/admin/vehicles"
        params={{ q, active }}
      />
    </div>
  );
}
