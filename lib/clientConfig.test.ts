import { readDiscordConfig } from "./clientConfig";
import type { DiscordConfig } from "./types";

describe("readDiscordConfig", () => {
  let getItemMock: jest.Mock;

  beforeEach(() => {
    getItemMock = jest.fn();

    // Mock window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: getItemMock,
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null if localStorage item is not found (returns null)", () => {
    getItemMock.mockReturnValue(null);
    const result = readDiscordConfig();
    expect(result).toBeNull();
    expect(getItemMock).toHaveBeenCalledWith("cra:discordConfig");
  });

  it("should return parsed configuration if localStorage contains valid JSON", () => {
    const expectedConfig: DiscordConfig = { botToken: "token-123", channelId: "channel-123" };
    getItemMock.mockReturnValue(JSON.stringify(expectedConfig));

    const result = readDiscordConfig();

    expect(result).toEqual(expectedConfig);
    expect(getItemMock).toHaveBeenCalledWith("cra:discordConfig");
  });

  it("should return null if localStorage contains malformed JSON", () => {
    // This will trigger the catch block in readDiscordConfig
    getItemMock.mockReturnValue("malformed-json-{");

    const result = readDiscordConfig();

    expect(result).toBeNull();
    expect(getItemMock).toHaveBeenCalledWith("cra:discordConfig");
  });

  it("should return null if window is undefined", () => {
    // Temporarily remove window to test the server-side check
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;

    const result = readDiscordConfig();

    expect(result).toBeNull();

    // Restore window
    global.window = originalWindow;
  });
});

describe("readApplicantInfo", () => {
  let getItemMock: jest.Mock;

  beforeEach(() => {
    getItemMock = jest.fn();

    // Mock window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: getItemMock,
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return empty info if localStorage item is not found (returns null)", () => {
    getItemMock.mockReturnValue(null);
    // require dynamically so it picks up mocked window
    const { readApplicantInfo } = require("./clientConfig");
    const result = readApplicantInfo();
    expect(result).toEqual({ name: "", email: "" });
    expect(getItemMock).toHaveBeenCalledWith("cra:applicantInfo");
  });

  it("should return parsed info if localStorage contains valid JSON", () => {
    const expectedInfo = { name: "John Doe", email: "john@example.com" };
    getItemMock.mockReturnValue(JSON.stringify(expectedInfo));

    const { readApplicantInfo } = require("./clientConfig");
    const result = readApplicantInfo();

    expect(result).toEqual(expectedInfo);
    expect(getItemMock).toHaveBeenCalledWith("cra:applicantInfo");
  });

  it("should return empty info if localStorage contains malformed JSON", () => {
    getItemMock.mockReturnValue("malformed-json-{");

    const { readApplicantInfo } = require("./clientConfig");
    const result = readApplicantInfo();

    expect(result).toEqual({ name: "", email: "" });
    expect(getItemMock).toHaveBeenCalledWith("cra:applicantInfo");
  });

  it("should return empty info if window is undefined", () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete (global as any).window;

    // reset modules to ensure clientConfig is re-evaluated with window=undefined
    jest.resetModules();
    const { readApplicantInfo } = require("./clientConfig");
    const result = readApplicantInfo();

    expect(result).toEqual({ name: "", email: "" });

    global.window = originalWindow;
  });
});
