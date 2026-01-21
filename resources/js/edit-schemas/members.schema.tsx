// schemas/member.schema.ts
import { FormSchema } from '@/types/form-schema';

export interface MemberFormData {
  member_code: string;
  member_name: string;
  phone_number: string;
  address: string;
  gender: '1' | '0';
  birth_date: string;
}

export const memberEditSchema: FormSchema<MemberFormData> = {
  title: (data) => `Edit Member: ${data.member_name}`,
  description: (data) => `Kode: ${data.member_code}`,
  fields: [
    {
      name: 'member_code',
      type: 'text',
      label: 'Kode Member',
      required: true,
      disabled: true,
    },
    {
      name: 'member_name',
      type: 'text',
      label: 'Nama Lengkap',
      required: true,
      placeholder: 'Masukkan nama member',
      minLength: 3,
      maxLength: 100,
    },
    {
      name: 'phone_number',
      type: 'text',
      label: 'Nomor Telepon',
      required: true,
      placeholder: '0812-3456-7890',
      pattern: '^[0-9+\\-\\s()]*$',
      patternMessage: 'Format nomor telepon tidak valid',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Alamat',
      required: true,
      placeholder: 'Masukkan alamat lengkap',
    },
    {
      name: 'gender',
      type: 'radio',
      label: 'Jenis Kelamin',
      required: true,
      options: [
        { value: '1', label: 'Pria' },
        { value: '0', label: 'Wanita' },
      ],
    },
    {
      name: 'birth_date',
      type: 'date',
      label: 'Tanggal Lahir',
      required: true,
      placeholder: 'Pilih tanggal lahir',
    },
  ],
};