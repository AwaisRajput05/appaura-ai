import { apiEndpoints } from '../../../services/apiEndpoints';

export const fetchPayments = async () => {
  try {
    const response = await fetch(apiEndpoints.payments);
    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

export const updateStatus = async (paymentId: string, status: string) => {
  try {
    const response = await fetch(`${apiEndpoints.payments}/${paymentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error('Failed to update payment status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};
