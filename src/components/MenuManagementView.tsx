'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Edit2, CheckCircle2, XCircle, Search, DollarSign, Scale, Tag } from 'lucide-react';

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
    if (!name || isNaN(numPrice) || numPrice < 0) {
      return alert('Complete el nombre y precio del producto');
    }

    setIsLoading(true);

    try {
      const payload = {
        id: editingProduct?.id,
        category_id: categoryId,
        name,
        description,
        price: numPrice,
        unit_type: unitType,
        available: available ? 1 : 0,
      };

      const res = await fetch('/api/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al guardar producto');

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      alert('Error al guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gestión de Menú & Precios</h2>
            <p className="text-xs text-slate-400">{products.length} platos en catálogo</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar plato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={openNewProductModal}
            className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs px-3.5 py-2 rounded-xl font-bold transition shadow-md shadow-amber-500/10"
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
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedCat === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Todos ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCat === c.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Plato / Producto</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">Venta Por</th>
                <th className="px-4 py-3.5">Precio</th>
                <th className="px-4 py-3.5 text-center">Disponible</th>
                <th className="px-4 py-3.5 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-sm">{product.name}</div>
                    {product.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-1">{product.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-400">{product.category_name}</td>
                  <td className="px-4 py-3">
                    {product.unit_type === 'kilo' ? (
                      <span className="bg-purple-950 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-800">
                        Por Kilo
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded uppercase">
                        {product.unit_type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-black text-amber-400 text-sm">
                    ${product.price.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleAvailability(product)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                        product.available === 1
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                          : 'bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900'
                      }`}
                    >
                      {product.available === 1 ? 'Disponible' : 'Agotado'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">
              {editingProduct ? 'Editar Plato / Producto' : 'Agregar Nuevo Plato'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nombre del Plato</label>
                <input
                  type="text"
                  placeholder="Ej: Pollo al Spiedo / Milanesa Napolitana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Descripción (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Con papas fritas o ensalada rusa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Precio ($)</label>
                  <input
                    type="number"
                    placeholder="Ej: 8500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Modo de Venta</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-amber-500"
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
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
