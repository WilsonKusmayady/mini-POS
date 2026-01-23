import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react'; // router kita butuhkan untuk manual request
import { PageProps, User } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, Plus, Shield, User as UserIcon, MoreHorizontal } from 'lucide-react';
import { toast } from "sonner";
import { EditModal } from '@/components/ui/edit-modal';
import { FormSchema } from '@/types/form-schema'; // Import tipe schema

interface UsersIndexProps extends PageProps {
    users: User[];
}

export default function UsersIndex({ auth, users }: UsersIndexProps) {
    // State Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    
    // State Selected Data
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    const [editModalData, setEditModalData] = useState<Record<string, any> | null>(null);

    // Form Inertia (Hanya untuk Create, Edit pakai Schema)
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        user_name: '',
        user_role: '0', 
        password: '',
        password_confirmation: '',
    });

    // --- DEFINISI SCHEMA FORM (Kunci agar EditModal Asli bekerja) ---
    const userEditSchema: FormSchema<any> = {
        fields: [
            {
                name: 'user_name',
                label: 'Username',
                type: 'text',
                required: true,
            },
            {
                name: 'user_role',
                label: 'Role',
                type: 'select',
                required: true,
                options: [
                    { label: 'Staff (Kasir)', value: '0' },
                    { label: 'Admin', value: '1' },
                ],
            },

            {
                name: 'password',
                label: 'Password Baru (Opsional)',
                type: 'custom', 
                render: (value, onChange) => (
                    <div className="space-y-2">
                        <Label>Password Baru (Opsional)</Label>
                        <Input 
                            type="password" 
                            value={value || ''} 
                            onChange={e => onChange(e.target.value)} 
                            placeholder="Isi untuk mengganti password"
                        />
                    </div>
                )
            },
            {
                name: 'password_confirmation',
                label: 'Konfirmasi Password',
                type: 'custom',
                render: (value, onChange) => (
                    <div className="space-y-2">
                        <Label>Konfirmasi Password</Label>
                        <Input 
                            type="password" 
                            value={value || ''} 
                            onChange={e => onChange(e.target.value)} 
                            placeholder="Ulangi password baru"
                        />
                    </div>
                )
            }
        ]
    };

    // --- HANDLERS ---

    const openCreateDialog = () => {
        reset();
        clearErrors();
        setIsCreateOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        
        // Persiapkan data agar sesuai schema
        setEditModalData({
            ...user,
            user_role: user.user_role ? '1' : '0', 
            password: '', 
            password_confirmation: ''
        });
        
        setIsEditOpen(true);
    };

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    // Handle Create 
    const handleCreateSubmit: React.FormEventHandler = (e) => {
        e.preventDefault();
        post(route('users.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                toast.success("User berhasil dibuat");
            }
        });
    };

    // Menerima data JSON, bukan Event
    const handleEditSubmit = async (formData: any) => {
        if (!editingUser) return;

        return new Promise<void>((resolve, reject) => {
            router.put(route('users.update', editingUser.user_id), formData, {
                onSuccess: () => {
                    setEditingUser(null);
                    setEditModalData(null);
                    toast.success("User berhasil diperbarui");
                    resolve(); 
                },
                onError: (errors) => {
                    reject({
                        response: {
                            data: {
                                errors: errors 
                            }
                        }
                    });
                }
            });
        });
    };

    // Handle Delete
    const handleDelete = () => {
        if (deletingId) {
            router.delete(route('users.destroy', deletingId), {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setDeletingId(null);
                    toast.success("User berhasil dihapus");
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Manajemen User', href: '/users' }]}>
            <Head title="Manajemen User" />

            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Daftar Pengguna</h2>
                        <p className="text-muted-foreground">Kelola admin dan staff.</p>
                    </div>
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah User
                    </Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.user_id}> 
                                    <TableCell className="font-medium">{user.user_name}</TableCell>
                                    <TableCell>
                                        {user.user_role ? (
                                            <Badge className="bg-blue-600"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1"/> Staff</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                
                                                {auth.user.user_id !== user.user_id && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => openDeleteDialog(user.user_id)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- MODAL CREATE --- */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input 
                                value={data.user_name} 
                                onChange={e => setData('user_name', e.target.value)} 
                                required
                            />
                            {errors.user_name && <p className="text-red-500 text-sm">{errors.user_name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={data.user_role} onValueChange={val => setData('user_role', val)}>
                                <SelectTrigger><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Staff (Kasir)</SelectItem>
                                    <SelectItem value="1">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.user_role && <p className="text-red-500 text-sm">{errors.user_role}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input 
                                type="password" 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                                required
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Konfirmasi Password</Label>
                            <Input 
                                type="password" 
                                value={data.password_confirmation} 
                                onChange={e => setData('password_confirmation', e.target.value)} 
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- MODAL EDIT (Disini perubahannya) --- */}
            {/* Kita tidak lagi menggunakan children, tapi menggunakan props 'schema' dan 'data' */}
            <EditModal
                isOpen={isEditOpen}           // Gunakan props asli: isOpen
                onClose={() => setIsEditOpen(false)} // Gunakan props asli: onClose
                title="Edit User"
                data={editModalData}          // Pass data 
                schema={userEditSchema}       // Pass schema 
                onSubmit={handleEditSubmit}   // Handler yang mengembalikan Promise
                isLoading={false}             // Inertia loading ditangani di dalam Promise wrapper, tapi bisa juga pass state processing jika mau
            />

            {/* --- MODAL DELETE --- */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription>Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}