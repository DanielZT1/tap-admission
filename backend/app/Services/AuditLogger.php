<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function record(string $entity, string $action, Model $model, ?array $previous = null): void
    {
        AuditLog::create([
            'entity' => $entity,
            'entity_id' => (string) $model->getKey(),
            'action' => $action,
            'previous' => $previous,
            'current' => $model->fresh()?->toArray(),
            'actor_user_code' => Auth::user()?->user_code,
        ]);
    }
}
