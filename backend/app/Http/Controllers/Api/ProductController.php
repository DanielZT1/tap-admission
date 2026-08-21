<?php

namespace App\Http\Controllers\Api;

use App\Exports\ArrayRowsExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Services\AuditLogger;
use App\Services\CodeGenerator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProductController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly CodeGenerator $codeGenerator,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json(Product::latest()->get()->map(fn (Product $product) => $this->row($product)));
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = Product::create([
            ...$request->validated(),
            'product_code' => $this->codeGenerator->make('PRD'),
        ]);

        $this->auditLogger->record('product', 'created', $product);

        return response()->json($this->row($product), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json($this->row($product));
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $previous = $product->toArray();
        $product->update($request->validated());
        $this->auditLogger->record('product', 'updated', $product, $previous);

        return response()->json($this->row($product));
    }

    public function destroy(Product $product): JsonResponse
    {
        $previous = $product->toArray();
        $this->auditLogger->record('product', 'deleted', $product, $previous);
        $product->delete();

        return response()->json(['message' => 'Producto eliminado.']);
    }

    public function excel(): BinaryFileResponse
    {
        return Excel::download(
            new ArrayRowsExport(['Codigo', 'Nombre', 'Precio', 'Fecha de creacion'], $this->exportRows()),
            'productos.xlsx'
        );
    }

    public function pdf()
    {
        return Pdf::loadView('exports.products', ['rows' => $this->exportRows()])
            ->download('productos.pdf');
    }

    private function exportRows(): array
    {
        return Product::latest()->get()
            ->map(fn (Product $product) => [
                $product->product_code,
                $product->name,
                $product->price,
                $product->created_at?->format('d/m/Y H:i'),
            ])
            ->all();
    }

    private function row(Product $product): array
    {
        return [
            'id' => (string) $product->getKey(),
            'product_code' => $product->product_code,
            'name' => $product->name,
            'brand' => $product->brand,
            'price' => $product->price,
            'created_at' => $product->created_at?->format('d/m/Y H:i'),
        ];
    }
}
