<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email:rfc'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son validas.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('tap-admission')->plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sesion cerrada.']);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user?->currentAccessToken();

        $plainTextToken = $user->createToken('tap-admission')->plainTextToken;
        $currentToken?->delete();

        return response()->json([
            'token' => $plainTextToken,
            'user' => $this->userPayload($user),
        ]);
    }

    public function recoverPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['El usuario no existe en la base de datos.'],
            ]);
        }

        $temporaryPassword = Str::password(12);
        $user->forceFill(['password' => $temporaryPassword])->save();

        Mail::raw(
            "Usuario: {$user->email}\nContrasena temporal: {$temporaryPassword}",
            fn ($message) => $message
                ->to($user->email)
                ->subject('Recuperacion de credenciales TAP')
        );

        return response()->json([
            'message' => 'Se enviaron credenciales temporales al correo registrado.',
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => (string) $user->getKey(),
            'user_code' => $user->user_code,
            'name' => $user->name,
            'email' => $user->email,
            'sections' => $user->allowedSections(),
        ];
    }
}
