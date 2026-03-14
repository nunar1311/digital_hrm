"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value = [],
  onChange,
  placeholder = "Chọn...",
  multiple = false,
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      const newValue = value.includes(selectedValue)
        ? value.filter((v) => v !== selectedValue)
        : [...value, selectedValue]
      onChange?.(newValue)
    } else {
      onChange?.([selectedValue])
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent, valueToRemove: string) => {
    e.stopPropagation()
    onChange?.(value.filter((v) => v !== valueToRemove))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-[40px]", !value.length && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange?.([])
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
