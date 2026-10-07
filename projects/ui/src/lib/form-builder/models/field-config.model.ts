export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'autocomplete'
  | 'search'
  | 'date'
  | 'datetime'
  | 'month'
  | 'year'
  | 'file'
  | 'image-selector'
  | 'array';

export type OperatorType = 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

/**
 * Configuration for an action button alongside a form field (select, autocomplete)
 * Useful for "Create New" buttons that open dialogs
 */
export interface FieldAction {
  /** Icon name from the icon set */
  icon: string;
  /** Aria label for accessibility */
  ariaLabel: string;
  /** Tooltip text (optional) */
  tooltip?: string;
}

export interface FieldConfig {
  // Basic properties
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  helper?: string; // Helper text shown in popover
  description?: string; // Description text shown below input
  note?: string; // Note text shown below input with info styling
  noteVariant?: 'info' | 'warning' | 'success' | 'error' | 'neutral'; // Note color variant
  noteClasses?: string; // Custom classes for note styling
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;

  // Validation
  validation?: ValidationRule[];

  // Options (for select, radio, autocomplete)
  options?: SelectOption[];
  searchable?: boolean;
  minSearchLength?: number;
  /**
   * Enable multiple selection (for select and autocomplete fields)
   * When true:
   * - Shows checkboxes for each option (autocomplete)
   * - Form control value will be an array of selected values
   * - If emitSelectedObject is true, selectedObjects will contain an array of selected option objects
   * @default false
   */
  multiple?: boolean;
  optionPresentation?: 'dropdown' | 'chips';
  chipLayout?: 'inline' | 'wrap';

  // Action button (for select, autocomplete - e.g., "Create New" button)
  action?: FieldAction;

  // API Options
  optionsFromApi?: ApiOptionsConfig;

  /**
   * Whether to emit the full selected object in fieldChange event
   * Only applies to autocomplete and select fields
   * When true, the selected option object(s) will be included in fieldChange event's selectedObjects
   * - For single select: returns single option object
   * - For multiple select: returns array of option objects
   * @default false
   */
  emitSelectedObject?: boolean;

  // Dependencies
  dependsOn?: FieldDependency | FieldDependency[];

  // Conditional Display
  showWhen?: ConditionRule | ConditionRule[];
  hideWhen?: ConditionRule | ConditionRule[];

  // Field-specific configs
  rows?: number; // textarea
  min?: number; // number
  max?: number; // number
  step?: number; // number
  accept?: string; // file
  minDate?: string; // date, datetime, month, year (YYYY-MM-DD, YYYY-MM, or YYYY)
  maxDate?: string; // date, datetime, month, year (YYYY-MM-DD, YYYY-MM, or YYYY)
  dateMode?: 'date' | 'datetime-local' | 'month' | 'year'; // date input mode (optional, defaults based on type)

  // Image selector configs
  mediaType?: string; // Filter by media type (e.g., 'Cover', 'Banner')
  allowUpload?: boolean; // Allow uploading new images
  altText?: string; // Alt text for the image
  showPreview?: boolean; // Show image preview (default: true)
  editableInput?: boolean; // Allow manual URL input (default: false)

  // File input configs
  maxSize?: number; // Maximum file size in bytes
  maxFiles?: number; // Maximum number of files (for multiple)
  enableDragDrop?: boolean; // Enable drag & drop zone (default: true)

  // Array field configs
  arrayFields?: FieldConfig[]; // Child fields for array type
  minItems?: number; // Minimum number of items (default: 0)
  maxItems?: number; // Maximum number of items (default: unlimited)
  addButtonLabel?: string; // Label for add button (default: 'Add Item')
  removeButtonLabel?: string; // Label for remove button (default: 'Remove')
  canRemoveAll?: boolean; // Allow removing all items (default: true)
  arrayLayout?: 'vertical' | 'grid'; // Layout for array items (default: 'vertical')
  arrayColumns?: number; // Number of columns for grid layout (default: 1)
  itemLabel?: string; // Label template for items (e.g., 'Item {index}', 'Phone {index}')

  // Layout
  cssClass?: string;
  containerClass?: string;
  order?: number;
  fullWidth?: boolean; // Force field to span full width in grid layout
  columnSpan?: number; // Number of columns to span in grid layout

  // Events
  onChange?: string; // Event handler name
  onBlur?: string;
}

export interface ApiOptionsConfig {
  url: string;
  method: 'GET' | 'POST';
  baseUrl?: string;
  cache?: boolean;
  searchParam?: string; // Query parameter name for search
  debounceTime?: number;
  loadOnInit?: boolean; // Whether to load options immediately (default: true)

  // Static filters
  filters?: ApiFilter[];

  // Dynamic filters based on form values
  dynamicFilters?: DynamicFilter[];

  // Response mapping
  map?: {
    label: string | string[]; // Path to label in response
    value: string; // Path to value in response
    data?: string; // Path to array in response (e.g., "data.results")
  };

  // Request transformation
  transformRequest?: (query: string, formValues: any) => any;

  // Response transformation
  transformResponse?: (response: any) => SelectOption[];
}

export interface ApiFilter {
  field: string;
  operator: OperatorType;
  values?: any[];
  value?: any;
  valueFrom?: string; // Get value from another form field
  whenNotEmpty?: boolean; // Only apply if valueFrom field is not empty
}

export interface DynamicFilter extends ApiFilter {
  valueFrom: string; // Required for dynamic filters
  whenNotEmpty?: boolean;
}

export interface FieldDependency {
  field: string; // Field key to depend on
  refreshOn?: 'change' | 'blur'; // When to refresh
  clearOnChange?: boolean; // Clear this field when dependency changes
}

export interface ConditionRule {
  field: string;
  operator: OperatorType;
  value?: any;
  values?: any[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any; // For minLength, maxLength, min, max, pattern
  message?: string; // Custom error message
  validator?: string; // Custom validator function name
}

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
  [key: string]: any;
}
