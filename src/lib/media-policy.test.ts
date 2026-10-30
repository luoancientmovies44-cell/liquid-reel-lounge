import { expect, it } from "vitest";
import { allowedMediaSource, isMediaContentType, hasMediaAccess, mediaFilename } from "./media-policy";
it("allows real public Drive and R2 hosts, never arbitrary URLs", () => {
  expect(allowedMediaSource("https://drive.google.com/file/d/abc-123/view")).toContain("id=abc-123");
  expect(allowedMediaSource("https://pub-example.r2.dev/video.mp4")).toBe("https://pub-example.r2.dev/video.mp4");
  expect(allowedMediaSource("https://evil.example/file/d/abc/view")).toBeNull();
  expect(allowedMediaSource("https://drive.google.com.evil.example/file/d/abc/view")).toBeNull();
});
it("rejects HTML, plain text and JSON even with successful HTTP status", () => {
  for (const type of ["text/html", "text/plain", "application/json"]) expect(isMediaContentType(type)).toBe(false);
  expect(isMediaContentType("video/mp4")).toBe(true);
});
it("retains subscriptions with exact expiry and Agent restrictions", () => {
  const plan = { isActive: true, expiresAt: 2000, plan: "1 Month" };
  expect(hasMediaAccess(plan, false, false, 1999)).toBe(true);
  expect(hasMediaAccess(plan, false, false, 2000)).toBe(false);
  expect(hasMediaAccess(plan, true, false, 1999)).toBe(false);
  expect(hasMediaAccess({ ...plan, plan: "Agent Plan" }, true, false, 1999)).toBe(true);
  expect(hasMediaAccess(null, true, true, 2000)).toBe(true);
});
it("sanitizes filenames without losing video extensions", () => {
  expect(mediaFilename('Film/one\r\n"', "https://pub-test.r2.dev/file.webm")).toBe("Filmone.webm");
});