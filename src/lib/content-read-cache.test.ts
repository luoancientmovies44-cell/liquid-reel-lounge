import { describe, expect, it } from "vitest";
import { createContentReadCache } from "./content-read-cache";

describe("concurrent public content reads", () => {
  it("shares a pending read across homepage sections", async () => {
    const read = createContentReadCache<number>();
    let calls = 0;
    const fetch = async () => ++calls;
    const first = read("movies", fetch);
    const second = read("movies", fetch);
    expect(second).toBe(first);
    expect(await Promise.all([first, second])).toEqual([1, 1]);
    expect(calls).toBe(1);
  });

  it("reads again after completion so admin edits are not hidden", async () => {
    const read = createContentReadCache<number>();
    let value = 1;
    expect(await read("movies", async () => value)).toBe(1);
    value = 2;
    expect(await read("movies", async () => value)).toBe(2);
  });

  it("isolates collections and retries failed reads", async () => {
    const read = createContentReadCache<number>();
    await expect(read("movies", async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(await read("movies", async () => 3)).toBe(3);
    expect(await read("series", async () => 4)).toBe(4);
  });
});