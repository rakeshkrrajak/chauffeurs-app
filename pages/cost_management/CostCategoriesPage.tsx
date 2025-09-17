import React, { useState } from 'react';
import { CostCategory } from '../../types';
import Modal from '../../components/Modal';
import { TagIcon } from '../../constants';

interface CostCategoriesPageProps {
  categories: CostCategory[];
  addCategory: (category: Omit<CostCategory, 'id' | 'isSystemDefined'>) => void;
  updateCategory: (category: CostCategory) => void;
  deleteCategory: (categoryId: string) => void;
}

const initialCategoryFormState: Omit<CostCategory, 'id' | 'isSystemDefined'> = {
  name: '',
  description: '',
};

// Common dark theme styles
const inputFieldStyle = "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm rounded-lg p-2.5";
const labelStyle = "block text-sm font-medium text-gray-300 mb-1";
const buttonPrimaryStyle = "px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-md transition-colors";
const buttonSecondaryStyle = "px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg shadow-sm transition-colors";

interface CategoryFormProps {
  onSubmit: (category: Omit<CostCategory, 'id' | 'isSystemDefined'>) => void;
  onCancel: () => void;
  initialData?: CostCategory | null;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Omit<CostCategory, 'id' | 'isSystemDefined'>>(
    initialData ? { name: initialData.name, description: initialData.description || '' } : initialCategoryFormState
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Category name cannot be empty.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelStyle}>Category Name *</label>
        <input 
          type="text" 
          name="name" 
          id="name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          className={`${inputFieldStyle} mt-1`}
        />
      </div>
      <div>
        <label htmlFor="description" className={labelStyle}>Description</label>
        <textarea 
          name="description" 
          id="description" 
          value={formData.description || ''} 
          onChange={handleChange} 
          rows={3} 
          className={`${inputFieldStyle} mt-1`}
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className={buttonSecondaryStyle}>Cancel</button>
        <button type="submit" className={buttonPrimaryStyle}>
          {initialData ? 'Update Category' : 'Add Category'}
        </button>
      </div>
    </form>
  );
};

const CostCategoriesPage: React.FC<CostCategoriesPageProps> = ({ categories, addCategory, updateCategory, deleteCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CostCategory | null>(null);

  const openAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CostCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleFormSubmit = (categoryData: Omit<CostCategory, 'id' | 'isSystemDefined'>) => {
    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryData });
    } else {
      addCategory(categoryData);
    }
    closeModal();
  };

  const handleDeleteCategory = (category: CostCategory) => {
    if (category.isSystemDefined) {
        alert("System-defined categories cannot be deleted.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      deleteCategory(category.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-100 flex items-center">
            <TagIcon className="w-8 h-8 mr-3 text-primary-400"/>Cost Categories
        </h1>
        <button
          onClick={openAddModal}
          className={`${buttonPrimaryStyle} flex items-center`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
          Add New Category
        </button>
      </div>
      <p className="text-sm text-gray-400 -mt-4 mb-6">Manage expense categories for your fleet. (Admin Functionality)</p>

      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-100">{category.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-normal max-w-md">
                  <div className="text-sm text-gray-400">{category.description || '-'}</div>
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    category.isSystemDefined ? 'bg-cyan-800 bg-opacity-70 text-cyan-200' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {category.isSystemDefined ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    onClick={() => openEditModal(category)} 
                    className="text-indigo-400 hover:text-indigo-300"
                    disabled={category.isSystemDefined && category.name === 'Fuel'}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category)} 
                    className={` ${category.isSystemDefined ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:text-red-300'}`}
                    disabled={category.isSystemDefined}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No cost categories defined yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCategory ? 'Edit Cost Category' : 'Add New Cost Category'} size="md">
        <CategoryForm
          onSubmit={handleFormSubmit}
          onCancel={closeModal}
          initialData={editingCategory}
        />
      </Modal>
    </div>
  );
};

export default CostCategoriesPage;