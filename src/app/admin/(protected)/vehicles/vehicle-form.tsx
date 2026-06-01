"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminVehicleDetail } from "@/lib/admin/queries";
import type { VehicleFormState } from "./actions";

type VehicleFormProps = {
  action: (
    previousState: VehicleFormState,
    formData: FormData,
  ) => Promise<VehicleFormState>;
  vehicle?: AdminVehicleDetail;
  submitLabel: string;
};

const initialState: VehicleFormState = {
  message: "",
};

function fieldId(name: string) {
  return `vehicle-${name}`;
}

export function VehicleForm({ action, vehicle, submitLabel }: VehicleFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message}
        </div>
      ) : null}

      <section className="rounded-lg border border-[#E4ECFC] bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-950">Owner</h2>
          <p className="mt-1 text-sm text-slate-600">
            At least one contact method is required for simulated notifications.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Owner name" name="ownerName" required defaultValue={vehicle?.ownerName} />
          <Field label="Unit" name="unitNumber" defaultValue={vehicle?.unitNumber} />
          <Field label="Phone" name="phone" type="tel" defaultValue={vehicle?.phone} />
          <Field label="Email" name="email" type="email" defaultValue={vehicle?.email} />
        </div>
      </section>

      <section className="rounded-lg border border-[#E4ECFC] bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-950">Vehicle</h2>
          <p className="mt-1 text-sm text-slate-600">
            Plates are normalized automatically before saving.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Plate"
            name="plateNumber"
            required
            className="uppercase"
            defaultValue={vehicle?.plateNumber}
          />
          <Field label="Colour" name="colour" defaultValue={vehicle?.colour} />
          <Field label="Make" name="make" defaultValue={vehicle?.make} />
          <Field label="Model" name="model" defaultValue={vehicle?.model} />
          <Field
            label="Year"
            name="year"
            type="number"
            min="1900"
            max="2100"
            defaultValue={vehicle?.year}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/admin/vehicles"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#E4ECFC] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <Button type="submit" className="min-h-10" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
}) {
  const id = fieldId(name);

  return (
    <label htmlFor={id} className="space-y-1.5">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={className}
        min={min}
        max={max}
      />
    </label>
  );
}
