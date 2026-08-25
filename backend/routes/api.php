<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'app' => config('app.name'),
]));

Route::post('/login', [AuthController::class, 'login']);
Route::post('/recover-password', [AuthController::class, 'recoverPassword']);
Route::get('/profile-photos/{filename}', [UserController::class, 'profilePhoto'])
    ->where('filename', '[A-Za-z0-9._-]+');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

    Route::get('/audit-logs', [AuditLogController::class, 'index'])
        ->middleware('section:audit_logs');

    Route::prefix('products')->middleware('section:products')->group(function () {
        Route::get('/export/excel', [ProductController::class, 'excel']);
        Route::get('/export/pdf', [ProductController::class, 'pdf']);
    });
    Route::apiResource('products', ProductController::class)->middleware('section:products');

    Route::prefix('users')->middleware('section:users')->group(function () {
        Route::get('/export/excel', [UserController::class, 'excel']);
        Route::get('/export/pdf', [UserController::class, 'pdf']);
    });
    Route::apiResource('users', UserController::class)->middleware('section:users');

    Route::prefix('profiles')->middleware('section:profiles')->group(function () {
        Route::get('/export/excel', [ProfileController::class, 'excel']);
        Route::get('/export/pdf', [ProfileController::class, 'pdf']);
    });
    Route::apiResource('profiles', ProfileController::class)->middleware('section:profiles');
});
