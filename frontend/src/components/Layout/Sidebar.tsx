import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useAppSelector((state) => state.ui);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: Users,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderOpen,
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 ${
      sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          {sidebarOpen && (
            <span className="text-xl font-bold text-gray-900">DevSync</span>
          )}
        </div>

        {sidebarOpen && (
          <button
            onClick={handleToggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${!sidebarOpen && 'justify-center'}`
                }
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse button when sidebar is collapsed */}
      {!sidebarOpen && (
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button
            onClick={handleToggleSidebar}
            className="w-full p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Footer when expanded */}
      {sidebarOpen && (
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <div className="text-xs text-gray-500 text-center">
            DevSync v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
