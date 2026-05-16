export const HEALTH_GUIDE_ICON_IDS = [
  "heartPulse",
  "kaabaRitual",
  "peopleShield",
  "virusShield",
  "syringeVial",
  "covid",
  "lungs",
  "otherVaccines",
  "handWash",
  "clipboard",
  "doctor",
  "calendar",
  "water",
  "mask",
  "crowd",
  "walk",
  "sun",
  "tissue",
  "personalItems",
  "chronicCare",
] as const;

export type HealthGuideIconId = (typeof HEALTH_GUIDE_ICON_IDS)[number];
