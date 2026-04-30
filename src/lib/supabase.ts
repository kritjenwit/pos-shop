import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export interface Item {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Storage bucket name for item images
const STORAGE_BUCKET = 'pos-shop';

/**
 * Upload an image file to Supabase storage
 * @param file The image file to upload
 * @returns File path of the uploaded image
 */
export const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  return filePath;
};

/**
 * Delete an image from Supabase storage
 * @param filePath The file path of the image to delete
 */
export const deleteImage = async (filePath: string): Promise<void> => {
  if (!filePath) return;

  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (deleteError) {
    throw deleteError;
  }
};

/**
 * Get a signed URL for an image file path
 * @param filePath The path of the file in storage
 * @returns Signed URL string or null if no path
 */
export const getSignedImageUrl = async (filePath: string | null): Promise<string | null> => {
  if (!filePath) return null;

  if (filePath.startsWith('data:') || filePath.startsWith('http')) {
    return filePath;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
};

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  total_amount: number;
  status: string;
  created_by: string;
  created_at: string;
  receipt_url: string | null;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}