<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\PersonalAccessToken;
use App\Models\Product;
use App\Models\Profile;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdmissionApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach ([AuditLog::class, PersonalAccessToken::class, Product::class, Profile::class, User::class] as $model) {
            $model::query()->delete();
        }
    }

    public function test_login_exitoso_regresa_token_y_usuario(): void
    {
        $profile = $this->createProfile(['products']);

        User::create([
            'user_code' => 'USR-TEST',
            'name' => 'Usuario Test',
            'email' => 'admin@tap.local',
            'phone' => '+523141234567',
            'profile_photo_path' => 'profiles/admin.png',
            'profile_ids' => [(string) $profile->getKey()],
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@tap.local',
            'password' => 'Password123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'user_code', 'name', 'email', 'sections'],
            ])
            ->assertJsonPath('user.email', 'admin@tap.local')
            ->assertJsonPath('user.sections.0', 'products');
    }

    public function test_login_fallido_regresa_error_de_validacion(): void
    {
        $profile = $this->createProfile(['products']);

        User::create([
            'user_code' => 'USR-TEST',
            'name' => 'Usuario Test',
            'email' => 'admin@tap.local',
            'phone' => '+523141234567',
            'profile_photo_path' => 'profiles/admin.png',
            'profile_ids' => [(string) $profile->getKey()],
            'password' => 'Password123!',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@tap.local',
            'password' => 'PasswordIncorrecto',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email'])
            ->assertJsonPath('errors.email.0', 'Las credenciales no son validas.');
    }

    public function test_no_permite_crear_producto_con_precio_mayor_a_tres_digitos(): void
    {
        Sanctum::actingAs($this->createUserWithSections(['products']));

        $response = $this->postJson('/api/products', [
            'name' => 'Botas de seguridad',
            'brand' => 'TAP Safety',
            'price' => 1000,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['price']);

        $this->assertSame(0, Product::count());
    }

    public function test_usuario_sin_permiso_no_puede_entrar_a_perfiles(): void
    {
        Sanctum::actingAs($this->createUserWithSections(['products']));

        $response = $this->getJson('/api/profiles');

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'No tienes acceso a esta seccion.');
    }

    public function test_editar_producto_crea_bitacora_con_informacion_anterior_y_actual(): void
    {
        Sanctum::actingAs($this->createUserWithSections(['products']));

        $product = Product::create([
            'product_code' => 'PRD-TEST-001',
            'name' => 'Casco de seguridad',
            'brand' => 'TAP Safety',
            'price' => 245,
        ]);

        $response = $this->putJson("/api/products/{$product->getKey()}", [
            'name' => 'Casco industrial',
            'brand' => 'TAP Safety',
            'price' => 300,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('name', 'Casco industrial')
            ->assertJsonPath('price', 300);

        $auditLog = AuditLog::where('entity', 'product')
            ->where('entity_id', (string) $product->getKey())
            ->where('action', 'updated')
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertSame('Casco de seguridad', $auditLog->previous['name']);
        $this->assertSame(245, $auditLog->previous['price']);
        $this->assertSame('Casco industrial', $auditLog->current['name']);
        $this->assertSame(300, $auditLog->current['price']);
        $this->assertSame('USR-TEST', $auditLog->actor_user_code);
    }

    private function createUserWithSections(array $sections): User
    {
        $profile = $this->createProfile($sections);

        return User::create([
            'user_code' => 'USR-TEST',
            'name' => 'Usuario Test',
            'email' => 'user-'.implode('-', $sections).'@tap.local',
            'phone' => '+523141234567',
            'profile_photo_path' => 'profiles/test.png',
            'profile_ids' => [(string) $profile->getKey()],
            'password' => 'Password123!',
        ]);
    }

    private function createProfile(array $sections): Profile
    {
        return Profile::create([
            'profile_code' => 'PRF-'.strtoupper(implode('-', $sections)),
            'name' => 'Perfil '.implode(', ', $sections),
            'section_keys' => $sections,
        ]);
    }
}
