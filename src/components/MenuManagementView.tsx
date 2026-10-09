'use client';

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus, Edit2, Search, Image as ImageIcon } from 'lucide-react';

interface MenuManagementProps {
  products: any[];
  categories: any[];
  onRefresh: () => void;
}

export default function MenuManagementView({ products, categories, onRefresh }: MenuManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unitType, setUnitType] = useState<'unidad' | 'kilo' | 'porcion'>('unidad');
  const [available, setAvailable] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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
    setImageUrl('');
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
    setImageUrl(product.image_url || '');
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
      return alert('Por favor ingrese un precio válido');
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
        image_url: imageUrl.trim(),
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
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-orange-500 text-white">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Gestión de Menú & Precios</h2>
            <p className="text-xs text-orange-600 font-semibold">{products.length} platos registrados</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar plato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={openNewProductModal}
            className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Plato</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3 py-1.5 font-medium transition-colors border ${
            selectedCat === 'all'
              ? 'bg-orange-500 text-white border-orange-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3 py-1.5 font-medium transition-colors border whitespace-nowrap ${
              selectedCat === c.id
                ? 'bg-orange-500 text-white border-orange-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Table with Photo Thumbnails */}
      <div className="bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-800 text-white font-semibold">
              <tr>
                <th className="px-3 py-2">Foto</th>
                <th className="px-3 py-2">Plato / Producto</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Venta Por</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.map((product) => {
                const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-1.5">
                      <div className="w-9 h-9 bg-slate-100 border border-slate-200 overflow-hidden">
                        <img
                          src={product.image_url || defaultImg}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultImg;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      {product.description && (
                        <div className="text-[10px] text-slate-400 line-clamp-1">{product.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-slate-600">{product.category_name}</td>
                    <td className="px-3 py-1.5">
                      {product.unit_type === 'kilo' ? (
                        <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-1.5 py-0.5 border border-purple-200">
                          Por Kilo
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 border border-slate-200 capitalize">
                          {product.unit_type}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 font-bold text-orange-600">
                      ${product.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`px-2 py-0.5 text-[10px] font-semibold border transition-colors ${
                          product.available === 1
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {product.available === 1 ? 'Disponible' : 'Agotado'}
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        onClick={() => openEditProductModal(product)}
                        className="p-1 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                        title="Editar Plato"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white border border-slate-300 p-5 max-w-sm w-full space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs border-b border-slate-200 pb-2">
              {editingProduct ? 'Editar Plato' : 'Agregar Nuevo Plato'}
            </h3>

            <div className="space-y-2 text-xs font-medium">
              <div>
                <label className="text-slate-700 block mb-0.5 font-semibold">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-0.5 font-semibold">Nombre del Plato</label>
                <input
                  type="text"
                  placeholder="Ej: Pollo al Spiedo / Milanesa Napolitana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-0.5 font-semibold">URL de Foto (Opcional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-0.5 font-semibold">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Con papas fritas o ensalada rusa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 block mb-0.5 font-semibold">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="8500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-0.5 font-semibold">Modo de Venta</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                  >
                    <option value="unidad">Por Unidad</option>
                    <option value="kilo">Por Kilo ($/kg)</option>
                    <option value="porcion">Por Porción</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isLoading}
                className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold border border-orange-600 text-xs"
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
