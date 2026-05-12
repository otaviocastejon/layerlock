import { DEMO_WIDGET_VERSION } from "../core/model.js";

export function demoWidgetBanner(): string {
  return `demo-widget v${String(DEMO_WIDGET_VERSION)}`;
}
