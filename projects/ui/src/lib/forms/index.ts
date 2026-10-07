// Core form components
export { CheckboxComponent } from './checkbox/checkbox';
export {
  ChoiceChipsComponent,
  type ChoiceChipsActionButton,
  type ChoiceChipsLayout,
  type ChoiceChipsValue,
} from './choice-chips/choice-chips';
export { EmailInputComponent } from './email-input/email-input';
export { FormFieldComponent } from './form-field/form-field';
export { InputComponent } from './input/input';
export { PasswordInputComponent } from './password-input/password-input';
export { RadioGroupComponent, type RadioOption } from './radio-group/radio-group';
export {
  SelectComponent,
  type SelectControlValue,
  type SelectActionButton,
  type SelectDropdownAlign,
  type SelectDropdownPlacement,
  type SelectDropdownWidth,
  type SelectOption,
  type SelectValue,
} from './select/select';
export { TextareaComponent } from './textarea/textarea';
export { SwitchComponent } from './switch/switch';

// Specialized input components

export {
  AutocompleteComponent,
  type AutocompleteActionButton,
  type AutocompleteOption,
} from './autocomplete/autocomplete';
export { DateInputComponent, type DateInputMode } from './date-input/date-input';
export { FileInputComponent, type FileInfo } from './file-input/file-input';
export { NumberInputComponent } from './number-input/number-input';
export { SearchInputComponent } from './search-input/search-input';
export { TelInputComponent } from './tel-input/tel-input';
export { UrlInputComponent } from './url-input/url-input';

// Utility components
export { FormDescriptionComponent } from './form-description/form-description';
export { FormErrorComponent } from './form-error/form-error';
export { FormHelperComponent } from './form-helper/form-helper';
export { FormHintComponent } from './form-hint/form-hint';
export { FormLabelComponent } from './form-label/form-label';
export { FormNoteComponent } from './form-note/form-note';

// Utility functions
export { getErrorMessage, getErrorMessages } from './utils/form-errors';
export { buildFormControlClasses, FORM_CONTROL_BASE_CLASSES } from './utils/form-control-classes';
