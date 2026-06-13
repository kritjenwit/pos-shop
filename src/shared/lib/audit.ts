import { supabase } from './supabase';

export type AuditEvent = 'sign_in' | 'sign_up' | 'sign_out' | 'order_created' | 'order_approved' | 'order_cancelled' | 'order_completed' | 'item_added' | 'item_updated' | 'item_deleted';

export async function logEvent(event: AuditEvent, userId: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    await supabase.from('audit_log').insert({
      event,
      user_id: userId,
      metadata: metadata || {},
    });
  } catch {
    // Audit failures should never block the main flow
  }
}
