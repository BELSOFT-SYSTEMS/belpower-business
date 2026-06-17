'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type BusinessDatePickerProps = {
  id?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fitContent?: boolean;
  'aria-label'?: string;
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function BusinessDatePicker({
  id: idProp,
  value,
  onChange,
  placeholder = 'All dates',
  disabled = false,
  className,
  fitContent = false,
  'aria-label': ariaLabel,
}: BusinessDatePickerProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const calendarId = `${id}-calendar`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedDate = value ? parseISO(value) : null;
  const [viewMonth, setViewMonth] = useState(() => selectedDate ?? new Date());

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (value) {
      setViewMonth(parseISO(value));
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const displayLabel = selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder;

  const handleSelectDay = (day: Date) => {
    onChange(toDateKey(day));
    close();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', fitContent ? 'w-fit max-w-full' : 'w-full', className)}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={calendarId}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className={cn(
          'flex items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm outline-none transition',
          fitContent ? 'w-max max-w-full whitespace-nowrap' : 'w-full',
          'focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20',
          disabled && 'cursor-default bg-gray-50 text-gray-500',
          !disabled && 'hover:border-gray-400',
        )}
      >
        <span className={cn('flex items-center gap-2', !selectedDate && 'text-gray-500')}>
          <Calendar className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-500 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && !disabled ? (
        <div
          id={calendarId}
          role="dialog"
          aria-labelledby={id}
          className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((current) => subMonths(current, 1))}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-gray-900">{format(viewMonth, 'MMMM yyyy')}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((current) => addMonths(current, 1))}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-gray-400"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const inCurrentMonth = isSameMonth(day, viewMonth);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm transition',
                    !inCurrentMonth && 'text-gray-300',
                    inCurrentMonth && 'text-gray-900 hover:bg-gray-50',
                    isToday(day) && !isSelected && 'font-semibold text-blue-normal',
                    isSelected && 'bg-blue-normal font-semibold text-white hover:bg-blue-normal-hover',
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(toDateKey(new Date()));
                close();
              }}
              className="text-xs font-medium text-blue-normal hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                close();
              }}
              className="text-xs font-medium text-gray-600 hover:underline"
            >
              All dates
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
