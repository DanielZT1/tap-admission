<?php

namespace App\Http\Controllers\Api;

use App\Exports\ArrayRowsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Profile;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\CodeGenerator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly CodeGenerator $codeGenerator,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json(User::latest()->get()->map(fn (User $user) => $this->row($user)));
    }

    public function store(UserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $plainPassword = $data['password'] ?? Str::password(12);
        unset($data['profile_photo'], $data['password']);

        $data['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        $data['password'] = $plainPassword;
        $data['user_code'] = $this->codeGenerator->make('USR');

        $user = User::create($data);
        $this->auditLogger->record('user', 'created', $user);

        Mail::raw(
            "Usuario: {$user->email}\nContrasena temporal: {$plainPassword}",
            fn ($message) => $message
                ->to($user->email)
                ->subject('Credenciales de acceso TAP')
        );

        return response()->json($this->detail($user), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($this->detail($user));
    }

    public function profilePhoto(string $filename): StreamedResponse
    {
        abort_unless(Storage::disk('public')->exists("profiles/{$filename}"), 404);

        return Storage::disk('public')->response("profiles/{$filename}");
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $previous = $user->toArray();
        $data = $request->validated();

        if ($request->hasFile('profile_photo')) {
            $data['profile_photo_path'] = $request->file('profile_photo')->store('profiles', 'public');
        }

        unset($data['profile_photo']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);
        $this->auditLogger->record('user', 'updated', $user, $previous);

        return response()->json($this->detail($user));
    }

    public function destroy(User $user): JsonResponse
    {
        $previous = $user->toArray();
        $this->auditLogger->record('user', 'deleted', $user, $previous);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado.']);
    }

    public function excel(): BinaryFileResponse
    {
        return Excel::download(
            new ArrayRowsExport(['Codigo', 'Usuario', 'Nombre', 'Fecha de creacion'], $this->exportRows()),
            'usuarios.xlsx'
        );
    }

    public function pdf()
    {
        return Pdf::loadView('exports.users', ['rows' => $this->exportRows()])
            ->download('usuarios.pdf');
    }

    private function exportRows(): array
    {
        return User::latest()->get()
            ->map(fn (User $user) => [
                $user->user_code,
                $user->email,
                $user->name,
                $user->created_at?->format('d/m/Y H:i'),
            ])
            ->all();
    }

    private function row(User $user): array
    {
        return [
            'id' => (string) $user->getKey(),
            'user_code' => $user->user_code,
            'email' => $user->email,
            'name' => $user->name,
            'profile_photo_url' => $this->profilePhotoUrl($user),
            'created_at' => $user->created_at?->format('d/m/Y H:i'),
        ];
    }

    private function detail(User $user): array
    {
        return [
            ...$this->row($user),
            'phone' => $user->phone,
            'profile_photo_path' => $user->profile_photo_path,
            'profiles' => Profile::whereIn('_id', $user->profile_ids ?? [])->get()
                ->map(fn (Profile $profile) => [
                    'id' => (string) $profile->getKey(),
                    'profile_code' => $profile->profile_code,
                    'name' => $profile->name,
                ])
                ->values(),
        ];
    }

    private function profilePhotoUrl(User $user): ?string
    {
        if (! $user->profile_photo_path) {
            return null;
        }

        return request()->getSchemeAndHttpHost().'/api/profile-photos/'.rawurlencode(basename($user->profile_photo_path));
    }
}
