import React, { useState, useEffect, useTransition } from 'react';
import { Link } from 'react-router-dom';
import OfferTable from '../../../features/offer/OfferTable';
import ErrorBoundary from '../../../common/error/ErrorBoundary';
import { apiEndpoints } from '../../../../services/apiEndpoints';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getToken } from '../../../../services/tokenUtils';
import apiService from '../../../../services/apiService';
import Spinner from '../../../common/spinner/Spinner';

export default function OfferDashboard() {
  const [offers, setOffers] = useState([]); // Always initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  // Fetch offers data
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token || !user?.userId) {
        throw new Error('User not authenticated');
      }

      const response = await apiService.get(apiEndpoints.vendorOffers, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      // Check if response contains valid data
      if (response.data) {
        if (Array.isArray(response.data)) {
          startTransition(() => {
            setOffers(response.data);
          });
        } else if (
          response.data.status === 'success' &&
          Array.isArray(response.data.data)
        ) {
          startTransition(() => {
            setOffers(response.data.data);
          });
        } else {
          throw new Error('Invalid data format received from server');
        }
        setError(null);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.log('Fetch offers response:', err.response?.data); // Debug log
      if (
        err.response &&
        err.response.status === 404 &&
        err.response.data?.status === 'error' &&
        err.response.data?.message === 'Offer not found.'
      ) {
        // Treat 404 with specific error message as no records found
        startTransition(() => {
          setOffers([]);
        });
      } else {
        console.error('Fetch offers error:', err);
        setError(err.message || 'Failed to fetch offers');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchOffers();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user?.userId]);

  // Handler for updating offer status
  async function toggleStatus(id) {
    if (!Array.isArray(offers)) {
      setError('Offers data is not loaded');
      return;
    }

    const updatedOffer = offers.find((o) => (o.id || o._id) === id);
    if (!updatedOffer) {
      setError('Offer not found');
      return;
    }

    const newStatus = updatedOffer.status === 'Active' ? 'Inactive' : 'Active';

    startTransition(() => {
      setOffers((prev) =>
        prev.map((o) =>
          (o.id || o._id) === id ? { ...o, status: newStatus } : o
        )
      );
    });

    try {
      const response = await apiService.patch(
        apiEndpoints.updateOfferStatus(id),
        { status: newStatus }
      );

      if (!response.data || response.data.error) {
        throw new Error(response.data?.message || 'Failed to update status');
      }

      startTransition(() => {
        setOffers((prev) =>
          prev.map((o) =>
            (o.id || o._id) === id
              ? { ...o, ...response.data.data, status: newStatus }
              : o
          )
        );
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message);
      startTransition(() => {
        setOffers((prev) =>
          prev.map((o) =>
            (o.id || o._id) === id ? { ...o, status: updatedOffer.status } : o
          )
        );
      });
    }
  }

  // Handler for redeeming an offer
  async function handleRedeem(id) {
    console.log('handleRedeem called with id:', id, 'offers:', offers);

    if (!Array.isArray(offers)) {
      console.error('Offers is not an array:', offers);
      setError('Offers data is not loaded');
      return;
    }

    const updatedOffer = offers.find((o) => (o.id || o._id) === id);
    if (!updatedOffer) {
      console.error('Offer not found for id:', id);
      setError('Offer not found');
      return;
    }

    const currentMetrics = updatedOffer.metrics || {
      daily: 0,
      weekly: 0,
      monthly: 0,
    };

    startTransition(() => {
      setOffers((prev) =>
        prev.map((o) =>
          (o.id || o._id) === id
            ? {
                ...o,
                metrics: {
                  ...currentMetrics,
                  daily: currentMetrics.daily + 1,
                  weekly: currentMetrics.weekly + 1,
                  monthly: currentMetrics.monthly + 1,
                },
              }
            : o
        )
      );
    });

    try {
      const endpoint =
        apiEndpoints.updateOfferMetrics?.(id) || apiEndpoints.updateOffer(id);
      const response = await apiService.patch(endpoint, {
        metrics: {
          daily: currentMetrics.daily + 1,
          weekly: currentMetrics.weekly + 1,
          monthly: currentMetrics.monthly + 1,
        },
      });

      if (!response.data || response.data.error) {
        throw new Error(response.data?.message || 'Failed to update metrics');
      }

      startTransition(() => {
        setOffers((prev) =>
          prev.map((o) =>
            (o.id || o._id) === id ? { ...o, ...response.data.data } : o
          )
        );
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
      setError(error.message);
      startTransition(() => {
        setOffers((prev) =>
          prev.map((o) =>
            (o.id || o._id) === id ? { ...o, metrics: currentMetrics } : o
          )
        );
      });
    }
  }

  // Handler for offer form submission
  const handleOfferUpdate = async (updatedOffer) => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await apiService.patch(
        apiEndpoints.updateOffer(updatedOffer.id || updatedOffer._id),
        updatedOffer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.data || response.data.error) {
        throw new Error(response.data?.message || 'Failed to update offer');
      }

      startTransition(() => {
        setOffers((prev) =>
          prev.map((o) =>
            (o.id || o._id) === (updatedOffer.id || updatedOffer._id)
              ? { ...o, ...response.data.data }
              : o
          )
        );
      });
      setError(null);
    } catch (error) {
      console.error('Error updating offer:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isPending) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <div className="flex justify-between items-center bg-white p-2 rounded-md mb-6">
        <Link
          to="new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Offer
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <ErrorBoundary fallback="An error occurred while loading the offers table">
          <OfferTable
            offers={offers}
            onToggleStatus={toggleStatus}
            onRedeem={handleRedeem}
            onOfferUpdate={handleOfferUpdate}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
