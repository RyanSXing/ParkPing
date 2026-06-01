import { VehicleForm } from "../vehicle-form";
import { createVehicleAction } from "../actions";

export default function NewVehiclePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Add Vehicle</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create the owner and vehicle record used by anonymous pings.
        </p>
      </div>

      <VehicleForm action={createVehicleAction} submitLabel="Create vehicle" />
    </div>
  );
}
