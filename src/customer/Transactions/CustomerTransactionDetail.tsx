import { useParams, useLocation } from 'react-router-dom';
import TransactionDetailView from '../../shared/components/TransactionDetailView';

export default function CustomerTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  return (
    <TransactionDetailView
      transactionId={id!}
      shareUrl={window.location.origin + location.pathname}
      errorRedirectUrl="/public/transactions"
    />
  );
}
