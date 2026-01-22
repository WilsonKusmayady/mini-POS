// Di file: components/ui/edit-modal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormSchema } from '@/types/form-schema';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MoneyInput } from '@/components/ui/money-input';

// Import komponen Date Picker alternatif jika Calendar tidak ada
// Buat DatePicker sederhana
const DatePickerInput = ({ 
  value, 
  onChange, 
  disabled, 
  placeholder = 'Pilih tanggal',
  error = false 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}) => {
  return (
    <Input
      type="date"
      value={value ? new Date(value).toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={error ? 'border-red-500' : ''}
      placeholder={placeholder}
    />
  );
};

// Tambahkan tipe untuk width options
export type ModalWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | number;

interface EditModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T | null;
  schema: FormSchema<T> | null;
  onSubmit: (data: T) => Promise<void>;
  onDelete?: (data: T) => Promise<void>;
  isLoading?: boolean;
  deleteLoading?: boolean;
  showDelete?: boolean;
  deleteConfirmMessage?: string;
  customActions?: React.ReactNode;
  width?: ModalWidth; // Tambahkan prop width
  maxHeight?: string; // Tambahkan prop untuk max height
}

export function EditModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  data,
  schema,
  onSubmit,
  onDelete,
  isLoading = false,
  deleteLoading = false,
  showDelete = false,
  deleteConfirmMessage = 'Apakah Anda yakin ingin menghapus data ini?',
  customActions,
  width = 'md', // Default ke 'md'
  maxHeight = '90vh', // Default max height
}: EditModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (data && schema && isOpen) {
      console.log('EditModal: initializing form data');
      const initialData: Partial<T> = {};
      schema.fields.forEach((field) => {
        const fieldName = field.name as string;
        initialData[fieldName as keyof T] = data[fieldName] ?? field.defaultValue;
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [data, schema, isOpen]);

  // Fungsi untuk menentukan class width berdasarkan prop width
  const getWidthClass = () => {
    if (typeof width === 'number') {
      // Jika width berupa angka, gunakan nilai pixel
      return `max-w-[${width}px]`;
    }

    // Jika width berupa string, gunakan class Tailwind
    const widthClasses = {
      'sm': 'sm:max-w-sm',
      'md': 'sm:max-w-md',
      'lg': 'sm:max-w-lg',
      'xl': 'sm:max-w-xl',
      '2xl': 'sm:max-w-2xl',
      '3xl': 'sm:max-w-3xl',
      '4xl': 'sm:max-w-4xl',
      '5xl': 'sm:max-w-5xl',
      '6xl': 'sm:max-w-6xl',
      '7xl': 'sm:max-w-7xl',
      'full': 'sm:max-w-full mx-4',
    };

    return widthClasses[width as keyof typeof widthClasses] || widthClasses.md;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!schema) return false;
    
    const newErrors: Record<string, string> = {};
    let isValid = true;

    schema.fields.forEach((field) => {
      const fieldName = field.name as string;
      const value = formData[fieldName as keyof T];
      
      // Required validation
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${field.label} harus diisi`;
        isValid = false;
      }
      
      // Min validation for numbers
      if (field.type === 'number' && field.min !== undefined && value !== undefined && value !== null) {
        const numValue = Number(value);
        if (numValue < field.min) {
          newErrors[fieldName] = `${field.label} minimal ${field.min}`;
          isValid = false;
        }
      }
      
      // Max validation for numbers
      if (field.type === 'number' && field.max !== undefined && value !== undefined && value !== null) {
        const numValue = Number(value);
        if (numValue > field.max) {
          newErrors[fieldName] = `${field.label} maksimal ${field.max}`;
          isValid = false;
        }
      }
      
      // Min length validation for strings
      if (field.type === 'text' && field.minLength && value && String(value).length < field.minLength) {
        newErrors[fieldName] = `${field.label} minimal ${field.minLength} karakter`;
        isValid = false;
      }
      
      // Max length validation for strings
      if (field.type === 'text' && field.maxLength && value && String(value).length > field.maxLength) {
        newErrors[fieldName] = `${field.label} maksimal ${field.maxLength} karakter`;
        isValid = false;
      }
      
      // Pattern validation
      if (field.pattern && value) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(String(value))) {
          newErrors[fieldName] = field.patternMessage || 'Format tidak valid';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Harap perbaiki kesalahan di form');
      return;
    }

    try {
      await onSubmit(formData as T);
      onClose();
    } catch (error: any) {
      // Server validation errors
      if (error.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            serverErrors[key] = value[0];
          } else {
            serverErrors[key] = value as string;
          }
        });
        setErrors(serverErrors);
      }
    }
  };

  const handleDelete = async () => {
    if (!data || !onDelete) return;
    
    if (!window.confirm(deleteConfirmMessage)) {
      return;
    }

    try {
      await onDelete(data);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const renderField = (field: any) => {
    const fieldName = field.name as string;
    const value = formData[fieldName as keyof T];
    const error = errors[fieldName];

    const isVisible = typeof field.visible === 'function' 
      ? field.visible(formData as T)
      : field.visible !== false; // Default true jika tidak didefinisikan
    
    // Jika field tidak visible, return null
    if (!isVisible) {
      return null;
    }
    
    // Handle disabled jika berupa function
    const isDisabled = typeof field.disabled === 'function' 
      ? field.disabled(formData as T)
      : field.disabled || isLoading;
    
    // Handle description jika berupa function
    const fieldDescription = typeof field.description === 'function'
      ? field.description(formData as T)
      : field.description;

    switch (field.type) {
        case 'money':
            return (
                <div className="space-y-2">
                    <Label htmlFor={fieldName}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <MoneyInput
                        id={fieldName}
                        value={value !== undefined && value !== null ? Number(value) : 0}
                        onValueChange={(values) => handleChange(fieldName, values.floatValue || 0)}
                        disabled={isDisabled}
                        placeholder={field.placeholder || 'Rp 0'}
                        className={error ? 'border-red-500' : ''}
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {fieldDescription && (
                        <p className="text-sm text-muted-foreground">{fieldDescription}</p>
                    )}
                </div>
            );

      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="text"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              disabled={isDisabled}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">{fieldDescription}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="number"
              value={value !== undefined && value !== null ? value : ''}
              onChange={(e) => handleChange(fieldName, e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isDisabled}
              className={error ? 'border-red-500' : ''}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">{fieldDescription}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value !== undefined && value !== null ? String(value) : ''}
              onValueChange={(val) => handleChange(fieldName, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''} id={fieldName}>
                <SelectValue placeholder={field.placeholder || 'Pilih...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">{fieldDescription}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(fieldName, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={fieldName} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">{fieldDescription}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <DatePickerInput
              value={value as string || ''}
              onChange={(val) => handleChange(fieldName, val)}
              disabled={isDisabled}
              placeholder={field.placeholder || 'Pilih tanggal'}
              error={!!error}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {fieldDescription && (
              <p className="text-sm text-muted-foreground">{fieldDescription}</p>
            )}
          </div>
        );

        case 'radio':
          return (
            <div className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              <RadioGroup
                value={value !== undefined && value !== null ? String(value) : ''}
                onValueChange={(val) => handleChange(fieldName, val)}
                disabled={isDisabled}
                className="flex gap-6"
              >
                {field.options?.map((option: any) => (
                  <div key={String(option.value)} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={String(option.value)}
                      id={`${fieldName}-${option.value}`}
                    />
                    <Label htmlFor={`${fieldName}-${option.value}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {fieldDescription && (
                <p className="text-sm text-muted-foreground">{fieldDescription}</p>
              )}
            </div>
          );

      case 'custom':
        return field.render ? field.render(value, (val: any) => handleChange(fieldName, val)) : null;

      default:
        return null;
    }
  };

  if (!schema || !data) return null;

  return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent 
      className={`
        ${getWidthClass()} 
        max-h-[${maxHeight}] 
        overflow-y-auto 
        my-4 // Tambahkan margin vertikal
        mx-auto // Center horizontally
      `}
    >
      <DialogHeader className="sticky top-0 z-10 pt-0"> {/* Tambahkan sticky header */}
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="overflow-y-auto flex-1" style={{ maxHeight: `calc(${maxHeight} - 100px)` }}> {/* Container dengan scroll */}
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {schema.fields.map((field, index) => (
              <div key={`${String(field.name)}-${index}`}>
                {renderField(field)}
              </div>
            ))}
          </div>
        </form>
      </div>

      <DialogFooter className="sticky bottom-0 pt-4 border-t mt-4"> {/* Sticky footer */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {customActions}
          
          <div className="flex gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              onClick={handleSubmit} // Pindah onClick ke sini
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
}