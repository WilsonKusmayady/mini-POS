import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { Toaster } from '@/components/ui/toaster'; 
import { useToast } from '@/hooks/use-toast'; 

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    useToast();
    
    return (
        <>
            <AuthLayoutTemplate title={title} description={description} {...props}>
                {children}
            </AuthLayoutTemplate>
            <Toaster />
        </>
    );
}
