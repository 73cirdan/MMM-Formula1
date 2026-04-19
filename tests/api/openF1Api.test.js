import { vi, describe, it, expect } from "vitest";
import { fetchDriverProfile } from "../../openF1Api";

describe("openF1Api", () => {
  it("fetches driver profile correctly", async () => {
    const result = await fetchDriverProfile("44");

    expect(result.driver_number).toEqual(44);
    expect(result.first_name).toEqual("Lewis");
    expect(result.last_name).toEqual("Hamilton");
    expect(result.name_acronym).toEqual("HAM");
    expect(result.team_colour).toEqual("ED1131");
    expect(result.team_name).toEqual("Ferrari");
    expect(result.headshot_url).toEqual(
      "https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/1col/image.png"
    );
  });

  it("handles errors when fetching driver profile", async () => {
    const result = await fetchDriverProfile("999");

    expect(result).toBe(null);
  });
});
