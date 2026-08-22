<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            AuditLog::latest()
                ->limit(100)
                ->get()
                ->map(fn (AuditLog $auditLog) => $this->row($auditLog))
        );
    }

    private function row(AuditLog $auditLog): array
    {
        return [
            'id' => (string) $auditLog->getKey(),
            'entity' => $auditLog->entity,
            'entity_id' => $auditLog->entity_id,
            'action' => $auditLog->action,
            'previous' => $this->sanitize($auditLog->previous),
            'current' => $this->sanitize($auditLog->current),
            'actor_user_code' => $auditLog->actor_user_code,
            'created_at' => $auditLog->created_at?->format('d/m/Y H:i'),
        ];
    }

    private function sanitize(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        foreach (['password', 'remember_token'] as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = '[protegido]';
            }
        }

        return $data;
    }
}
