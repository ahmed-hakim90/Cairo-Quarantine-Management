export type FeedbackToastKind = "success" | "error";

export type FeedbackToastItem = {
  id: string;
  kind: FeedbackToastKind;
  message: string;
};

export type FeedbackToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
};

let toastApi: FeedbackToastApi = {
  success: () => {},
  error: () => {},
};

export function registerFeedbackToast(api: FeedbackToastApi) {
  toastApi = api;
}

export const feedbackToast: FeedbackToastApi = {
  success(message) {
    toastApi.success(message);
  },
  error(message) {
    toastApi.error(message);
  },
};
