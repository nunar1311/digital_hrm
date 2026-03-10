"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { vi } from "date-fns/locale";

interface DatePickerProps {
    date?: Date;
    setDate: (date: Date | undefined) => void;
}

export function DatePicker({ date, setDate }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!date}
                    className=" justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                >
                    {date ? (
                        format(date, "PPP", { locale: vi })
                    ) : (
                        <span>Chọn ngày</span>
                    )}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        setDate(d);
                        setOpen(false);
                    }}
                    defaultMonth={date}
                    locale={vi}
                />
            </PopoverContent>
        </Popover>
    );
}
