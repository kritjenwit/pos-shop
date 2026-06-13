import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getItems, addItem, updateItem, deleteItem } from './items';

const mockFrom = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());

vi.mock('./supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('./images', () => ({
  deleteImage: vi.fn(),
}));

const mockItem = { id: '1', name: 'Coffee', price: 45, image: 'img.jpg', quantity: 10 };
const mockItem2 = { id: '2', name: 'Tea', price: 25, image: 'tea.jpg', quantity: 20 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getItems', () => {
  it('should return items on success', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockResolvedValue({ data: [mockItem, mockItem2], error: null });

    const result = await getItems();

    expect(result.data).toEqual([mockItem, mockItem2]);
    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockSelect).toHaveBeenCalledWith('*');
  });

  it('should return empty array when data is null', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockResolvedValue({ data: null, error: null });

    const result = await getItems();

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const result = await getItems();

    expect(result.data).toBeNull();
    expect(result.error).toBe('DB error');
  });
});

describe('addItem', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockImplementation(() => ({ select: mockSelect }));
  });

  it('should return inserted item on success', async () => {
    mockSelect.mockResolvedValue({ data: [mockItem], error: null });

    const result = await addItem({ name: 'Coffee', price: 45, image: 'img.jpg', quantity: 10 });

    expect(result.data).toEqual(mockItem);
    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockInsert).toHaveBeenCalledWith({ name: 'Coffee', price: 45, image: 'img.jpg', quantity: 10 });
  });

  it('should return null data when response has no data', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });

    const result = await addItem({ name: 'Coffee', price: 45, image: 'img.jpg', quantity: 10 });

    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });

    const result = await addItem({ name: 'Coffee', price: 45, image: 'img.jpg', quantity: 10 });

    expect(result.data).toBeNull();
    expect(result.error).toBe('Insert failed');
  });
});

describe('updateItem', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ update: mockUpdate });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('should update item on success', async () => {
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await updateItem('1', { price: 50 });

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockUpdate).toHaveBeenCalledWith({ price: 50 });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  it('should return error on failure', async () => {
    mockEq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

    const result = await updateItem('1', { price: 50 });

    expect(result.error).toBe('Update failed');
    expect(result.data).toBeNull();
  });
});

describe('deleteItem', () => {
  it('should delete item without image', async () => {
    mockFrom.mockReturnValue({ delete: mockDelete });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: null, error: null });

    const result = await deleteItem('1');

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('items');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });

  it('should return error on failure', async () => {
    mockFrom.mockReturnValue({ delete: mockDelete });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });

    const result = await deleteItem('2');

    expect(result.error).toBe('Delete failed');
    expect(result.data).toBeNull();
  });
});
