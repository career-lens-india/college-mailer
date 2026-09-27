import { saveDraft, withTemplate } from "./draftStorage.ts";
import type { ComposerMode, OutreachDraft } from "../types/outreach.ts";

export const DESKTOP_SPLIT_MEDIA_QUERY = "(min-width: 1024px)";
export const TEMPLATE_SWITCH_REFRESH_KEY = "careerlens-template-switch-refresh";
export const TEMPLATE_REFRESH_LABEL = "Updating template...";

export type TemplateSwitchAction = "ignore" | "live" | "refresh";

type FlagStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function planTemplateSwitch(
  current: ComposerMode,
  next: ComposerMode,
  desktopSplit: boolean,
): TemplateSwitchAction {
  if (current === next) return "ignore";
  return desktopSplit ? "refresh" : "live";
}

export function markTemplateSwitchRefresh(storage: Pick<Storage, "setItem">): void {
  try {
    storage.setItem(TEMPLATE_SWITCH_REFRESH_KEY, "true");
  } catch {
    // The saved draft still restores the selected template after reload.
  }
}

export function consumeTemplateSwitchRefresh(storage: Pick<Storage, "getItem" | "removeItem">): boolean {
  try {
    const pending = storage.getItem(TEMPLATE_SWITCH_REFRESH_KEY) === "true";
    if (pending) storage.removeItem(TEMPLATE_SWITCH_REFRESH_KEY);
    return pending;
  } catch {
    return false;
  }
}

export function commitTemplateSwitch(
  draft: OutreachDraft,
  next: ComposerMode,
  desktopSplit: boolean,
  session: Pick<FlagStorage, "setItem">,
): { action: TemplateSwitchAction; draft: OutreachDraft } {
  const action = planTemplateSwitch(draft.selectedTemplate, next, desktopSplit);
  if (action === "ignore") return { action, draft };
  const nextDraft = withTemplate(draft, next);
  if (action === "live") return { action, draft: nextDraft };
  saveDraft(nextDraft);
  markTemplateSwitchRefresh(session);
  return { action, draft: nextDraft };
}
