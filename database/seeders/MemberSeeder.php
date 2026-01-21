<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Member;
use App\Services\CodeGeneratorService;
use Carbon\Carbon;

class MemberSeeder extends Seeder
{
    public function run(): void
    {
        $codeGenerator = app(CodeGeneratorService::class);

        $totalMembers = 50;

        $statuses = ['active', 'inactive'];

        for ($i = 0; $i < $totalMembers; $i++) {
            Member::create([
                'member_code' => $codeGenerator->generateMemberCode(),
                'member_name' => fake()->name(),
                'phone_number' => fake()->phoneNumber(),
                'address' => fake()->address(),

                'gender' => fake()->boolean(),

                'birth_date' => Carbon::now()
                    ->subYears(rand(18, 50))
                    ->subDays(rand(0, 365))
                    ->toDateString(),
                'status' => fake()->randomElement($statuses),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
