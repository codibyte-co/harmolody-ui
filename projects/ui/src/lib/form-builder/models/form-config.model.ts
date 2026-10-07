import { FieldConfig } from './field-config.model';

/**
 * Custom action button configuration
 */
export interface FormAction {
  /** Unique identifier for the action (used in actionClick event) */
  key: string;
  /** Button label text */
  label: string;
  /** Button type: 'button' (default), 'submit', or 'reset' */
  type?: 'button' | 'submit' | 'reset';
  /** Button variant for styling */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'link';
  /** Custom CSS classes (overrides variant styling) */
  cssClass?: string;
  /** Icon name to display (optional) */
  icon?: string;
  /** Icon position: 'left' (default) or 'right' */
  iconPosition?: 'left' | 'right';
  /** Whether to disable the button when form is invalid */
  disableOnInvalid?: boolean;
  /** Whether to disable the button when form is submitting */
  disableOnSubmitting?: boolean;
  /** Whether the button is hidden */
  hidden?: boolean;
  /** Order/position of the button (lower numbers appear first) */
  order?: number;
}

/**
 * Semantic group of fields rendered inside a fieldset.
 * Field values remain flat; `fields` only controls presentation and ordering.
 */
export interface FormFieldsetConfig {
  /** Stable identifier used to track the fieldset */
  key: string;
  /** Accessible fieldset legend */
  legend: string;
  /** Supporting text displayed below the legend */
  description?: string;
  /** Field keys to render in this group, in display order */
  fields: string[];
  /** Optional classes applied to the fieldset */
  cssClass?: string;
}

export interface FormConfig {
  fields: FieldConfig[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number; // For grid layout
  /**
   * Label/control arrangement for every field. Defaults to `column`.
   * `stacked` is retained as a compatibility alias for `column`.
   */
  fieldLayout?: 'column' | 'row' | 'stacked';
  /** Optional semantic field groups. Fields not listed here render after the groups. */
  fieldsets?: FormFieldsetConfig[];
  showCancelButton?: {
    label?: string;
    cssClass?: string;
    hidden?: boolean;
  };
  submitButton?: {
    label: string;
    cssClass?: string;
    hidden?: boolean;
  };
  resetButton?: {
    label: string;
    cssClass?: string;
    hidden?: boolean;
  };
  /**
   * Custom action buttons array
   * When provided, the built-in cancel, submit, and reset buttons are ignored
   * Use this for multi-step forms, custom workflows, etc.
   */
  actions?: FormAction[];
  actionsWrapper?: {
    cssClass?: string;
  };

  // Global API config (base URL, headers, etc.)
  apiConfig?: {
    baseUrl?: string;
    headers?: Record<string, string>;
  };
  // When to show validation errors
  validationStrategy?: 'touched' | 'submit'; // 'touched' = show on blur, 'submit' = show only after submit attempt
  /**
   * Whether to emit full selected objects in fieldChange event
   * When true, fieldChange event includes selectedObjects with full option data
   * When false, only valueChange event is emitted (default behavior)
   * @default false
   */
  emitSelectedObjects?: boolean;
}
