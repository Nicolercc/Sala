import type { View } from "@/policy/visibility";

function publicBoardOnly(view: View<"publicBoard">) {
  return view.tokenLabel;
}

declare const publicView: View<"publicBoard">;

publicBoardOnly(publicView);
// @ts-expect-error public board views cannot access staff-only names.
publicView.fullName;
