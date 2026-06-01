import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getAdminVehicleById } from "@/lib/admin/queries";
import { updateVehicleAction, toggleVehicleActiveAction } from "../../actions";
import { VehicleForm } from "../../vehicle-form";

type EditVehiclePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { id } = await params;
  const vehicle = await getAdminVehicleById(id);

  if (!vehicle) {
    notFound();
  }

  const formAction = updateVehicleAction.bind(null, vehicle.id);
  const toggleAction = toggleVehicleActiveAction.bind(null, vehicle.id, !vehicle.active);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-950">Edit Vehicle</h1>
            <Badge tone={vehicle.active ? "resolved" : "failed"}>
              {vehicle.active ? "active" : "inactive"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Update owner contact details and vehicle metadata for {vehicle.plateNumber}.
          </p>
        </div>
        <form action={toggleAction}>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {vehicle.active ? "Deactivate" : "Reactivate"}
          </button>
        </form>
      </div>

      <VehicleForm action={formAction} vehicle={vehicle} submitLabel="Save changes" />
    </div>
  );
}
