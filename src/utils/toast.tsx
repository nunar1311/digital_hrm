import { toast as sonnerToast } from "sonner";
import type { ToastT } from "sonner";

export const toast = (
  type: ToastT["type"],
  message: string,
  options?: Partial<ToastT>,
) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  sonnerToast[type](message, {
    cancelButtonStyle: {
      backgroundColor: "#ffffff",
      color: "var(--foreground)",
      height: "20px",
      width: "20px",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      margin: "0",
      marginInlineStart: "auto",
    },
    actionButtonStyle: {
      backgroundColor: "var(--primary)",
      color: "var(--background)",
      fontSize: "12px",
      fontWeight: "500",
      border: "1px solid var(--border)",
    },
    duration: 3000,
    ...options,
  });
};
