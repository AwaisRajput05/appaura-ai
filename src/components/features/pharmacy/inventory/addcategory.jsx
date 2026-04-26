// AddCategory.jsx — CLEANED WITH INVENTORY CONSTANTS
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { getToken } from '../../../../services/tokenUtils';
import { AuthContext } from '../../../auth/hooks/AuthContextDef';
import apiService from '../../../../services/apiService';
import { apiEndpoints } from '../../../../services/endpoint/inventory/inventoryEnd';
import { INVENTORY_MODULE_CONSTANTS } from './inventoryconstants/inventoryModuleConstants';

// UI Components
import { Package, Loader2, Plus, Edit3, CheckCircle, X, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/forms/Button';
import InputText from '../../../../components/ui/forms/InputText';
import Alert from '../../../../components/ui/feedback/Alert';
import Modal from '../../../../components/ui/Modal';
import Checkbox from '../../../../components/ui/forms/Checkbox';
import DatePicker from '../../../../components/ui/forms/DatePicker';

export default function AddCategory() {
  const { user } = useContext(AuthContext);
  const controllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [generalCategories, setGeneralCategories] = useState([]);
  const [vendorSpecific, setVendorSpecific] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [categoryDate, setCategoryDate] = useState('');

  // USE CONSTANTS
  const { vendorId } = INVENTORY_MODULE_CONSTANTS.getUserInfo(user);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const fetchCategories = async () => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      const endpoint = apiEndpoints.vendorCategories();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId);
      
      const response = await apiService.get(endpoint, {
        headers,
        signal: controllerRef.current.signal,
      });
      
      if (!isMountedRef.current) return;
      
      if (response.data.status === 'success') {
        setGeneralCategories(response.data.data.general_categories || []);
        setVendorSpecific(response.data.data.vendor_specific_categories || []);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setCurrentCategory({
      mode: 'add',
      names: [''],
    });
    setCategoryDate('');
  };

  const openEditModal = (cat) => {
    setCurrentCategory({
      mode: 'edit',
      old_name: cat,
      new_name: cat,
    });
    setCategoryDate('');
  };

  const closeModal = () => {
    setCurrentCategory(null);
    setFormError('');
    setCategoryDate('');
  };

  const handleDelete = async () => {
  // Validate max 5 items can be deleted at once
  if (selectedForDelete.length > 5) {
    setError('You can only delete up to 5 categories at a time. Please select fewer items.');
    setDeleteConfirm(false);
    return;
  }

  if (selectedForDelete.length === 0) {
    setError('Please select categories to delete.');
    setDeleteConfirm(false);
    return;
  }

  if (controllerRef.current) controllerRef.current.abort();
  controllerRef.current = new AbortController();
  
  setDeleteConfirm(false);
  setLoading(true);
  
  try {
    const token = getToken();
    
    // Encode each category name properly for URL
    const encodedCategoryNames = selectedForDelete
      .map(name => encodeURIComponent(name))
      .join(',');
    
    // Build URL with query parameter
    const endpoint = `${apiEndpoints.removeVendorCategories()}?categoryNames=${encodedCategoryNames}`;
    
    const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId);
    
    // Use DELETE with query params - no body needed
    const response = await apiService.delete(endpoint, {
      headers,
      signal: controllerRef.current.signal,
      // No data/body field needed as we're using query params
    });
    
    if (!isMountedRef.current) return;
    
    if (response.data.status === 'success') {
      INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccess, "Categories deleted successfully!");
      fetchCategories();
      setSelectedForDelete([]);
    } else {
      setError(response.data.message || 'Failed to delete categories');
    }
  } catch (err) {
    if (!isMountedRef.current) return;
    if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
    
    // Check if error is about too many items (backend might have its own validation)
    if (err.response?.status === 400 && err.response?.data?.message?.includes('5 categories')) {
      setError('Maximum 5 categories can be deleted at once. Please select fewer items.');
    } else {
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    }
  } finally {
    if (isMountedRef.current) {
      setLoading(false);
    }
  }
};
 

  const handleSave = async () => {
    if (!currentCategory) return;
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    
    setFormError('');
    setLoading(true);
    
    try {
      const token = getToken();
      const headers = INVENTORY_MODULE_CONSTANTS.getAuthHeaders(token, vendorId);
      
      if (currentCategory.mode === 'add') {
        const names = currentCategory.names.map(n => n?.trim()).filter(n => n);
        if (names.length === 0) {
          setFormError('At least one category name is required!');
          setLoading(false);
          return;
        }

        const payload = {
          vendor_id: vendorId,
          category_names: names,
          ...(categoryDate && { effective_date: categoryDate }),
        };
        
        const response = await apiService.post(
          apiEndpoints.addVendorCategories(), 
          payload, 
          { headers, signal: controllerRef.current.signal }
        );
        
        if (!isMountedRef.current) return;
        
        if (response.data.status === 'success') {
          if (response.data.data.total_added > 0) {
            INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccess, "Categories added successfully!");
            fetchCategories();
            closeModal();
          } else {
            INVENTORY_MODULE_CONSTANTS.showError(setError, response.data.message || 'No new categories added');
            closeModal();
          }
        } else {
          setError(response.data.message || 'Failed to add categories');
        }
      } else if (currentCategory.mode === 'edit') {
        const newName = currentCategory.new_name?.trim();
        if (!newName || newName === currentCategory.old_name) {
          setFormError('New name is required and must be different!');
          setLoading(false);
          return;
        }

        const payload = {
          vendor_id: vendorId,
          old_name: currentCategory.old_name,
          new_name: newName,
          ...(categoryDate && { effective_date: categoryDate }),
        };
        
        const response = await apiService.patch(
          apiEndpoints.editVendorCategoryName(), 
          payload, 
          { headers, signal: controllerRef.current.signal }
        );
        
        if (!isMountedRef.current) return;
        
        if (response.data.status === 'success') {
          INVENTORY_MODULE_CONSTANTS.showSuccess(setSuccess, "Category updated successfully!");
          fetchCategories();
          closeModal();
        } else {
          setError(response.data.message || 'Failed to edit category');
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (INVENTORY_MODULE_CONSTANTS.isAbortError(err)) return;
      setError(INVENTORY_MODULE_CONSTANTS.getErrorMessage(err));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const LoadingSkeleton = useMemo(() => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Package className="w-10 h-10 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Manage Categories</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">View Global & Custom Categories | Add or Edit via Popup</p>
          
          {loading && !currentCategory && !deleteConfirm && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading categories...
            </div>
          )}
        </div>

        {error && <Alert variant="error" message={error} className="mb-5" />}
        {success && <Alert variant="success" message={success} icon={<CheckCircle className="w-5 h-5" />} className="mb-5" />}

        {/* Main Content */}
        {loading && !currentCategory && !deleteConfirm ? (
          LoadingSkeleton
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Categories Card */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Global Categories</h3>
                <span className="text-xs text-gray-500">
                  {generalCategories.length} categories
                </span>
              </div>
              {generalCategories.length === 0 ? (
                <div className="text-center py-4 text-gray-600">No global categories available</div>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {generalCategories.map((cat, i) => (
                    <li key={i} className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Custom Categories Card */}
            <div className="bg-white rounded-xl shadow-md p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Your Custom Categories</h3>
                  <p className="text-xs text-gray-500">
                    {vendorSpecific.length} custom categories
                  </p>
                </div>
                <Button
                  onClick={openAddModal}
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add New
                </Button>
              </div>
              {vendorSpecific.length === 0 ? (
                <div className="text-center py-4 text-gray-600">No custom categories yet</div>
              ) : (
                <>
                  <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {vendorSpecific.map((cat, i) => (
                      <li key={i} className="flex items-center px-4 py-2 bg-blue-50 rounded-lg text-blue-900">
                        <Checkbox
                          checked={selectedForDelete.includes(cat)}
                          onChange={() => setSelectedForDelete(prev => 
                            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                          )}
                          className="mr-2"
                          id={`cat-${i}`}
                        />
                        <label htmlFor={`cat-${i}`} className="flex-1 cursor-pointer flex items-center">
                          <Package className="w-4 h-4 mr-2 text-blue-400" />
                          {cat}
                        </label>
                        <button 
                          onClick={() => openEditModal(cat)} 
                          className="ml-auto text-blue-600 hover:text-blue-800"
                          title="Edit category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  {selectedForDelete.length > 0 && (
                    <Button
                      onClick={() => setDeleteConfirm(true)}
                      variant="danger"
                      size="md"
                      className="mt-4 flex items-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Delete Selected ({selectedForDelete.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Category Modal */}
        <Modal
          isOpen={!!currentCategory}
          onClose={closeModal}
          title={
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> 
              {currentCategory?.mode === 'add' ? 'Add New Categories' : `Edit ${currentCategory?.old_name}`}
            </div>
          }
          size="md"
        >
          {formError && <Alert variant="error" message={formError} className="mb-5" />}

          <div className="space-y-4">
            {currentCategory?.mode === 'add' ? (
              <>
                {currentCategory.names.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
               <InputText
  label={`Category Name ${index + 1}`}
  name={`category-name-${index}`}
  value={name}
  onChange={(e) => {
    // Only allow letters, numbers, spaces, hyphens, and underscores
    let value = e.target.value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    const newNames = [...currentCategory.names];
    newNames[index] = value;
    setCurrentCategory(prev => ({ ...prev, names: newNames }));
  }}
  maxLength={50}
  placeholder="e.g. Custom-Aid_01"
  className="flex-1"
  required
/>
                    {currentCategory.names.length > 1 && (
                      <button 
                        onClick={() => {
                          const newNames = currentCategory.names.filter((_, i) => i !== index);
                          setCurrentCategory(prev => ({ 
                            ...prev, 
                            names: newNames.length > 0 ? newNames : [''] 
                          }));
                        }} 
                        className="text-red-600 hover:text-red-800 mt-6"
                        type="button"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setCurrentCategory(prev => ({ ...prev, names: [...prev.names, ''] }))} 
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  type="button"
                >
                  <Plus className="w-4 h-4" /> Add More
                </button>
              </>
            ) : (
              <>
                <InputText
                  label="Old Name"
                  name="old-name"
                  value={currentCategory?.old_name || ''}
                  readOnly
                  className="bg-gray-50"
                />
             <InputText
  label="New Name"
  name="new-name"
  value={currentCategory?.new_name || ''}
  onChange={(e) => {
    let value = e.target.value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    setCurrentCategory(prev => ({ ...prev, new_name: value }));
  }}
  maxLength={50}
  placeholder="Enter new category name "
  required
/>
              </>
            )}

          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              onClick={closeModal}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={loading}
              loadingText="Saving..."
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              {currentCategory?.mode === 'add' ? 'Add Categories' : 'Save Changes'}
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          title={
            <div className="flex items-center gap-2 text-red-900">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </div>
          }
          size="sm"
        >
          <p className="text-sm text-gray-700 mb-4">
            Are you sure you want to delete the following categories? This action cannot be undone.
          </p>
          <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg">
            {selectedForDelete.map((cat, i) => (
              <li key={i} className="text-sm text-gray-800 flex items-center">
                <X className="w-4 h-4 text-red-500 mr-2" />
                {cat}
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setDeleteConfirm(false)}
              variant="secondary"
              size="md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              loading={loading}
              loadingText="Deleting..."
              variant="danger"
              size="md"
              className="flex items-center gap-2"
            >
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}