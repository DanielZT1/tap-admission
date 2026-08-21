<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'mongodb';

    protected $collection = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'user_code',
        'email',
        'phone',
        'profile_photo_path',
        'profile_ids',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'profile_ids' => 'array',
            'password' => 'hashed',
        ];
    }

    public function profiles()
    {
        return Profile::whereIn('_id', $this->profile_ids ?? [])->get();
    }

    public function allowedSections(): array
    {
        return $this->profiles()
            ->flatMap(fn (Profile $profile) => $profile->section_keys ?? [])
            ->unique()
            ->values()
            ->all();
    }
}
