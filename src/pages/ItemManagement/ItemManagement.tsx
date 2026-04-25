import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../lib/supabase';
import { COLORS } from '../../constants';

function ItemForm({
  item,
  onClose,
}: {
  item?: Item;
  onClose: () => void;
}) {
  const { addItem, updateItem } = useApp();
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [image, setImage] = useState(item?.image || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const priceNum = parseFloat(price);
      if (!name || !price || priceNum <= 0) {
        setError('Invalid name or price');
        return;
      }

      if (item) {
        await updateItem(item.id, { name, price: priceNum, image });
      } else {
        await addItem({ name, price: priceNum, image, quantity: 100 });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-lg w-full max-w-md mx-4 shadow-xl" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
          <h2 className="text-lg font-semibold" style={{ color: COLORS.text }}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            style={{ color: COLORS.textSecondary }}
          >
            <X size={20} />
          </button>
        </div>
<form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.textSecondary }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
              style={{ borderColor: COLORS.border }}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.textSecondary }}>
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
              style={{ borderColor: COLORS.border }}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.textSecondary }}>
              Image
            </label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded text-sm cursor-pointer"
              style={{ backgroundColor: '#f1f5f9', border: `1px solid ${COLORS.border}` }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> Upload Image
            </button>
            {image && (
              <div className="mt-2">
                <img src={image} alt="Preview" className="w-24 h-24 object-cover rounded" />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded text-sm"
              style={{ backgroundColor: '#f1f5f9' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: COLORS.primary, color: '#ffffff' }}
            >
              {loading ? 'Saving...' : item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ItemManagementPage() {
  const { items, deleteItem } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [deletingItem, setDeletingItem] = useState<Item | undefined>();

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (item: Item) => {
    setDeletingItem(item);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteItem(deletingItem.id);
      setDeletingItem(undefined);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(undefined);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.text }}>Item Management</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: COLORS.primary, color: '#ffffff' }}
          onClick={() => {
            setEditingItem(undefined);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.cardBackground }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textSecondary }}>
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textSecondary }}>
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textSecondary }}>
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: COLORS.textSecondary }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50" style={{ borderColor: COLORS.border }}>
                <td className="px-4 py-3">
                  <img
                    src={
                      item.image ||
                      `https://placehold.co/40x40/f1f5f9/64748b?text=${encodeURIComponent(item.name.charAt(0))}`
                    }
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-3" style={{ color: COLORS.text }}>{item.name}</td>
                <td className="px-4 py-3" style={{ color: COLORS.text }}>฿{item.price}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: '#dbeafe', color: COLORS.primary }}
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="w-8 h-8 rounded flex items-center justify-center"
                      style={{ backgroundColor: '#fee2e2', color: COLORS.danger }}
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <ItemForm item={editingItem} onClose={closeModal} />}

      {deletingItem && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-lg p-6 max-w-sm mx-4 text-center" style={{ backgroundColor: COLORS.cardBackground }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>Delete Item</h3>
            <p className="mb-4" style={{ color: COLORS.textSecondary }}>
              Are you sure you want to delete "{deletingItem.name}"?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-2 rounded text-sm"
                style={{ backgroundColor: '#f1f5f9' }}
                onClick={() => setDeletingItem(undefined)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded text-sm"
                style={{ backgroundColor: COLORS.danger, color: '#ffffff' }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}