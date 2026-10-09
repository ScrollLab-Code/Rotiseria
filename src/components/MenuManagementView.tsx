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
  const [imageUrl, setImageUrl] = useState('');

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
    <div className="space-y-6">
      {/* Top Header & Search Bar (Square Industrial) */}
      <div className="bg-white p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-500 text-white border-2 border-slate-900">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-slate-900">Gestión de Menú & Precios</h2>
            <p className="text-xs text-orange-600 font-bold uppercase">{products.length} PLATOS REGISTRADOS</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
            <input
              type="text"
              placeholder="BUSCAR PLATO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-orange-50/40 border-2 border-slate-900 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none uppercase"
            />
          </div>

          <button
            onClick={openNewProductModal}
            className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 font-black uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO PLATO</span>
          </button>
        </div>
      </div>

      {/* Category Tabs (Square) */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 transition ${
            selectedCat === 'all'
              ? 'bg-orange-500 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
              : 'bg-white text-slate-800 border-slate-300 hover:bg-orange-50'
          }`}
        >
          TODOS ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 transition ${
              selectedCat === c.id
                ? 'bg-orange-500 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-orange-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Table with Photo Thumbnails (McDonald's style) */}
      <div className="bg-white border-2 border-slate-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-900 text-white font-black uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Foto</th>
                <th className="px-4 py-3.5">Plato / Producto</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Venta Por</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 font-bold">
              {filteredProducts.map((product) => {
                const defaultImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80';

                return (
                  <tr key={product.id} className="hover:bg-orange-50/40 transition">
                    <td className="px-4 py-2.5">
                      <div className="w-12 h-12 bg-slate-100 border-2 border-slate-900 overflow-hidden">
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
                    <td className="px-4 py-2.5">
                      <div className="font-black text-slate-900 text-sm uppercase">{product.name}</div>
                      {product.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{product.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-bold uppercase text-slate-700">{product.category_name}</td>
                    <td className="px-4 py-2.5">
                      {product.unit_type === 'kilo' ? (
                        <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 border border-slate-900 uppercase">
                          POR KILO
                        </span>
                      ) : (
                        <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 uppercase">
                          {product.unit_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-black text-orange-600 text-sm">
                      ${product.price.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        className={`px-3 py-1 text-[10px] font-black uppercase border-2 transition ${
                          product.available === 1
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-600 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-900 border-rose-600 hover:bg-rose-200'
                        }`}
                      >
                        {product.available === 1 ? 'DISPONIBLE' : 'AGOTADO'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => openEditProductModal(product)}
                        className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                        title="Editar Plato"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW / EDIT PRODUCT MODAL (Square Industrial) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-slate-900 p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-4">
            <h3 className="font-black text-slate-900 text-base uppercase border-b-2 border-slate-900 pb-2">
              {editingProduct ? 'EDITAR PLATO' : 'AGREGAR NUEVO PLATO'}
            </h3>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-900 block mb-1 font-black uppercase">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 font-bold focus:outline-none uppercase"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-900 block mb-1 font-black uppercase">Nombre del Plato</label>
                <input
                  type="text"
                  placeholder="Ej: Pollo al Spiedo / Milanesa Napolitana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 font-bold focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-slate-900 block mb-1 font-black uppercase">URL de Foto del Plato (Tipo McDonald's)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-orange-50/50 border-2 border-slate-900 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-900 block mb-1 font-black uppercase">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Con papas fritas o ensalada rusa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 font-bold focus:outline-none uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-900 block mb-1 font-black uppercase">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="8500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 font-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-900 block mb-1 font-black uppercase">Modo de Venta</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full bg-orange-50/50 border-2 border-slate-900 py-2 px-3 text-slate-900 font-bold focus:outline-none uppercase"
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
                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black border-2 border-slate-900 text-xs uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black border-2 border-slate-900 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                {isLoading ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
