import { useParams } from 'react-router-dom';
import AdminCheckoutView from './AdminCheckoutView';
import CustomerCheckoutView from './CustomerCheckoutView';

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId?: string }>();

  if (orderId) {
    return <AdminCheckoutView orderId={orderId} />;
  }

  return <CustomerCheckoutView />;
}
