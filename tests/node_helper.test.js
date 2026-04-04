// tests/node_helper.test.js
import { fetchF1Data } from "../api";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("fetchF1Data", () => {
  it("handles HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })
    );

    const result = await fetchF1Data("DRIVER", "test-url");

    expect(result.error.type).toBe("HTTP_ERROR");
  });

  it("handles network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const result = await fetchF1Data("DRIVER", "test-url");

    expect(result.error.type).toBe("NETWORK_ERROR");
    expect(result.error.message).toBe("Network error");
  });

  it("returns error when no usable data is found", async () => {
    const mockJson = {
      MRData: {
        StandingsTable: {
          StandingsLists: [] // No usable data
        }
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJson)
      })
    );

    const result = await fetchF1Data("DRIVER", "test-url");

    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("NO_DATA");
    expect(result.error.message).toBe("No usable data in API response");
  });

  it("extracts and returns valid data", async () => {
    const mockJson = {
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              DriverStandings: [
                { position: "1", driver: { givenName: "Lewis", familyName: "Hamilton" } }
              ]
            }
          ]
        }
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJson)
      })
    );

    const result = await fetchF1Data("DRIVER", "test-url");

    expect(result.data).toEqual(mockJson.MRData.StandingsTable.StandingsLists[0]);
  });

  it("returns error when no usable data is found", async () => {
    const mockJson = {
      MRData: {
        StandingsTable: {
          StandingsLists: [{}] // Empty StandingsLists
        }
      }
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJson)
      })
    );

    const result = await fetchF1Data("DRIVER", "test-url");

    // Make sure result.error exists
    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("NO_DATA");
    expect(result.error.message).toBe("No usable data in API response");
  });
});
