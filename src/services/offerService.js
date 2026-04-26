import apiService from './apiService';
import { apiEndpoints } from './apiEndpoints';

export class OfferService {
  static async createOffer(offerData) {
    try {
      const response = await apiService.post(
        apiEndpoints.createOffer,
        this.sanitizeOfferData(offerData)
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  static async updateOffer(vendorId, offerId, offerData, originalData) {
    try {
      // Prepare update data
      const updateData = this.sanitizeOfferData(offerData, originalData);

      // Validate the data before sending
      this.validateOfferData(updateData);

      // Log the request details
      console.log('Update Request Details:', {
        endpoint: apiEndpoints.updateOffer(vendorId, offerId),
        originalData,
        newData: offerData,
        processedData: updateData,
      });

      // Make the API call
      const response = await apiService.patch(
        apiEndpoints.updateOffer(vendorId, offerId),
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Update Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update Error:', {
        error,
        requestData: offerData,
        sanitizedData: this.sanitizeOfferData(offerData, originalData),
      });
      throw this.handleApiError(error);
    }
  }

  static sanitizeOfferData(data, originalData = null) {
    // Create a clean offer object with exact API structure
    const sanitizedData = {
      title: data.title?.trim() || undefined,
      description: data.description?.trim() || undefined,
      type: data.type ? data.type.toUpperCase() : undefined,
      startTime: data.startTime
        ? this.formatDate(data.startTime, true)
        : undefined,
      endTime: data.endTime ? this.formatDate(data.endTime, false) : undefined,
      termsAndConditions: data.termsAndConditions?.trim() || undefined,
      targetAudience: data.targetAudience
        ? this.formatTargetAudience(data.targetAudience)
        : undefined,
      status: data.status ? data.status.toUpperCase() : undefined,
    };

    // For updates, compare with original data and only include changed fields
    if (originalData) {
      const changedFields = {};

      // Compare and include only explicitly changed fields
      Object.entries(data).forEach(([key, newValue]) => {
        // Only process fields that were actually provided in the update
        if (newValue === undefined || newValue === null) return;

        const sanitizedValue = sanitizedData[key];

        // For dates, compare the actual values
        if (key === 'startTime' || key === 'endTime') {
          if (newValue) {
            // Only include if a new value was provided
            changedFields[key] = this.formatDate(newValue, key === 'startTime');
          }
        }
        // For arrays (targetAudience), compare the actual values
        else if (key === 'targetAudience') {
          if (Array.isArray(newValue)) {
            changedFields[key] = this.formatTargetAudience(newValue);
          }
        }
        // For other fields, include if they were provided in the update
        else if (newValue !== undefined && newValue !== null) {
          changedFields[key] = sanitizedValue;
        }
      });

      // Log what's being changed
      console.log('Field changes:', {
        original: originalData,
        changes: changedFields,
        newValues: sanitizedData,
      });

      return changedFields;
    }

    // For create operation, remove undefined or null fields
    return Object.fromEntries(
      Object.entries(sanitizedData).filter(([, value]) => value != null)
    );
  }

  static formatTargetAudience(audience) {
    if (!audience || (Array.isArray(audience) && audience.length === 0)) {
      return ['ALL_CUSTOMERS'];
    }

    const formatted = Array.isArray(audience) ? audience : [audience];

    return formatted
      .map((v) => v.toString().replace(/['"]/g, '').trim())
      .filter(Boolean);
  }

  static formatDate(date, isStart = true) {
    const dateObj = new Date(date);
    dateObj.setUTCHours(
      isStart ? 0 : 23,
      isStart ? 0 : 59,
      isStart ? 0 : 59,
      isStart ? 0 : 999
    );
    return dateObj.toISOString();
  }

  static validateOfferData(data) {
    const errors = [];

    // Only validate fields that are present in the update
    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case 'title':
          if (value && value.length < 3) {
            errors.push('Title must be at least 3 characters long');
          }
          break;

        case 'description':
          if (value && value.length < 10) {
            errors.push('Description must be at least 10 characters long');
          }
          break;

        case 'type':
          if (
            value &&
            !['DISCOUNT', 'PROMOTION', 'DEAL'].includes(value.toUpperCase())
          ) {
            errors.push('Type must be one of: DISCOUNT, PROMOTION, DEAL');
          }
          break;

        case 'status':
          if (
            value &&
            !['ACTIVE', 'INACTIVE', 'PENDING'].includes(value.toUpperCase())
          ) {
            errors.push('Status must be one of: ACTIVE, INACTIVE, PENDING');
          }
          break;

        case 'targetAudience':
          if (value && !Array.isArray(value)) {
            errors.push('Target audience must be an array');
          }
          break;
      }
    });

    // Only validate dates if either startTime or endTime is being updated
    if (data.startTime || data.endTime) {
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        if (start >= end) {
          errors.push('End time must be after start time');
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  static handleApiError(error) {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: JSON.parse(error.config?.data || '{}'),
      },
    });

    // Handle validation errors from the API
    if (error.response?.status === 400) {
      const apiErrors = error.response.data?.messages || {};
      const errorMessages = Object.entries(apiErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');

      const errorMessage =
        errorMessages || error.response.data?.error || 'Validation failed';
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.requestData = error.config?.data;
      return enhancedError;
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An error occurred';

    const enhancedError = new Error(errorMessage);
    enhancedError.response = error.response;
    enhancedError.requestData = error.config?.data;
    return enhancedError;
  }

  static areArraysEqual(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => item === arr2[index]);
  }
}
