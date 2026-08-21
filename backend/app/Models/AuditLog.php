<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class AuditLog extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'audit_logs';

    protected $fillable = [
        'entity',
        'entity_id',
        'action',
        'previous',
        'current',
        'actor_user_code',
    ];

    protected function casts(): array
    {
        return [
            'previous' => 'array',
            'current' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
