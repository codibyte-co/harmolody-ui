import { twMerge } from 'tailwind-merge';

export const FORM_CONTROL_BASE_CLASSES =
  'w-full pl-3 pr-3 py-2 border rounded-lg shadow placeholder-gray-400 focus:outline-none focus:ring-1 bg-surface placeholder:text-md disabled:opacity-50 disabled:cursor-not-allowed';

const FORM_CONTROL_ERROR_CLASSES = 'border-red-300 focus:ring-red-500 focus:border-red-500';
const FORM_CONTROL_NORMAL_CLASSES =
  'border-border focus:ring-purple-500 focus:border-purple-500 focus:shadow-purple-100';

interface FormControlClassOptions {
  invalid?: boolean;
  additionalClasses?: string;
  customClasses?: string;
}

export function buildFormControlClasses(options: FormControlClassOptions = {}): string {
  const { invalid = false, additionalClasses = '', customClasses = '' } = options;

  return twMerge(
    FORM_CONTROL_BASE_CLASSES,
    invalid ? FORM_CONTROL_ERROR_CLASSES : FORM_CONTROL_NORMAL_CLASSES,
    additionalClasses,
    customClasses,
  );
}
