import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ViewModalProps {
    // Content props
    title: string;
    description?: string;
    children: React.ReactNode;
    
    // Trigger props
    triggerText?: string;
    triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
    triggerIcon?: React.ReactNode;
    triggerClassName?: string;
    
    // Modal props
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    // showCloseButton?: boolean;
}

export function ViewModal({
    title,
    description,
    children,
    triggerText = 'View',
    triggerVariant = 'outline',
    triggerSize = 'sm',
    triggerIcon = <Eye className="h-4 w-4" />,
    triggerClassName,
    open,
    onOpenChange,
    size = 'md',
}: ViewModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (onOpenChange) {
            onOpenChange(open);
        }
    };

    const currentOpen = open !== undefined ? open : isOpen;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]',
    };

    return (
        <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
            {triggerText && (
                <DialogTrigger asChild>
                    <Button
                        variant={triggerVariant}
                        size={triggerSize}
                        className={cn("flex items-center gap-2", triggerClassName)}
                    >
                        {triggerIcon}
                        {triggerText}
                    </Button>
                </DialogTrigger>
            )}
            
            <DialogContent className={cn(
                sizeClasses[size],
                "max-h-[90vh] overflow-y-auto"
            )}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="mt-4">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                
                <div className="mt-4">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Hook untuk menggunakan modal secara programmatic
export function useViewModal() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [modalContent, setModalContent] = React.useState<{
        title: string;
        description?: string;
        content: React.ReactNode;
    }>({
        title: '',
        content: null,
    });

    const openModal = (title: string, content: React.ReactNode, description?: string) => {
        setModalContent({ title, content, description });
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const Modal = () => (
        <ViewModal
            title={modalContent.title}
            description={modalContent.description}
            open={isOpen}
            onOpenChange={setIsOpen}
            triggerText=""
        >
            {modalContent.content}
        </ViewModal>
    );

    return {
        openModal,
        closeModal,
        Modal,
        isOpen,
    };
}