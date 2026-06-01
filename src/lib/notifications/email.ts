import { Resend } from "resend";

import type { Notification } from "../supabase/types";
import { maskEmail } from "../validation/contact";

type SupabaseInsertResult<T> = {
  data: T | null;
  error: { message?: string } | Error | null;
};

type SupabaseInsertClient<T> = {
  from(table: "notifications"): {
    insert(payload: Partial<Notification>): {
      select(): {
        single(): Promise<SupabaseInsertResult<T>>;
      };
    };
  };
};

type AlertOwner = {
  phone: string | null;
  email: string | null;
};

type AlertVehicle = {
  plate_number: string;
  colour: string | null;
  make: string | null;
  model: string | null;
};

export type SendEmailParkingAlertInput = {
  incidentId: string;
  resolveToken: string;
  owner: AlertOwner;
  vehicle: AlertVehicle;
  location?: string | null;
  appBaseUrl: string;
  resendApiKey: string;
  fromEmail: string;
};

function createResolveLink(appBaseUrl: string, resolveToken: string): string {
  return `${appBaseUrl.replace(/\/+$/, "")}/resolve/${encodeURIComponent(resolveToken)}`;
}

function describeVehicle(vehicle: AlertVehicle): string {
  const descriptionParts = [
    vehicle.colour,
    vehicle.make,
    vehicle.model,
  ].filter((part): part is string => Boolean(part?.trim()));

  if (descriptionParts.length === 0) {
    return `vehicle with plate ${vehicle.plate_number}`;
  }

  return `${descriptionParts.join(" ")} with plate ${vehicle.plate_number}`;
}

function buildEmailMessage({
  vehicle,
  location,
  resolveLink,
}: {
  vehicle: AlertVehicle;
  location?: string | null;
  resolveLink: string;
}) {
  const locationText = location?.trim() || "the shared parking area";
  const vehicleText = describeVehicle(vehicle);
  const text = `Parking alert: your ${vehicleText} may be blocking another resident near ${locationText}. Please move it when possible. Resolve: ${resolveLink}`;
  const escapedText = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return {
    text,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 12px;">Parking alert</h1>
        <p>${escapedText}</p>
        <p>
          <a href="${resolveLink}" style="color: #2563eb; font-weight: 700;">
            I moved my car
          </a>
        </p>
        <p style="font-size: 12px; color: #64748b;">
          ParkPing protects resident privacy. This alert does not include the requester's identity.
        </p>
      </div>
    `,
  };
}

function getInsertErrorMessage(error: SupabaseInsertResult<unknown>["error"]): string {
  if (!error) {
    return "Notification insert returned no data";
  }

  return error.message || "Notification insert failed";
}

export async function sendEmailParkingAlert<TNotification extends Notification>(
  client: SupabaseInsertClient<TNotification>,
  input: SendEmailParkingAlertInput,
): Promise<TNotification> {
  const recipient = input.owner.email?.trim();

  if (!recipient) {
    throw new Error("No owner email address available.");
  }

  const recipientMasked = maskEmail(recipient);

  if (!recipientMasked) {
    throw new Error("No usable notification recipient.");
  }

  if (!input.resendApiKey.trim() || !input.fromEmail.trim()) {
    throw new Error("Email notification environment is not configured.");
  }

  const resolveLink = createResolveLink(input.appBaseUrl, input.resolveToken);
  const message = buildEmailMessage({
    vehicle: input.vehicle,
    location: input.location,
    resolveLink,
  });
  const resend = new Resend(input.resendApiKey);
  const { data, error } = await resend.emails.send({
    from: input.fromEmail,
    to: recipient,
    subject: `Parking alert for ${input.vehicle.plate_number}`,
    html: message.html,
    text: message.text,
  });

  if (error) {
    throw new Error(error.message || "Email delivery failed.");
  }

  const payload: Partial<Notification> = {
    incident_id: input.incidentId,
    method: "email",
    recipient_masked: recipientMasked,
    delivery_status: "sent",
    simulated_message: message.text,
    resolve_link: resolveLink,
    provider_message_id: data?.id ?? null,
    provider_response: data ? { ...data } : null,
    sent_at: new Date().toISOString(),
  };

  const { data: notification, error: insertError } = await client
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (insertError || !notification) {
    throw new Error(getInsertErrorMessage(insertError));
  }

  return notification;
}
