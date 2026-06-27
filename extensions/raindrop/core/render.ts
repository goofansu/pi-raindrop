import { keyHint } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";

export interface RenderTheme {
  fg(name: string, text: string): string;
  bold(text: string): string;
}

export function expandHint(): string {
  try {
    return keyHint("app.tools.expand", "to expand");
  } catch {
    return "Ctrl+O to expand";
  }
}

export function renderToolCall(resource: string, summary: string, theme: RenderTheme): Text {
  return new Text(
    `${theme.fg("toolTitle", theme.bold(`${resource} `))}${theme.fg("dim", summary)}`,
    0,
    0,
  );
}

export function renderToolResult(input: {
  resource: string;
  content: string;
  isError: boolean;
  expanded: boolean;
  collapse: boolean;
  theme: RenderTheme;
}): Text {
  const icon = input.isError ? input.theme.fg("error", "✗") : input.theme.fg("success", "✓");
  const title = `${icon} ${input.theme.fg("toolTitle", input.theme.bold(input.resource))}`;

  if (input.collapse && !input.expanded && !input.isError && input.content.includes("\n")) {
    const summary = input.content.split("\n", 1)[0] ?? "";
    return new Text(`${title}\n${summary}\n${input.theme.fg("dim", `(${expandHint()})`)}`, 0, 0);
  }

  return new Text(`${title}\n${input.content}`, 0, 0);
}
