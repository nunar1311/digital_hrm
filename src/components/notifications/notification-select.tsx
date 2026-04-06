import { ChevronDownIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function NotificationSelect({
    value,
    onValueChange,
    options,
    disabled,
}: {
    value: string;
    onValueChange: (v: string) => void;
    options: readonly {
        value: string;
        label: string;
        description: string;
    }[];
    disabled?: boolean;
}) {
    const selected = options.find((o) => o.value === value);
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md cursor-pointer w-35! justify-between"
                >
                    {selected?.label ?? value}
                    <ChevronDownIcon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="min-w-[280px]"
                align="end"
            >
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={opt.value === value}
                        onCheckedChange={(v) =>
                            onValueChange(v ? opt.value : "")
                        }
                        className="flex flex-col items-start gap-0.5 justify-center"
                    >
                        <div className="flex w-full items-center justify-between">
                            <span className="font-semibold text-foreground">
                                {opt.label}
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {opt.description}
                        </span>
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default NotificationSelect;
