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
import { cn } from "@/lib/utils";
import { DropdownNavProps, DropdownProps } from "react-day-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

interface DatePickerProps {
    date?: Date;
    setDate: (date: Date | undefined) => void;
    className?: string;
}

export function DatePicker({
    date,
    setDate,
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleCalendarChange = (
        _value: string | number,
        _e: React.ChangeEventHandler<HTMLSelectElement>,
    ) => {
        const _event = {
            target: {
                value: String(_value),
            },
        } as React.ChangeEvent<HTMLSelectElement>;
        _e(_event);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!date}
                    className={cn(
                        " justify-between text-left font-normal data-[empty=true]:text-muted-foreground",
                        className,
                    )}
                >
                    {date ? (
                        format(date, "dd/MM/yyyy", { locale: vi })
                    ) : (
                        <span>Chọn ngày</span>
                    )}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={date}
                    onSelect={(d) => {
                        setDate(d);
                        setOpen(false);
                    }}
                    classNames={{
                        month_caption: "mx-0",
                    }}
                    hideNavigation
                    defaultMonth={new Date()}
                    locale={vi}
                    components={{
                        Dropdown: (props: DropdownProps) => {
                            return (
                                <Select
                                    onValueChange={(value) => {
                                        if (props.onChange) {
                                            handleCalendarChange(
                                                value,
                                                props.onChange,
                                            );
                                        }
                                    }}
                                    value={String(props.value)}
                                >
                                    <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                        {props.options?.map(
                                            (option) => (
                                                <SelectItem
                                                    disabled={
                                                        option.disabled
                                                    }
                                                    key={option.value}
                                                    value={String(
                                                        option.value,
                                                    )}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            );
                        },
                        DropdownNav: (props: DropdownNavProps) => {
                            return (
                                <div className="flex w-full items-center gap-2">
                                    {props.children}
                                </div>
                            );
                        },
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
