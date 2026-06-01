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
            Search by plate, make, model, or colour.
          </p>
        </div>
        <form className="flex w-full gap-2 lg:max-w-md">
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search vehicles"
            className="min-h-10"
          />
          <Button type="submit" className="min-h-10 px-4">
            Search
          </Button>
        </form>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="No vehicles found"
          message="Try a different plate, make, model, or colour."
        />
      )}
    </div>
  );
}
