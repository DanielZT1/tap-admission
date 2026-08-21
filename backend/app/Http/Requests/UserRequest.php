<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->getKey();
        $photoRule = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:160', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'regex:/^\+[1-9]\d{7,14}$/'],
            'profile_photo' => [$photoRule, 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'profile_ids' => ['required', 'array', 'min:1'],
            'profile_ids.*' => ['required', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'max:64'],
        ];
    }
}
