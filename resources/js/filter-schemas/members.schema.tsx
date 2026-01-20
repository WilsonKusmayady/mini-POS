// filter-schemas/members.schema.ts
import { FilterSchema } from '@/components/ui/filter-modal';

export const membersFilterSchema: FilterSchema = {
    title: 'Filter Data Member',
    description: 'Pilih kriteria filter untuk menyaring data member',
    fields: [
        {
            key: 'gender',
            label: 'Jenis Kelamin',
            type: 'radio',
            defaultValue: 'all',
            options: [
                { value: 'all', label: 'Semua Gender' },
                { value: '1', label: 'Pria' },
                { value: '0', label: 'Wanita' },
            ]
        },
        {
            key: 'birth_date',
            label: 'Tanggal Lahir',
            type: 'date-range',
            placeholder: 'Pilih rentang tanggal lahir'
        }
    ]
};

// Helper untuk mengkonversi filter ke query params
export const convertMembersFiltersToParams = (filters: any) => {
    const params: any = {};
    
    if (filters.gender && filters.gender !== 'all') {
        params.gender = filters.gender;
    }
    
    if (filters.birth_date_start) {
        params.birth_date_start = filters.birth_date_start;
    }
    
    if (filters.birth_date_end) {
        params.birth_date_end = filters.birth_date_end;
    }
    
    return params;
};