import { vi, describe, it, expect } from "vitest";
import { fetchData } from "../../api";

global.fetch = vi.fn(); // Mock global fetch

describe("api.js", () => {
  it("should fetch data successfully", async () => {
    const mockResponse = { data: { key: "value" } };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await fetchData("test-url");

    expect(result.data).toEqual(mockResponse);
  });

  it("should handle HTTP error response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404
    });

    const result = await fetchData("test-url");

    expect(result.error.type).toBe("HTTP_ERROR");
    expect(result.error.message).toBe("HTTP 404 for test-url");
  });

  it("should handle network errors", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await fetchData("test-url");

    expect(result.error.type).toBe("NETWORK_ERROR");
    expect(result.error.message).toBe("Network error");
  });

  it("should handle HTTP error response", async () => {
    // Mocking a failed response (HTTP error)
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({})
    });

    const result = await fetchData("test-url");

    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("HTTP_ERROR");
    expect(result.error.message).toBe("HTTP 404 for test-url");
  });

  it("should handle network errors", async () => {
    // Mocking a network error (e.g., no internet connection)
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await fetchData("test-url");

    expect(result.error).toBeDefined();
    expect(result.error.type).toBe("NETWORK_ERROR");
    expect(result.error.message).toBe("Network error");
  });

  it("should fetch data successfully", async () => {
    const mockResponse = { data: { key: "value" } };

    // Mocking a successful response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse)
    });

    const result = await fetchData("test-url");

    expect(result.data).toEqual(mockResponse); // Ensure the data returned is correct
  });
  it("should handle no usable data in the response", async () => {
    // Mocking a response with valid HTTP status but empty data
    //const mockEmptyResponse = { data: null };
    const mockEmptyResponse = null;

    // Mocking a valid response with empty data
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockEmptyResponse)
    });

    const result = await fetchData("test-url");

    expect(result.data).toEqual(null);
  });
});
