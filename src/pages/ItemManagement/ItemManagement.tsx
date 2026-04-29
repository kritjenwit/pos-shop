import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Item } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { uploadImage, deleteImage, getSignedImageUrl } from '../../lib/supabase';

function SignedImage({ filePath, alt, className }: { filePath: string | null; alt: string; className?: string }) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      const url = await getSignedImageUrl(filePath);
      if (!cancelled && url) {
        setSrc(url);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [filePath]);

  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

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
  const [imagePath, setImagePath] = useState(item?.image || '');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item?.image) {
      getSignedImageUrl(item.image).then((url) => {
        if (url) {
          setImagePreview(url);
        }
      });
    }
  }, [item?.image]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImagePath('');
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

      let imageUrl = imagePath || item?.image || '';
      const file = fileRef.current?.files?.[0];
      
      if (file) {
        if (item?.image) {
          await deleteImage(item.image);
        }
        imageUrl = await uploadImage(file);
      }

      if (item) {
        await updateItem(item.id, { name, price: priceNum, image: imageUrl });
      } else {
        await addItem({ name, price: priceNum, image: imageUrl, quantity: 100 });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-3 border-b -mx-4 -mt-4 mb-4" style={{ borderColor: COLORS.border }}>
          <h2 className="text-lg font-semibold font-heading" style={{ color: COLORS.text }}>
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X size={20} style={{ color: COLORS.textSecondary }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="itemName" className="label-base" style={{ color: COLORS.textSecondary }}>
              Name
            </label>
            <input
              id="itemName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base"
              placeholder="Item name"
              required
            />
          </div>
          <div>
            <label htmlFor="itemPrice" className="label-base" style={{ color: COLORS.textSecondary }}>
              Price
            </label>
            <input
              id="itemPrice"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-base"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="label-base" style={{ color: COLORS.textSecondary }}>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ backgroundColor: '#F1F5F9', border: `1px solid ${COLORS.borderInput}` }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> Upload Image
            </button>
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              className="btn-ghost"
              style={{ color: COLORS.textSecondary }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading" style={{ color: COLORS.text }}>Item Management</h1>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => {
            setEditingItem(undefined);
            setShowModal(true);
          }}
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
          <Plus size={48} style={{ color: COLORS.textSecondary }} />
          <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>No items yet</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Add your first item to get started</p>
        </div>
      ) : (
        <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: COLORS.primary + '08' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase font-heading" style={{ color: COLORS.textSecondary }}>
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase font-heading" style={{ color: COLORS.textSecondary }}>
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase font-heading" style={{ color: COLORS.textSecondary }}>
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase font-heading" style={{ color: COLORS.textSecondary }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-t transition-colors duration-150" style={{ borderColor: COLORS.border, backgroundColor: idx % 2 === 0 ? 'transparent' : COLORS.primary + '04' }}>
                    <td className="px-4 py-3">
                      {item.image ? (
                        <SignedImage filePath={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-heading font-semibold text-sm" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: COLORS.text }}>{item.name}</td>
                    <td className="px-4 py-3 font-heading font-semibold" style={{ color: COLORS.accent }}>฿{item.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          style={{ backgroundColor: '#DBEAFE', color: COLORS.primary }}
                          onClick={() => handleEdit(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                          style={{ backgroundColor: '#FEE2E2', color: COLORS.danger }}
                          onClick={() => handleDelete(item)}
                          aria-label={`Delete ${item.name}`}
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
        </div>
      )}

      {showModal && <ItemForm item={editingItem} onClose={closeModal} />}

      {deletingItem && (
        <div className="modal-backdrop" onClick={() => setDeletingItem(undefined)}>
          <div className="modal-content text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FEE2E2' }}>
              <Trash2 size={24} style={{ color: COLORS.danger }} />
            </div>
            <h3 className="text-lg font-semibold font-heading mb-2" style={{ color: COLORS.text }}>Delete Item</h3>
            <p className="mb-6" style={{ color: COLORS.textSecondary }}>
              Are you sure you want to delete <span className="font-semibold">{deletingItem.name}</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="btn-ghost"
                style={{ color: COLORS.textSecondary }}
                onClick={() => setDeletingItem(undefined)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
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
