export type PortalAssistantAnswerType =
  | "office"
  | "vaccine"
  | "price"
  | "booking"
  | "contact";

export type PortalAssistantResponse = {
  answer: string;
  source: string;
  type: PortalAssistantAnswerType;
  confidence: number;
};

export type PortalAssistantMeta = {
  source: string;
  type: PortalAssistantAnswerType;
  confidence: number;
};
