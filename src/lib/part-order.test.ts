import { describe, expect, it } from "vitest";
import { orderMovieParts } from "./part-order";

describe("movie part ordering", () => {
  it("places Part 1 before Part 2 while preserving unrelated ranking", () => {
    const titles = ["Newest", "Movie Part 2", "Other", "Movie Part 1", "Oldest"];
    expect(orderMovieParts(titles.map(title => ({ title }))).map(item => item.title))
      .toEqual(["Newest", "Movie Part 1", "Movie Part 2", "Other", "Oldest"]);
  });
  it("matches the real Paradise titles despite case and underscores", () => {
    expect(orderMovieParts([{ title: "The paradise 2 dwon kong" }, { title: "The Paradise 1_Dwon Kong" }]).map(item => item.title))
      .toEqual(["The Paradise 1_Dwon Kong", "The paradise 2 dwon kong"]);
  });
  it("orders numbered parts numerically and lettered subparts alphabetically", () => {
    const titles = ["Heropant 2B_DWON KONG", "Heropant 2A_DWON KONG", "Heropant 10_DWON KONG", "Heropant 1_DWON KONG"];
    expect(orderMovieParts(titles.map(title => ({ title }))).map(item => item.title))
      .toEqual(["Heropant 1_DWON KONG", "Heropant 2A_DWON KONG", "Heropant 2B_DWON KONG", "Heropant 10_DWON KONG"]);
  });
  it("orders episodes by season and episode without dropping positions", () => {
    const items = [3, 1, 2].map(episodeNumber => ({ title: "ZHAN ZHAO", episodeInfo: { seasonNumber: 1, episodeNumber } }));
    expect(orderMovieParts(items).map(item => item.episodeInfo.episodeNumber)).toEqual([1, 2, 3]);
    expect(items.map(item => item.episodeInfo.episodeNumber)).toEqual([3, 1, 2]);
  });
  it("does not change standalone titles or mix distinct movie names", () => {
    const items = ["100 YARDS", "Movie 2", "Another Movie 1", "2026"].map(title => ({ title }));
    expect(orderMovieParts(items)).toEqual(items);
  });
});