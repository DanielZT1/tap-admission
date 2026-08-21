<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'brand' => ['required', 'string', 'max:120'],
            'price' => ['required', 'integer', 'min:0', 'max:999'],
        ];
    }
}
