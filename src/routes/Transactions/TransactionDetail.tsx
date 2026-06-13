import { useParams } from 'react-router-dom';
import TransactionDetailView from '../../shared/components/TransactionDetailView';
import { uploadReceipt } from '../../shared/lib/orders';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <TransactionDetailView
      transactionId={id!}
      shareUrl={`${window.location.origin}/transactions/${id}`}
      errorRedirectUrl="/transactions"
      backUrl="/transactions"
      backLabel="Back to Transactions"
      showStatusColors
      allowUpload
      onUpload={uploadReceipt}
    />
  );
}
