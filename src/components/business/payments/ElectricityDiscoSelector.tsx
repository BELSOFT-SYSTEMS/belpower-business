'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { getDiscoLogoPath } from '@/utils/discoLogoMap';
import { cn } from '@/lib/utils';

export type ElectricityDiscoOption = {
  code: string;
  name: string;
  available?: boolean;
};

function DiscoLogo({ code, size = 28 }: { code: string; size?: number }) {
  const [src, setSrc] = useState(() => getDiscoLogoPath(code));

  useEffect(() => {
    setSrc(getDiscoLogoPath(code));
  }, [code]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="block h-7 w-7 shrink-0 rounded-full object-contain"
      onError={() => setSrc('/electricity.png')}
    />
  );
}

type ElectricityDiscoSelectorProps = {
  discos: ElectricityDiscoOption[];
  selectedCode: string;
  onSelect: (code: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
};

export function ElectricityDiscoSelector({
  discos,
  selectedCode,
  onSelect,
  label = 'Disco',
  placeholder = 'Select electricity provider',
  searchPlaceholder = 'Search disco…',
  emptyLabel = 'No disco found',
  disabled = false,
  className,
}: ElectricityDiscoSelectorProps) {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDisco = discos.find((disco) => disco.code === selectedCode);

  const filteredDiscos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return discos;
    return discos.filter(
      (disco) =>
        disco.name.toLowerCase().includes(query) || disco.code.toLowerCase().includes(query),
    );
  }, [discos, searchQuery]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (code: string, available = true) => {
    if (!available) return;
    onSelect(code);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <label htmlFor={generatedId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}

      <div ref={containerRef} className={cn('relative', label ? 'mt-1.5' : undefined)}>
        <button
          id={generatedId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => {
            if (!disabled) setOpen((current) => !current);
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm outline-none transition',
            'focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20',
            disabled && 'cursor-default bg-gray-50 text-gray-500',
            !disabled && 'hover:border-gray-400',
          )}
        >
          {selectedDisco ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100">
              <DiscoLogo code={selectedDisco.code} size={24} />
            </span>
          ) : null}
          <span className={cn('min-w-0 flex-1 truncate', !selectedDisco && 'text-gray-500')}>
            {selectedDisco?.name || placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>

        {open && !disabled ? (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
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

            <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-1">
              {filteredDiscos.map((disco) => {
                const available = disco.available !== false;
                const isSelected = disco.code === selectedCode;
                return (
                  <li key={disco.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={!available}
                      onClick={() => handleSelect(disco.code, available)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition',
                        available ? 'text-gray-900 hover:bg-gray-50' : 'cursor-not-allowed text-gray-400',
                        isSelected && 'bg-blue-50 font-medium text-blue-normal',
                      )}
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100">
                        <DiscoLogo code={disco.code} size={24} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{disco.name}</span>
                      {!available ? (
                        <span className="text-xs text-gray-400">Unavailable</span>
                      ) : isSelected ? (
                        <Check className="h-4 w-4 shrink-0" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })}

              {filteredDiscos.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-gray-500">{emptyLabel}</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
