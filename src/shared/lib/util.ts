export const getEnv = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set. Using default value: ${defaultValue}`);
  }
  return value;
};

export const generateOrderId = (): string => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
};

export function resetFormState(settlers: {
  setOrderComplete: (v: boolean) => void;
  setCreatedOrder: (v: null) => void;
  setCustomerName: (v: string) => void;
  setCustomerPhone: (v: string) => void;
  setAdditionalDetail: (v: string) => void;
}) {
  settlers.setOrderComplete(false);
  settlers.setCreatedOrder(null);
  settlers.setCustomerName('');
  settlers.setCustomerPhone('');
  settlers.setAdditionalDetail('');
}