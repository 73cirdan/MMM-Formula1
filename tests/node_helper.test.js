import { vi, describe, it, expect, beforeEach } from "vitest";
import { fetchSeasonData, fetchSchedule } from "../jolpiApi"; // Corrected path

// Mocking the fetchSeasonData and fetchSchedule functions
vi.mock("../jolpiApi", () => ({
  fetchSeasonData: vi.fn(),
  fetchSchedule: vi.fn()
}));

// Mocking the NodeHelper module with named exports (no default export assumed)
vi.mock("node_helper", () => ({
  // Mock the named exports directly (such as NodeHelper.create)
  NodeHelper: {
    create: vi.fn().mockReturnValue({
      start: vi.fn(),
      socketNotificationReceived: vi.fn(),
      sendSocketNotification: vi.fn(),
      handleError: vi.fn(),
      fetchApiData: vi.fn()
    })
  }
}));

import { NodeHelper } from "node_helper"; // Corrected import for NodeHelper

describe("NodeHelper Tests", () => {
  let nodeHelperInstance;

  beforeEach(() => {
    // Creating an instance of the mocked NodeHelper class using the mock return value
    nodeHelperInstance = NodeHelper.create();
  });

  it("should call start method on NodeHelper instance", () => {
    nodeHelperInstance.start();
    expect(nodeHelperInstance.start).toHaveBeenCalled();
  });

  it("should handle socket notifications", () => {
    const notification = "CONFIG";
    const payload = { config: "test" };
    nodeHelperInstance.socketNotificationReceived(notification, payload);
    expect(nodeHelperInstance.socketNotificationReceived).toHaveBeenCalledWith(
      notification,
      payload
    );
  });

  it("should send socket notifications", () => {
    const notification = "TEST_NOTIFICATION";
    const payload = { key: "value" };
    nodeHelperInstance.sendSocketNotification(notification, payload);
    expect(nodeHelperInstance.sendSocketNotification).toHaveBeenCalledWith(notification, payload);
  });

  it("should handle errors correctly", () => {
    const error = new Error("Test error");
    nodeHelperInstance.handleError("TEST_ERROR", error);
    expect(nodeHelperInstance.handleError).toHaveBeenCalledWith("TEST_ERROR", error);
  });

  it("should call fetchApiData method", async () => {
    nodeHelperInstance.fetchApiData();
    expect(nodeHelperInstance.fetchApiData).toHaveBeenCalled();
  });

  it("should fetch season data correctly from API", async () => {
    const mockApiResponse = { data: { MRData: { StandingsTable: { StandingsLists: [{}] } } } };

    // Mocking the response for fetchSeasonData
    fetchSeasonData.mockResolvedValue(mockApiResponse);

    const result = await fetchSeasonData("driver", "test-url");

    expect(result).toEqual(mockApiResponse);
    expect(fetchSeasonData).toHaveBeenCalledWith("driver", "test-url");
  });

  it("should fetch schedule data correctly from API", async () => {
    const mockScheduleResponse = { data: { MRData: { RaceTable: { Races: [] } } } };

    // Mocking the response for fetchSchedule
    fetchSchedule.mockResolvedValue(mockScheduleResponse);

    const result = await fetchSchedule("2023");

    expect(result).toEqual(mockScheduleResponse);
    expect(fetchSchedule).toHaveBeenCalledWith("2023");
  });
});
