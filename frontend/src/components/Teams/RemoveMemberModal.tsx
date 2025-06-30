import React, { useState } from 'react';
import { X, UserMinus, Loader2, AlertTriangle, Crown, Shield, User } from 'lucide-react';
import { toast } from 'react-toastify';
import type { TeamMember } from '../../types';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  teamName: string;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  member, 
  teamName 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${member.teamId}/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove member');
      }

      toast.success(`${member.user.firstName} ${member.user.lastName} removed from ${teamName}`);
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to remove member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-red-600" />;
      case 'MANAGER':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'DEVELOPER':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700';
      case 'DEVELOPER':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserMinus className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Remove Member</h2>
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

          {/* Member Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-medium text-gray-700">
                {member.user.firstName[0]}{member.user.lastName[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {member.user.firstName} {member.user.lastName}
                </h3>
                <p className="text-sm text-gray-600">{member.user.email}</p>
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleBadge(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span>{member.role}</span>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              Are you sure you want to remove <strong>{member.user.firstName} {member.user.lastName}</strong> from <strong>{teamName}</strong>?
            </p>

            {member.role === 'ADMIN' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Warning: Removing Team Admin
                    </h4>
                    <p className="text-sm text-yellow-700">
                      This member is a team admin. Removing them will revoke their administrative privileges.
                      Make sure another admin is available to manage the team.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                This action will:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Remove the member from this team</li>
                <li>• Revoke access to team projects</li>
                <li>• Unassign them from team tasks</li>
                <li>• Remove their team role and permissions</li>
              </ul>
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
              onClick={handleRemove}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Removing...' : 'Remove Member'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
