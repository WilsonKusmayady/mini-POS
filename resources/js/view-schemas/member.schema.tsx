import { ViewSchema } from '@/hooks/use-view-schema';

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}


export const memberViewSchema: ViewSchema = {
  title: (data) => `Detail Member: ${data.member_name}`,
  description: (data) => `Informasi lengkap member ${data.member_name}`,

  sections: [
    {
      title: 'Informasi Pribadi',
      fields: [
        {
          label: 'Kode Member',
          key: 'member_code',
          type: 'code',
        },
        {
          label: 'Nama Lengkap',
          key: 'member_name',
        },
        {
          label: 'No Telpon',
          key: 'phone_number',
        },
        {
          label: 'Alamat',
          key: 'address',
        },
        {
          label: 'Jenis Kelamin',
          key: 'gender',
          type: 'boolean-label',
          options: {
            trueLabel: 'Laki-laki',
            falseLabel: 'Perempuan',
          },
        },
        {
          label: 'Tanggal Lahir',
          key: 'birth_date',
          type: 'date',
        },
        {
            label: 'Usia',
            key: 'age', // key ini bebas, TIDAK harus ada di data
            value: (data) => `${calculateAge(data.birth_date)} tahun`,
        }
      ],
    },
  ],
};
