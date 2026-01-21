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
}: EditModalProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (data && schema) {
      const initialData: Partial<T> = {};
      schema.fields.forEach((field) => {
        const fieldName = field.name as string;
        initialData[fieldName as keyof T] = data[fieldName] ?? field.defaultValue;
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [data, schema, isOpen]);

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

    switch (field.type) {
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
              disabled={isLoading || field.disabled}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
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
              disabled={isLoading || field.disabled}
              className={error ? 'border-red-500' : ''}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'email':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="email"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              disabled={isLoading || field.disabled}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'password':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={fieldName}
              type="password"
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              disabled={isLoading || field.disabled}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldName}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={fieldName}
              value={value !== undefined && value !== null ? String(value) : ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              disabled={isLoading || field.disabled}
              className={error ? 'border-red-500' : ''}
              placeholder={field.placeholder}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
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
              disabled={isLoading || field.disabled}
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
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldName}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(fieldName, checked)}
              disabled={isLoading || field.disabled}
            />
            <Label htmlFor={fieldName} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {error && <p className="text-sm text-red-500">{error}</p>}
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
              disabled={isLoading || field.disabled}
              className="flex flex-col space-y-1"
            >
              {field.options?.map((option: any) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={String(option.value)} 
                    id={`${fieldName}-${option.value}`} 
                  />
                  <Label htmlFor={`${fieldName}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-sm text-red-500">{error}</p>}
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
              disabled={isLoading || field.disabled}
              placeholder={field.placeholder || 'Pilih tanggal'}
              error={!!error}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            {schema.fields.map((field, index) => (
              <div key={`${String(field.name)}-${index}`}>
                {renderField(field)}
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {/* {showDelete && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading || deleteLoading}
                className="sm:mr-auto"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus'
                )}
              </Button>
            )} */}
            
            {customActions}
            
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}