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
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Delete an image from Supabase storage
 * @param imageUrl The public URL of the image to delete
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  if (!imageUrl) return;

  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf(STORAGE_BUCKET) + 1).join('/');

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export interface User {
  id: string;
  email: string;
  password: string;
  full_name: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  total_amount: number;
  status: string;
  created_by: string;
  created_at: string;
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