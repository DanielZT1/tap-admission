<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Profile extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'profiles';

    protected $fillable = [
        'profile_code',
        'name',
        'section_keys',
    ];

    protected function casts(): array
    {
        return [
            'section_keys' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}
