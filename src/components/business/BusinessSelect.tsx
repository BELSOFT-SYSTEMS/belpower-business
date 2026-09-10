'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BusinessSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type BusinessSelectProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: BusinessSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  fitContent?: boolean;
  'aria-label'?: string;
};

export function BusinessSelect({
  id: idProp,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  emptyLabel = 'No results found',
  disabled = false,
  searchable = false,
  className,
  fitContent = false,
  'aria-label': ariaLabel,
}: BusinessSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listboxId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, searchQuery, searchable]);

  const close = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

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

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', fitContent ? 'w-fit max-w-full' : 'w-full', className)}
    >
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
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
        <span className={cn(!fitContent && 'truncate', !selected && 'text-gray-500')}>
          {selected?.label ?? placeholder}
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
          className={cn(
            'absolute z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
            fitContent ? 'min-w-full w-max' : 'w-full',
          )}
        >
          {searchable ? (
            <div className="border-b border-gray-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                />
              </div>
            </div>
          ) : null}

          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            className="max-h-60 overflow-auto py-1"
          >
            {filteredOptions.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition',
                      option.disabled
                        ? 'cursor-not-allowed text-gray-400'
                        : 'text-gray-900 hover:bg-gray-50',
                      isSelected && 'bg-blue-50 font-medium text-blue-normal',
                    )}
                  >
                    <span className={cn(!fitContent && 'truncate')}>{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}

            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-gray-500">{emptyLabel}</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
