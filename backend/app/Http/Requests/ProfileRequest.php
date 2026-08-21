<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileRequest extends FormRequest
{
    public const SECTIONS = ['products', 'users', 'profiles'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'section_keys' => ['required', 'array', 'min:1'],
            'section_keys.*' => ['required', 'string', Rule::in(self::SECTIONS)],
        ];
    }
}
