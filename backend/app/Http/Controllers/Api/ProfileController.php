<?php

namespace App\Http\Controllers\Api;

use App\Exports\ArrayRowsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Models\Profile;
use App\Services\AuditLogger;
use App\Services\CodeGenerator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly CodeGenerator $codeGenerator,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json(Profile::latest()->get()->map(fn (Profile $profile) => $this->row($profile)));
    }

    public function store(ProfileRequest $request): JsonResponse
    {
        $profile = Profile::create([
            ...$request->validated(),
            'profile_code' => $this->codeGenerator->make('PRF'),
        ]);

        $this->auditLogger->record('profile', 'created', $profile);

        return response()->json($this->row($profile), 201);
    }

    public function show(Profile $profile): JsonResponse
    {
        return response()->json($this->detail($profile));
    }

    public function update(ProfileRequest $request, Profile $profile): JsonResponse
    {
        $previous = $profile->toArray();
        $profile->update($request->validated());
        $this->auditLogger->record('profile', 'updated', $profile, $previous);

        return response()->json($this->detail($profile));
    }

    public function destroy(Profile $profile): JsonResponse
    {
        $previous = $profile->toArray();
        $this->auditLogger->record('profile', 'deleted', $profile, $previous);
        $profile->delete();

        return response()->json(['message' => 'Perfil eliminado.']);
    }

    public function excel(): BinaryFileResponse
    {
        return Excel::download(
            new ArrayRowsExport(['Codigo', 'Nombre', 'Fecha de creacion'], $this->exportRows()),
            'perfiles.xlsx'
        );
    }

    public function pdf()
    {
        return Pdf::loadView('exports.profiles', ['rows' => $this->exportRows()])
            ->download('perfiles.pdf');
    }

    private function exportRows(): array
    {
        return Profile::latest()->get()
            ->map(fn (Profile $profile) => [
                $profile->profile_code,
                $profile->name,
                $profile->created_at?->format('d/m/Y H:i'),
            ])
            ->all();
    }

    private function row(Profile $profile): array
    {
        return [
            'id' => (string) $profile->getKey(),
            'profile_code' => $profile->profile_code,
            'name' => $profile->name,
            'created_at' => $profile->created_at?->format('d/m/Y H:i'),
        ];
    }

    private function detail(Profile $profile): array
    {
        return [
            ...$this->row($profile),
            'section_keys' => $profile->section_keys ?? [],
        ];
    }
}
