import { supabase } from './supabase';
import { uploadImage } from './images';
import { generateOrderId } from './util';
import { validateBasketPrices } from './items';
import type { TransactionItemInput } from './items';

export interface CustomerInfo {
  name?: string;
  phone?: string;
  detail?: string;
}

export async function createOrder(
  basket: Map<string, number>,
  userId: string,
  options?: {
    customerName?: string | null;
    customerPhone?: string | null;
    additionalDetail?: string | null;
    receiptFile?: File | null;
    status?: string;
  },
) {
  if (basket.size === 0) {
    return { data: null, error: 'Basket is empty' };
  }

  try {
    let receiptUrl: string | null = null;
    if (options?.receiptFile) {
      receiptUrl = await uploadImage(options.receiptFile);
    }

    const { data: priceResult, error: priceError } = await validateBasketPrices(basket);
    if (priceError || !priceResult) {
      return { data: null, error: priceError || 'Failed to validate prices' };
    }
    const { items: transactionItems, total } = priceResult;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status: options?.status || 'completed',
        created_by: userId,
        receipt_url: receiptUrl,
        customer_name: options?.customerName || null,
        customer_phone: options?.customerPhone || null,
        additional_detail: options?.additionalDetail || null,
        order_id: generateOrderId(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (data) {
      const lineItems: (TransactionItemInput & { transaction_id: string })[] = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        return { data: null, error: itemsError.message };
      }
    }

    return {
      data: {
        id: data.id,
        orderId: data.order_id || '',
        totalAmount: data.total_amount,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create order' };
  }
}

export async function createPendingOrder(
  basket: Map<string, number>,
  customerInfo?: CustomerInfo,
) {
  if (basket.size === 0) {
    return { data: null, error: 'Basket is empty' };
  }

  try {
    const { data: priceResult, error: priceError } = await validateBasketPrices(basket);
    if (priceError || !priceResult) {
      return { data: null, error: priceError || 'Failed to validate prices' };
    }
    const { items: transactionItems, total } = priceResult;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status: 'pending',
        customer_name: customerInfo?.name || null,
        customer_phone: customerInfo?.phone || null,
        additional_detail: customerInfo?.detail || null,
        order_id: generateOrderId(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (data) {
      const lineItems: (TransactionItemInput & { transaction_id: string })[] = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        return { data: null, error: itemsError.message };
      }
    }

    return {
      data: {
        id: data.id,
        orderId: data.order_id || '',
        totalAmount: data.total_amount,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create pending order' };
  }
}

export async function approveOrder(id: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to approve order' };
  }
}

export async function cancelOrder(id: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to cancel order' };
  }
}

export async function confirmPayment(
  id: string,
  options?: {
    receiptFile?: File;
    customerName?: string;
    customerPhone?: string;
    additionalDetail?: string;
  },
) {
  try {
    const updates: Record<string, string | null> = { status: 'completed' };

    if (options?.receiptFile) {
      const receiptUrl = await uploadImage(options.receiptFile);
      updates.receipt_url = receiptUrl;
    }

    const customerUpdates: Record<string, string | null | undefined> = {};
    if (options?.customerName !== undefined) {
      customerUpdates.customer_name = options.customerName;
    }
    if (options?.customerPhone !== undefined) {
      customerUpdates.customer_phone = options.customerPhone;
    }
    if (options?.additionalDetail !== undefined) {
      customerUpdates.additional_detail = options.additionalDetail;
    }

    const hasCustomerUpdates = Object.keys(customerUpdates).length > 0;
    if (hasCustomerUpdates) {
      const { error: infoError } = await supabase
        .from('transactions')
        .update(customerUpdates)
        .eq('id', id);

      if (infoError) {
        return { data: null, error: infoError.message };
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to confirm payment' };
  }
}

export async function uploadReceipt(id: string, file: File) {
  try {
    const receiptUrl = await uploadImage(file);

    const { error } = await supabase
      .from('transactions')
      .update({ receipt_url: receiptUrl })
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { receiptUrl }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to upload receipt' };
  }
}
