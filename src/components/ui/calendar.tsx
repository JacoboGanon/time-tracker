"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "./button";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
}

function Calendar({ value, onChange, className }: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(
    value?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = React.useState(
    value?.getMonth() ?? today.getMonth(),
  );

  React.useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const daysInPrevMonth = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const cells: { day: number; current: boolean; date: Date }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ day: d, current: false, date: new Date(y, m, d) });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      current: true,
      date: new Date(viewYear, viewMonth, d),
    });
  }

  // Next month leading days (fill to 42 cells = 6 rows)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ day: d, current: false, date: new Date(y, m, d) });
  }

  return (
    <div className={cn("w-[280px] select-none", className)}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={prevMonth}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="text-sm font-medium">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={nextMonth}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-[10px] font-medium text-muted-foreground/60 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isSelected = value && isSameDay(cell.date, value);
          const isToday = isSameDay(cell.date, today);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(cell.date)}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-md text-xs transition-colors",
                cell.current
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground/30 hover:bg-accent/50 hover:text-muted-foreground/60",
                isSelected &&
                  "bg-teal-600 text-white hover:bg-teal-500 hover:text-white",
                isToday && !isSelected && "font-semibold text-teal-400",
              )}
            >
              {cell.day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 size-0.5 -translate-x-1/2 rounded-full bg-teal-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
