import { useViewModal } from '@/components/ui/view-modal';
import { DataItem, DataSection, StatusBadge, CurrencyDisplay, DateDisplay } from '@/components/ui/data-display';
import { cn } from '@/lib/utils';
import * as React from 'react';

// Helper function harus didefinisikan di luar
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

// Membuat component terpisah untuk setiap view
const MemberViewContent = ({ member }: { member: any }) => (
    <div className="space-y-6">
        <DataSection title="Informasi Pribadi">
            <DataItem label="Kode Member" value={
                <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {member.member_code}
                </code>
            } />
            <DataItem label="Nama Lengkap" value={member.member_name} />
            <DataItem label="Jenis Kelamin" value={
                <StatusBadge 
                    status={member.gender} 
                    labels={{ 'true': 'Laki-laki', 'false': 'Perempuan' }}
                />
            } />
            <DataItem label="Tanggal Lahir" value={
                <DateDisplay date={member.birth_date} format="date" />
            } />
            <DataItem label="Usia" value={`${calculateAge(member.birth_date)} tahun`} />
        </DataSection>

        <DataSection title="Kontak">
            <DataItem label="No. Telepon" value={member.phone_number} />
            <DataItem label="Alamat" value={
                <p className="whitespace-pre-line">{member.address}</p>
            } />
        </DataSection>

        <DataSection title="Informasi Sistem">
            <DataItem label="Dibuat" value={
                <DateDisplay date={member.created_at} format="datetime" />
            } />
            <DataItem label="Terakhir Diupdate" value={
                <DateDisplay date={member.updated_at} format="datetime" />
            } />
        </DataSection>
    </div>
);

const SaleViewContent = ({ sale }: { sale: any }) => (
    <div className="space-y-6">
        <DataSection title="Informasi Transaksi">
            <DataItem label="Invoice" value={
                <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {sale.sales_invoice_code}
                </code>
            } />
            <DataItem label="Tanggal" value={
                <DateDisplay date={sale.sales_date} format="datetime" />
            } />
            <DataItem label="Pelanggan" value={
                sale.customer_name || (sale.member_code ? `Member: ${sale.member_code}` : 'Non-Member')
            } />
            <DataItem label="Kasir" value={`User ID: ${sale.user_id}`} />
        </DataSection>

        <DataSection title="Rincian Pembayaran">
            <DataItem label="Subtotal" value={
                <CurrencyDisplay amount={sale.sales_subtotal} />
            } />
            <DataItem label="Diskon" value={
                <div className="space-y-1">
                    <div className="text-red-600">
                        - <CurrencyDisplay amount={sale.sales_hasil_discount_value} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        ({sale.sales_discount_value}%)
                    </div>
                </div>
            } />
            <DataItem label="Grand Total" value={
                <CurrencyDisplay amount={sale.sales_grand_total} className="text-lg font-bold" />
            } />
            <DataItem label="Metode Pembayaran" value={
                <StatusBadge 
                    status={sale.sales_payment_method}
                    labels={{
                        'cash': 'Cash',
                        'debit': 'Debit Card',
                        'qris': 'QRIS'
                    }}
                    type="info"
                />
            } />
            <DataItem label="Status" value={
                <StatusBadge status={sale.sales_status} />
            } />
        </DataSection>

        {sale.items && sale.items.length > 0 && (
            <DataSection title="Item yang Dibeli">
                <div className="space-y-2">
                    {sale.items.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium">{item.item_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Kode: {item.item_code}
                                    </p>
                                </div>
                                <CurrencyDisplay amount={item.total_item_price} />
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                <div>Qty: {item.sales_quantity}</div>
                                <div>Harga: <CurrencyDisplay amount={item.sell_price} /></div>
                                <div>Diskon Item: {item.sales_discount_item}%</div>
                                <div>Diskon: -<CurrencyDisplay amount={item.sales_hasil_diskon_item} /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </DataSection>
        )}
    </div>
);

const UserViewContent = ({ user }: { user: any }) => (
    <div className="space-y-6">
        <DataSection title="Informasi Akun">
            <DataItem label="ID User" value={
                <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {user.user_id}
                </code>
            } />
            <DataItem label="Nama" value={user.name} />
            <DataItem label="Username" value={user.user_name} />
            <DataItem label="Email" value={user.email || '-'} />
            <DataItem label="Role" value={
                <StatusBadge 
                    status={user.user_code}
                    labels={{ '1': 'Admin', '0': 'Kasir' }}
                    type={user.user_code === 1 ? 'success' : 'info'}
                />
            } />
        </DataSection>

        <DataSection title="Status Akun">
            <DataItem label="Email Terverifikasi" value={
                <StatusBadge status={!!user.email_verified_at} />
            } />
            <DataItem label="2FA" value={
                <StatusBadge status={user.two_factor_enabled || false} />
            } />
        </DataSection>

        <DataSection title="Informasi Sistem">
            <DataItem label="Dibuat" value={
                <DateDisplay date={user.created_at} format="datetime" />
            } />
            <DataItem label="Terakhir Diupdate" value={
                <DateDisplay date={user.updated_at} format="datetime" />
            } />
        </DataSection>
    </div>
);

const ItemViewContent = ({ item }: { item: any }) => (
    <div className="space-y-6">
        <DataSection title="Informasi Produk">
            <DataItem label="Kode Item" value={
                <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {item.item_code}
                </code>
            } />
            <DataItem label="Nama Item" value={item.item_name} />
            <DataItem label="Deskripsi" value={
                <p className="whitespace-pre-line">{item.item_description || '-'}</p>
            } />
            <DataItem label="Harga" value={
                <CurrencyDisplay amount={item.item_price} className="text-lg font-bold" />
            } />
        </DataSection>

        <DataSection title="Stok">
            <DataItem label="Stok Tersedia" value={
                <span className={cn(
                    "font-bold",
                    item.item_stock <= item.item_min_stock 
                        ? "text-red-600" 
                        : "text-green-600"
                )}>
                    {item.item_stock} unit
                </span>
            } />
            <DataItem label="Stok Minimum" value={
                <span className="text-orange-600">{item.item_min_stock} unit</span>
            } />
            <DataItem label="Status Stok" value={
                <StatusBadge 
                    status={item.item_stock <= item.item_min_stock ? 'warning' : 'success'}
                    labels={{
                        'warning': 'Perlu Restock',
                        'success': 'Aman'
                    }}
                />
            } />
        </DataSection>
    </div>
);

export function useViewData() {
    const { openModal, closeModal, Modal } = useViewModal();

    const viewMember = (member: any) => {
        openModal(
            `Detail Member: ${member.member_name}`,
            <MemberViewContent member={member} />,
            `Detail informasi member ${member.member_name}`
        );
    };

    const viewSale = (sale: any) => {
        openModal(
            `Detail Penjualan: ${sale.sales_invoice_code}`,
            <SaleViewContent sale={sale} />,
            `Detail transaksi penjualan ${sale.sales_invoice_code}`
        );
    };

    const viewUser = (user: any) => {
        openModal(
            `Detail User: ${user.name}`,
            <UserViewContent user={user} />,
            `Detail informasi user ${user.name}`
        );
    };

    const viewItem = (item: any) => {
        openModal(
            `Detail Item: ${item.item_name}`,
            <ItemViewContent item={item} />,
            `Detail informasi item ${item.item_name}`
        );
    };

    const customView = (title: string, content: React.ReactNode, description?: string) => {
        openModal(title, content, description);
    };

    return {
        viewMember,
        viewSale,
        viewUser,
        viewItem,
        customView,
        closeModal,
        Modal,
    };
}