'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit2, Search } from 'lucide-react';

interface MenuManagementProps {
  products: any[];
  categories: any[];
  onRefresh: () => void;
}

export default function MenuManagementView({ products, categories, onRefresh }: MenuManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  
  // Modal State for New/Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unitType, setUnitType] = useState<'unidad' | 'kilo' | 'porcion'>('unidad');
  const [available, setAvailable] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);

  // Sync categoryId when categories change
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category_id === selectedCat;
    return matchesSearch && matchesCat;
  });

  const openNewProductModal = () => {
    setEditingProduct(null);
    setCategoryId(categories[0]?.id || 1);
    setName('');
    setDescription('');
    setPrice('');
    setUnitType('unidad');
    setAvailable(true);
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setCategoryId(product.category_id);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setUnitType(product.unit_type);
    setAvailable(product.available === 1);
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          available: product.available === 1 ? 0 : 1,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating availability:', err);
    }
  };

  const handleSaveProduct = async () => {
    const numPrice = parseFloat(price);
    const targetCatId = categoryId || categories[0]?.id;

    if (!name.trim()) {
      return alert('Por favor ingrese el nombre del plato o producto');
    }
    if (isNaN(numPrice) || numPrice < 0) {
      return alert('Por favor ingrese un precio válido (mayor o igual a 0)');
    }
    if (!targetCatId) {
      return alert('Por favor seleccione una categoría');
    }

    setIsLoading(true);

    try {
      const payload = {
        id: editingProduct?.id,
        category_id: targetCatId,
        name: name.trim(),
        description: description.trim(),
        price: numPrice,
        unit_type: unitType,
        available: available ? 1 : 0,
      };

      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        alert(resData.error || 'Error al guardar el producto');
        return;
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Error saving product:', err);
      alert('Ocurrió un error al guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Gestión de Menú & Precios</h2>
            <p className="text-xs text-slate-500 font-medium">{products.length} platos en catálogo</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
            <input
              type="text"
              placeholder="Buscar plato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-orange-50/40 border border-orange-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          <button
            onClick={openNewProductModal}
            className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedCat === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:text-orange-600'
          }`}
        >
          Todos ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCat === c.id ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:text-orange-600'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-orange-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-orange-50/60 text-slate-700 font-bold uppercase tracking-wider border-b border-orange-200">
              <tr>
                <th className="px-4 py-3.5">Plato / Producto</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Venta Por</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5 text-center">Disponible</th>
                <th className="px-4 py-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-orange-50/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                    {product.description && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">{product.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{product.category_name}</td>
                  <td className="px-4 py-3">
                    {product.unit_type === 'kilo' ? (
                      <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-200">
                        Por Kilo
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                        {product.unit_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-black text-orange-600 text-sm">
                    ${product.price.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                        product.available === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      {product.available === 1 ? 'Disponible' : 'Agotado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="p-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition"
                      title="Editar Plato"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-orange-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingProduct ? 'Editar Plato / Producto' : 'Agregar Nuevo Plato'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Nombre del Plato</label>
                <input
                  type="text"
                  placeholder="Ej: Pollo al Spiedo / Milanesa Napolitana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Con papas fritas o ensalada rusa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="Ej: 8500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2 px-3 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Modo de Venta</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full bg-orange-50/50 border border-orange-200 rounded-xl py-2 px-3 text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="unidad">Por Unidad</option>
                    <option value="kilo">Por Kilo ($/kg)</option>
                    <option value="porcion">Por Porción</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
