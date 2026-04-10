"use client";

import { DateInput as AriaDateInput, DateSegment } from "react-aria-components";
import { cn } from "@/lib/utils";

export const dateInputStyle =
  "border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:ring-[3px] flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none";

export function DateInput({
  className,
  unstyled,
  slot,
  ...props
}: Omit<React.ComponentProps<typeof AriaDateInput>, "children"> & {
  unstyled?: boolean;
}) {
  return (
    <AriaDateInput
      slot={slot}
      className={cn(
        !unstyled && dateInputStyle,
        "flex items-center gap-0.5 px-0 text-sm",
        className,
      )}
      {...props}
    >
      {(segment) => (
        <DateSegment
          segment={segment}
          className="rounded-sm px-0.5 py-0.5 text-foreground caret-transparent outline-none data-[type=literal]:text-muted-foreground/70 data-focused:bg-primary data-focused:text-primary-foreground"
        />
      )}
    </AriaDateInput>
  );
}
