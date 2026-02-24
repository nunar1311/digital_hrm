import { toast as sonnerToast } from "sonner";
import type { ToastT } from "sonner";
import { XIcon } from "lucide-react";

export const toast = (
    type: ToastT["type"],
    message: string,
    options?: Partial<ToastT>,
) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    sonnerToast[type](message, {
        cancel: {
            label: <XIcon className="size-4" />,
            onclick: () => {},
        },
        cancelButtonStyle: {
            backgroundColor: "transparent",
            color: "var(--foreground)",
            height: "20px",
            width: "20px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            margin: "0",
            marginInlineStart: "auto",
        },
        duration: 3000,
        ...options,
    });
};
