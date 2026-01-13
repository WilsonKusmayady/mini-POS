import { toast } from "sonner";

export function useToast() {
  return {
    toast,
  };
}

export const toastFn = {
  success: (message: string, options?: any) => toast.success(message, options),
  error: (message: string, options?: any) => toast.error(message, options),
  warning: (message: string, options?: any) => toast.warning(message, options),
  info: (message: string, options?: any) => toast.info(message, options),
  loading: (message: string, options?: any) => toast.loading(message, options),
  dismiss: (id?: string) => toast.dismiss(id),
};
