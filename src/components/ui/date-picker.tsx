"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

/**
 * DatePicker — date-only selection via popover calendar.
 * Value is a YYYY-MM-DD string for compatibility with existing filter state.
 */
interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  }, [value]);

  const displayText = React.useMemo(() => {
    if (!dateValue) return placeholder;
    return dateValue.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [dateValue, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-[150px] justify-start gap-2 px-3 text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate text-xs">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar
          value={dateValue}
          onChange={(date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            onChange(`${yyyy}-${mm}-${dd}`);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
