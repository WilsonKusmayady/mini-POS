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

    sales: {
        index: () => '/sales',
        // history: () => '/sales/history',
        create: () => '/sales/create',
        edit: (id: number | string) => `/sales/${id}/edit`,
        show: (id: number | string) => `/sales/${id}`,
        store: () => '/sales',
        nota: (id: string) => `/sales/${id}/nota`,
        export: () => '/sales/export', 
        api: {
            list: () => '/api/sales',
            export: () => '/api/sales/export', 
        },

    },

    members: {
        index: () => '/members',
        create: () => '/members/create',
        store: () => '/members',
        edit: (id: string) => `/members/${id}/edit`,
        show: (id: string) => `/members/${id}`,
        update: (id: string) => `/members/${id}`,
        export: () => '/members/export', 
        api: {
            list: () => '/api/members', 
            destroy: (id: string) => `/api/members/${id}`,
            statistics: () => '/api/members/statistics',
            export: () => '/api/members/export', 
        },
    },

    purchases: {
        index: () => '/purchases',
        create: () => '/purchases/create',
        store: () => '/purchases', // POST
        show: (id: number | string) => `/purchases/${id}`,
    },

    summary: () => '/summary',
} as const;

export type AppRoutes = typeof appRoutes;