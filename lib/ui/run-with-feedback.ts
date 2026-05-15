import { feedbackToast } from "@/lib/ui/feedback-toast";

export type RunWithFeedbackOptions<T> = {
  successMessage: string;
  errorMessage?: string;
  onSuccess?: (result: T) => void;
};

export async function runWithFeedback<T>(
  fn: () => Promise<T>,
  opts: RunWithFeedbackOptions<T>,
): Promise<T | undefined> {
  try {
    const result = await fn();
    feedbackToast.success(opts.successMessage);
    opts.onSuccess?.(result);
    return result;
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : (opts.errorMessage ?? "حدث خطأ. حاول مرة أخرى.");
    feedbackToast.error(message);
    return undefined;
  }
}
