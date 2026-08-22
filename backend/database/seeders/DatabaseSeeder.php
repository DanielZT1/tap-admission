<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminProfile = Profile::firstOrCreate(
            ['profile_code' => 'PRF-ADMIN'],
            [
                'name' => 'Administrador',
                'section_keys' => ['products', 'users', 'profiles', 'audit_logs'],
            ],
        );

        $adminSections = collect($adminProfile->section_keys ?? [])
            ->merge(['products', 'users', 'profiles', 'audit_logs'])
            ->unique()
            ->values()
            ->all();

        $adminProfile->forceFill(['section_keys' => $adminSections])->save();

        Profile::firstOrCreate(
            ['profile_code' => 'PRF-CATALOGOS'],
            [
                'name' => 'Catalogos',
                'section_keys' => ['products'],
            ],
        );

        User::firstOrCreate(
            ['email' => 'admin@tap.local'],
            [
                'user_code' => 'USR-ADMIN',
                'name' => 'Administrador TAP',
                'phone' => '+523141234567',
                'profile_photo_path' => 'profiles/admin.png',
                'profile_ids' => [(string) $adminProfile->getKey()],
                'password' => 'Password123!',
            ],
        );

        Product::firstOrCreate(
            ['product_code' => 'PRD-DEMO-001'],
            [
                'name' => 'Casco de seguridad',
                'brand' => 'TAP Safety',
                'price' => 245,
            ],
        );

        Product::firstOrCreate(
            ['product_code' => 'PRD-DEMO-002'],
            [
                'name' => 'Guantes industriales',
                'brand' => 'Port Gear',
                'price' => 180,
            ],
        );
    }
}
