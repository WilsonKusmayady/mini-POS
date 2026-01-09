<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Exception;

class UserService
{
    protected $userRepo;

    public function __construct(UserRepository $userRepo)
    {
        $this->userRepo = $userRepo;
    }

    public function getAllUsers()
    {
        return $this->userRepo->getAll();
    }

    public function createUser(array $data)
    {
        // 1. Enkripsi Password sebelum simpan
        $data['password'] = Hash::make($data['password']);

        // 2. Simpan via Repo
        return $this->userRepo->store($data);
    }

    public function updateUser($id, array $data)
    {
        // Cek Logic Password:
        // Jika form password diisi, maka update & hash password baru.
        // Jika kosong (null), buang dari array agar password lama tidak tertimpa kosong.
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']); // Hapus key password dari array
        }

        return $this->userRepo->update($id, $data);
    }

    public function deleteUser($id)
    {
        // Logic Pencegahan: Jangan biarkan user menghapus dirinya sendiri
        if (auth()->id() == $id) {
            throw new Exception("Anda tidak bisa menghapus akun sendiri saat sedang login.");
        }

        return $this->userRepo->delete($id);
    }
}