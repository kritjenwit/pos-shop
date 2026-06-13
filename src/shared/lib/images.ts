import { supabase } from './supabase';

const STORAGE_BUCKET = 'pos-shop';

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

export const deleteImage = async (filePath: string): Promise<void> => {
  if (!filePath) return;

  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (deleteError) {
    throw deleteError;
  }
};

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
