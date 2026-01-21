// types/form-schema.ts
export type FormFieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'password' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date'
  | 'custom';

export interface FormField<T = any> {
  name: keyof T & string; // Pastikan name adalah string
  type: FormFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  disabled?: boolean;
  
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  
  // For text fields
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  
  // For select/radio fields
  options?: Array<{ value: any; label: string }>;
  
  // For date fields
  disabledDates?: Date[];
  
  // For custom fields
  render?: (value: any, onChange: (value: any) => void) => React.ReactNode;
  
  // For textarea
  rows?: number;
}

export interface FormSchema<T = any> {
  fields: FormField<T>[];
  title?: (data: T) => string;
  description?: (data: T) => string;
  validation?: (data: T) => Record<string, string>;
}