import React, { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAppDispatch } from '../../store';
import { deleteProject } from '../../store/slices/projectsSlice';
import { toast } from 'react-toastify';
import type { Project } from '../../types';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({ isOpen, onClose, project }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmationText !== project.name) {
      setError('Project name does not match');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await dispatch(deleteProject(project.id)).unwrap();
      toast.success(`Project "${project.name}" deleted successfully!`);
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete project';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationText('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const isConfirmationValid = confirmationText === project.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the project <strong>"{project.name}"</strong>?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    This action cannot be undone
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All project data will be permanently deleted</li>
                    <li>• All tasks and comments will be lost</li>
                    <li>• Project members will lose access</li>
                    <li>• Project history will be removed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700">
                Type <strong>{project.name}</strong> to confirm deletion:
              </label>
              <input
                type="text"
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={`Type "${project.name}" here`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || !isConfirmationValid}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Deleting...' : 'Delete Project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
