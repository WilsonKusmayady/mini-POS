<?php
namespace App\Repositories;
use App\Models\Member;

class MemberRepository {
    public function getAll() {
        return Member::all();
    }

    public function store($data) {
        return Member::create($data);
    }

    public function searchByName($keyword) {
        return Member::where(['member_name', 'like', '%' . $keyword . '%'])->get();
    }
}