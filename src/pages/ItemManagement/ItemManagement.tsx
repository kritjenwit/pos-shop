import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(price);
    if (!name || !price || priceNum <= 0) return;

    if (item) {
      updateItem(item.id, { name, price: priceNum, image });
    } else {
      addItem({ name, price: priceNum, image, quantity: 100 });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-600"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Image</label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 border rounded text-sm cursor-pointer hover:bg-slate-200"
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
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-4 py-2 bg-slate-100 rounded text-sm hover:bg-slate-200" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
              {item ? 'Update' : 'Add'}
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
        <h1 className="text-2xl font-bold">Item Management</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
          onClick={() => {
            setEditingItem(undefined);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
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
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">฿{item.price}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="w-8 h-8 rounded flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="w-8 h-8 rounded flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Delete Item</h3>
            <p className="text-slate-500 mb-4">Are you sure you want to delete "{deletingItem.name}"?</p>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 bg-slate-100 rounded text-sm hover:bg-slate-200" onClick={() => setDeletingItem(undefined)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}