import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-sm transition-all resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
