import Link from "next/link";

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
import { getAdminVehicles, requireAdminUser } from "@/lib/admin/queries";
import { toggleVehicleActiveAction } from "./actions";

type VehiclesPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function AdminVehiclesPage({ searchParams }: VehiclesPageProps) {
  await requireAdminUser();
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const vehicles = await getAdminVehicles(q);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Vehicles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search by plate, owner, unit, make, model, or colour.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl">
          <form className="flex flex-1 gap-2">
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
            <Button type="submit" className="min-h-10 px-4">
              Search
            </Button>
          </form>
          <Link
            href="/admin/vehicles/new"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Add vehicle
          </Link>
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
    </div>
  );
}
