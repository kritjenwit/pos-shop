# Migrate Supabase Storage to Signed URLs

**Created:** 2026-04-29  
**Feature:** Replace public storage URLs with signed URLs for better security

## Current State

- `uploadImage` uploads to bucket `pos-shop` and returns a **public URL** via `getPublicUrl()`
- `deleteImage` parses the full public URL to extract the file path
- `getImage` already uses `createSignedUrl()` but is **unused**
- The `Item.image` field stores full public URLs
- Storage bucket is likely **public** (images accessible without auth)

## Goal

- Make the storage bucket **private**
- Store **file paths** in the database instead of public URLs
- Resolve **signed URLs** at render time for display
- All image access goes through authenticated signed URLs

## Steps

### 1. Make Storage Bucket Private

- Supabase Dashboard → Storage → `pos-shop` bucket → change visibility to **Private**
- Or via SQL: `UPDATE storage.buckets SET public = false WHERE name = 'pos-shop';`

### 2. Add Storage RLS Policies

```sql
CREATE POLICY "Allow authenticated users to read images"
ON storage.objects FOR SELECT USING (bucket_id = 'pos-shop');

CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pos-shop');

CREATE POLICY "Allow authenticated users to update images"
ON storage.objects FOR UPDATE USING (bucket_id = 'pos-shop');

CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects FOR DELETE USING (bucket_id = 'pos-shop');
```

### 3. Update `src/lib/supabase.ts`

- **`uploadImage`:** Return file path instead of public URL (remove `getPublicUrl()` call)
- **`deleteImage`:** Accept file path directly (remove URL parsing logic)
- **New `getSignedImageUrl`:** Replace unused `getImage` with a properly typed helper, expiry 3600s (1 hour)

### 4. Update `src/pages/ItemList/ItemList.tsx`

- Import `getSignedImageUrl`
- In `ItemCard`, resolve stored file path to signed URL for `<img src>`
- Keep placeholder fallback for items without images

### 5. Update `src/pages/ItemManagement/ItemManagement.tsx`

- **Table thumbnails:** Resolve file path to signed URL
- **Form edit preview:** Resolve existing image path to signed URL
- **Form preview (new upload):** Already uses FileReader data URL — keep as-is
- **Delete:** Pass file path directly to `deleteImage`

### 6. Update `src/context/AppContext.tsx`

- `deleteImage` call on item delete now receives path directly — no change needed structurally

### 7. Migration for Existing Data

Existing items store full URLs. Extract file paths:

```sql
UPDATE items
SET image = SUBSTRING(image FROM 'storage/v1/object/public/pos-shop/([^?]+)')
WHERE image LIKE '%storage/v1/object/public/pos-shop/%';
```

Or handle in code by detecting URL vs path format.

### 8. Update Tests

- Update mocks and test data to use file paths instead of URLs

### 9. Verify

- `npm run build` for type check
- `npm run lint`

## Files to Modify

- `src/lib/supabase.ts`
- `src/pages/ItemList/ItemList.tsx`
- `src/pages/ItemManagement/ItemManagement.tsx`
- `src/context/AppContext.tsx`
- `src/pages/ItemList/ItemList.test.tsx`

## Acceptance Criteria

- Bucket is private with RLS policies
- Database stores file paths
- All images load via signed URLs
- Upload, display, and delete all work correctly
- Existing data migrated
- Tests pass
