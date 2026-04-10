"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  RangeCalendar as AriaRangeCalendar,
} from "react-aria-components";
import type { DateValue, RangeCalendarProps } from "react-aria-components";
import { cn } from "@/lib/utils";

export function RangeCalendar<T extends DateValue>({
  className,
  ...props
}: RangeCalendarProps<T> & { className?: string }) {
  return (
    <AriaRangeCalendar
      className={cn("w-fit", className)}
      {...props}
    >
      <header className="flex items-center gap-1 pb-1 w-full px-1">
        <Button
          slot="previous"
          className="flex size-7 items-center justify-center rounded-md outline-none hover:bg-accent data-focus-visible:ring-2 data-focus-visible:ring-ring"
        >
          <ChevronLeft size={16} />
        </Button>
        <Heading className="grow text-center text-sm font-medium" />
        <Button
          slot="next"
          className="flex size-7 items-center justify-center rounded-md outline-none hover:bg-accent data-focus-visible:ring-2 data-focus-visible:ring-ring"
        >
          <ChevronRight size={16} />
        </Button>
      </header>
      <CalendarGrid>
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="size-9 rounded-md text-xs font-medium text-muted-foreground">
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody className="[&_td]:px-0">
          {(date) => (
            <CalendarCell
              date={date}
              className={cn(
                "relative flex size-9 items-center justify-center whitespace-nowrap rounded-md text-sm font-normal text-foreground outline-none",
                // Hover & focus
                "data-hovered:bg-accent data-focus-visible:ring-2 data-focus-visible:ring-ring",
                // Selected (single / range endpoints)
                "data-selected:bg-primary data-selected:text-primary-foreground data-selected:rounded-none",
                // Range start/end rounding
                "data-selection-start:rounded-s-md data-selection-end:rounded-e-md",
                // Outside month
                "data-outside-month:text-muted-foreground/40 data-outside-month:data-selected:bg-accent/50",
                // Disabled
                "data-disabled:pointer-events-none data-disabled:opacity-30",
                // Unavailable
                "data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30",
              )}
            />
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </AriaRangeCalendar>
  );
}
