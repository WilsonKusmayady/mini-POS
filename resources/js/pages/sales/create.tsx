  import AppLayout from '@/layouts/app-layout';
  import { appRoutes } from '@/lib/app-routes';
  import { type BreadcrumbItem } from '@/types';
  import { Head } from '@inertiajs/react';

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: appRoutes.dashboard(),
    },
    {
      title: 'Penjualan', 
      href: appRoutes.sales.index(),
    },
    {
      title: 'Transaksi Baru',
      href: appRoutes.sales.create(),
    }
  ];

  export default function CreateSale() {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Transaksi Baru" />

        <div className="p-6">
          <h1 className="text-2xl font-bold">Transaksi Baru</h1>
          <p className="text-muted-foreground">
            Form transaksi penjualan
          </p>
        </div>
      </AppLayout>
    );
  }
