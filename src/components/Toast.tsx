import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    }[type];

    const icon = {
        success: '✓',
        error: '✗',
        info: 'ℹ',
    }[type];

    return (
        <div
            className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
                  text-white ${bgColor} transition-all duration-300 z-50
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
            <span className="font-bold">{icon}</span>
            <span>{message}</span>
        </div>
    );
}

// Toast manager for multiple toasts
interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastManagerProps {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}

export function ToastManager({ toasts, onRemove }: ToastManagerProps) {
    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
}

// Simple toast hook
import { useCallback } from 'react';
import { create } from 'zustand';

interface ToastStore {
    toasts: ToastItem[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type = 'success') => {
        const id = Date.now().toString();
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

export function useToast() {
    const { addToast, removeToast, toasts } = useToastStore();

    const showSuccess = useCallback((message: string) => {
        addToast(message, 'success');
    }, [addToast]);

    const showError = useCallback((message: string) => {
        addToast(message, 'error');
    }, [addToast]);

    const showInfo = useCallback((message: string) => {
        addToast(message, 'info');
    }, [addToast]);

    return { showSuccess, showError, showInfo, toasts, removeToast };
}
