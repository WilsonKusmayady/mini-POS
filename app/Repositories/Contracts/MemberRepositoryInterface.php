<?php
namespace App\Repositories\Contracts;

interface MemberRepositoryInterface {
    public function getAll();
    public function store($data);
    public function searchByName($keyword);
}