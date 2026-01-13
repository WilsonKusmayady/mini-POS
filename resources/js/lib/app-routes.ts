// Custom route helpers yang sesuai dengan web.php Anda
export const appRoutes = {
    // Dashboard
    dashboard: () => '/',
    
    // Auth routes - sesuai dengan web.php
    login: () => '/login-karyawan',
    logout: () => '/logout',
    register: () => '/register', // Hapus jika tidak ada
    
    // Password reset - sesuaikan jika ada
    password: {
        request: () => '/forgot-password', // Sesuaikan jika ada
        reset: (token: string) => `/reset-password/${token}`,
    },
    
    // Profile - sesuaikan jika ada
    profile: {
        edit: () => '/profile',
    },
} as const;

export type AppRoutes = typeof appRoutes;