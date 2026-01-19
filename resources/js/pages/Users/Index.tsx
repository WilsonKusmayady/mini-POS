import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps, User } from '@/types'; // Import dari types yang sudah diperbaiki
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
import { Pencil, Trash2, Plus, Shield, User as UserIcon } from 'lucide-react';
import { toast } from "sonner"; // Gunakan direct import dari sonner

interface UsersIndexProps extends PageProps {
    users: User[];
}

export default function UsersIndex({ auth, users }: UsersIndexProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // Form Inertia
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        user_name: '',
        user_role: '0', 
        password: '',
        password_confirmation: '',
    });

    const openCreateDialog = () => {
        setEditingUser(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (user: User) => {
        setEditingUser(user);
        setData({
            user_name: user.user_name, // Sekarang Typescript mengenali ini
            user_role: user.user_role ? '1' : '0',
            password: '', 
            password_confirmation: '',
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const openDeleteDialog = (id: number) => {
        setDeletingId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingUser) {
            // Update
            put(route('users.update', editingUser.user_id), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    // Syntax Sonner yang benar
                    toast.success("User berhasil diperbarui"); 
                }
            });
        } else {
            // Create
            post(route('users.store'), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    toast.success("User berhasil dibuat");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingId) {
            router.delete(route('users.destroy', deletingId), {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
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
                        <h2 className="text-2xl font-bold">Daftar Pengguna</h2>
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
                                /* Gunakan user_id sebagai key */
                                <TableRow key={user.user_id}> 
                                    <TableCell className="font-medium">{user.user_name}</TableCell>
                                    <TableCell>
                                        {user.user_role ? (
                                            <Badge className="bg-blue-600"><Shield className="w-3 h-3 mr-1"/> Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1"/> Staff</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        {/* Gunakan user_id untuk cek current user */}
                                        {auth.user.user_id !== user.user_id && (
                                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user.user_id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Form */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input 
                                value={data.user_name} 
                                onChange={e => setData('user_name', e.target.value)} 
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
                            <Label>Password {editingUser && '(Opsional)'}</Label>
                            <Input 
                                type="password" 
                                value={data.password} 
                                onChange={e => setData('password', e.target.value)} 
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>Konfirmasi Password</Label>
                            <Input 
                                type="password" 
                                value={data.password_confirmation} 
                                onChange={e => setData('password_confirmation', e.target.value)} 
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Delete */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription>Aksi ini tidak dapat dibatalkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}