import { getRegionActionLabel } from "../useRedactStore";

/**
 * The per-region button in the censor list drives the SAME toggle
 * (`toggleRedaction`) whichever label it shows, so the label must describe
 * the action a tap performs next, not the region's current state:
 *
 * - not yet redacted -> tapping WILL redact it -> button reads "Redact"
 * - already redacted -> tapping WILL revert it -> button reads "Keep"
 *
 * A tester-reported bug had this backwards: a freshly-detected card number
 * (isRedacted: true by default, per ocrScanner) showed "Redact" -- the
 * action that was already done -- instead of "Keep", the actual revert
 * action a tap would perform.
 */
describe("getRegionActionLabel", () => {
  it("offers to redact a region that is not yet redacted", () => {
    expect(getRegionActionLabel(false)).toBe("redact");
  });

  it("offers to keep (revert) a region that is already redacted", () => {
    expect(getRegionActionLabel(true)).toBe("keep");
  });
});
