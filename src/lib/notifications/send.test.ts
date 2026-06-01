import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendParkingAlert } from "./send";
import { sendEmailParkingAlert } from "./email";
import { sendSimulatedParkingAlert } from "./simulated";

vi.mock("./email", () => ({
  sendEmailParkingAlert: vi.fn(),
}));

vi.mock("./simulated", () => ({
  sendSimulatedParkingAlert: vi.fn(),
}));

const input = {
  incidentId: "incident-1",
  resolveToken: "resolve-token",
  owner: {
    phone: "+14165550123",
    email: "owner@example.com",
  },
  vehicle: {
    plate_number: "ABC123",
    colour: "Blue",
    make: "Honda",
    model: "Civic",
  },
  location: "P2 north",
  appBaseUrl: "https://parkping.example",
};

describe("sendParkingAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes email mode to the email provider", async () => {
    vi.mocked(sendEmailParkingAlert).mockResolvedValue({ id: "email-1" } as never);

    await sendParkingAlert({} as never, {
      ...input,
      mode: "email",
      resendApiKey: "resend-key",
      fromEmail: "ParkPing <alerts@example.com>",
    });

    expect(sendEmailParkingAlert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mode: "email",
        resendApiKey: "resend-key",
        fromEmail: "ParkPing <alerts@example.com>",
      }),
    );
    expect(sendSimulatedParkingAlert).not.toHaveBeenCalled();
  });

  it("keeps simulated mode on the simulated provider", async () => {
    vi.mocked(sendSimulatedParkingAlert).mockResolvedValue({
      id: "simulated-1",
    } as never);

    await sendParkingAlert({} as never, {
      ...input,
      mode: "simulated",
    });

    expect(sendSimulatedParkingAlert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: "simulated" }),
    );
    expect(sendEmailParkingAlert).not.toHaveBeenCalled();
  });
});
