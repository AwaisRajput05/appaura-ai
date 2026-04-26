import { useState } from 'react';
import { updateVendorStatus } from '../../../../services/AuthEndpoints';
import Spinner from '../../../common/spinner/Spinner';
import { CheckCircle, XCircle } from 'lucide-react'; // more solid-styled Lucide icons

export const VendorActions = ({ vendorId, status, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await updateVendorStatus(vendorId, newStatus);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-8 items-center">
      {status !== 'APPROVED' && (
        <button
          onClick={() => handleStatusChange('APPROVED')}
          className="text-green-600 hover:text-green-800"
          title="Approve"
        >
          <CheckCircle size={24} strokeWidth={2.5} />
        </button>
      )}
      {status !== 'BLOCKED' && (
        <button
          onClick={() => handleStatusChange('BLOCKED')}
          className="text-red-600 hover:text-red-800"
          title="Block"
        >
          <XCircle size={24} strokeWidth={2.5} />
        </button>
      )}
      {loading && <Spinner size="sm" />}

 
   <div className="text-red-500 text-center">{error}</div> 

    </div>
  );
};
