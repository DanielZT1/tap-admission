<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSectionAccess
{
    public function handle(Request $request, Closure $next, string $section): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($section, $user->allowedSections(), true)) {
            return response()->json([
                'message' => 'No tienes acceso a esta seccion.',
            ], 403);
        }

        return $next($request);
    }
}
