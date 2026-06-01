import type { Notification } from "../supabase/types";
import { sendEmailParkingAlert } from "./email";
import {
  sendSimulatedParkingAlert,
  type SendSimulatedParkingAlertInput,
} from "./simulated";

type NotificationMode = "simulated" | "sms" | "email";

type SendParkingAlertInput = SendSimulatedParkingAlertInput & {
  mode: NotificationMode;
  resendApiKey?: string;
  fromEmail?: string;
};

type NotificationClient = Parameters<typeof sendSimulatedParkingAlert>[0];

export async function sendParkingAlert<TNotification extends Notification>(
  client: NotificationClient,
  input: SendParkingAlertInput,
): Promise<TNotification> {
  if (input.mode === "email") {
    return sendEmailParkingAlert(client, {
      ...input,
      resendApiKey: input.resendApiKey ?? "",
      fromEmail: input.fromEmail ?? "",
    }) as Promise<TNotification>;
  }

  return sendSimulatedParkingAlert(client, input) as Promise<TNotification>;
}
