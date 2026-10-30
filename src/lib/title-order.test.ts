import { expect, it } from "vitest";
import { compareTitles } from "./title-order";
it("sorts Part 1, Part 2 and Part 10 naturally, ignoring case and spaces", () => {
  const rows = [{ title: "Movie Part 10" }, { title: " movie part 2 " }, { title: "Movie Part 1" }];
  expect(rows.sort(compareTitles).map(x => x.title.trim())).toEqual(["Movie Part 1", "movie part 2", "Movie Part 10"]);
});
it("breaks identical title ties by stable ID", () => {
  expect(compareTitles({ title: "Film", id: "b" }, { title: "film", id: "a" })).toBeGreaterThan(0);
});