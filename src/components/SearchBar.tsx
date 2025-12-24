import { useRef, useEffect } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SearchBar({
    value,
    onChange,
    onKeyDown,
    placeholder = 'Search tables or columns...',
    autoFocus = true,
}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Focus when window becomes visible/active
    useEffect(() => {
        const handleWindowFocus = () => {
            if (autoFocus && inputRef.current) {
                inputRef.current.focus();
            }
        };

        window.addEventListener('focus', handleWindowFocus);
        // Also listen for visibility changes (when app comes to foreground)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && autoFocus && inputRef.current) {
                inputRef.current.focus();
            }
        });

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [autoFocus]);

    return (
        <div className="search-bar relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-form-type="other"
                className="w-full pl-10 pr-20 py-3 text-lg border-2 border-gray-200 rounded-xl 
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                   transition-all duration-200 bg-white dark:bg-gray-800 
                   dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 
                      bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                ⌘⇧Space
            </div>
        </div>
    );
}
