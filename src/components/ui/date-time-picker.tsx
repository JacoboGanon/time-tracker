"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";

/**
 * DateTimePicker — date + time selection via popover.
 * Value is a datetime-local string ("YYYY-MM-DDTHH:MM") for compatibility.
 */
interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:MM"
  onChange: (value: string) => void;
  className?: string;
}

function toTwoDigits(n: number) {
  return String(n).padStart(2, "0");
}

function parseDatetimeLocal(value: string) {
  if (!value) return { date: undefined, hours: 0, minutes: 0 };
  const [datePart, timePart] = value.split("T");
  if (!datePart) return { date: undefined, hours: 0, minutes: 0 };
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  return {
    date: y && m && d ? new Date(y, m - 1, d) : undefined,
    hours: h ?? 0,
    minutes: min ?? 0,
  };
}

function buildDatetimeLocal(date: Date, hours: number, minutes: number) {
  const yyyy = date.getFullYear();
  const mm = toTwoDigits(date.getMonth() + 1);
  const dd = toTwoDigits(date.getDate());
  return `${yyyy}-${mm}-${dd}T${toTwoDigits(hours)}:${toTwoDigits(minutes)}`;
}

function DateTimePicker({ value, onChange, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { date, hours, minutes } = parseDatetimeLocal(value);

  const displayText = React.useMemo(() => {
    if (!date) return "Pick date & time";
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dateStr}, ${toTwoDigits(hours)}:${toTwoDigits(minutes)}`;
  }, [date, hours, minutes]);

  const handleDateChange = (newDate: Date) => {
    onChange(buildDatetimeLocal(newDate, hours, minutes));
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(23, Number(e.target.value) || 0));
    if (date) onChange(buildDatetimeLocal(date, v, minutes));
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(0, Math.min(59, Number(e.target.value) || 0));
    if (date) onChange(buildDatetimeLocal(date, hours, v));
  };

  const handleHoursWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    if (!date) return;
    const delta = e.deltaY < 0 ? 1 : -1;
    const newH = (hours + delta + 24) % 24;
    onChange(buildDatetimeLocal(date, newH, minutes));
  };

  const handleMinutesWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
    if (!date) return;
    const delta = e.deltaY < 0 ? 5 : -5;
    const newM = (minutes + delta + 60) % 60;
    onChange(buildDatetimeLocal(date, hours, newM));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 px-3 text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate text-xs">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar value={date} onChange={handleDateChange} />

        {/* Time selector */}
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Clock className="size-3.5 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground">Time</span>
          <div className="ml-auto flex items-center gap-0.5">
            <input
              type="number"
              min={0}
              max={23}
              value={toTwoDigits(hours)}
              onChange={handleHoursChange}
              onWheel={handleHoursWheel}
              className="h-7 w-10 rounded-md border border-input bg-transparent text-center font-mono text-xs outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
            />
            <span className="text-xs font-semibold text-muted-foreground/50">
              :
            </span>
            <input
              type="number"
              min={0}
              max={59}
              value={toTwoDigits(minutes)}
              onChange={handleMinutesChange}
              onWheel={handleMinutesWheel}
              className="h-7 w-10 rounded-md border border-input bg-transparent text-center font-mono text-xs outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
