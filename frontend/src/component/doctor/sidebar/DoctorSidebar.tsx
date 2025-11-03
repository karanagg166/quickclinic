import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dashboard as DashboardIcon,
  CalendarToday as AppointmentsIcon,
  Schedule as ScheduleIcon,
  AttachMoney as EarningsIcon,
  EventBusy as LeaveIcon,
  Person as ProfileIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  People as PatientsIcon,
  Assessment as ReportsIcon,
  MedicalServices as ProfessionalInfoIcon,
  AccountCircle as UserInfoIcon,
  X as CloseIcon
} from '@mui/icons-material';

interface DoctorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { id: urlId } = useParams<{ id: string }>();
  const data = localStorage.getItem('authState');
  const fetchdata = data ? JSON.parse(data) : null;
  // Always prioritize localStorage first, then URL params as fallback
  const id = fetchdata?.user?._id || urlId;

  // Don't render menu items if ID is not available
  if (!id) {
    return (
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 h-full flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const menuItems = [
    {
      icon: <DashboardIcon />,
      label: 'Dashboard',
      path: `/doctor/dashboard/${id}`,
      description: 'Overview of your practice'
    },
    {
      icon: <AppointmentsIcon />,
      label: 'Appointments',
      path: `/doctor/dashboard/${id}/appointments`,
      description: 'Manage patient appointments'
    },
    {
      icon: <ScheduleIcon />,
      label: 'Schedule',
      path: `/doctor/dashboard/${id}/schedule`,
      description: 'Set your availability'
    },
    {
      icon: <PatientsIcon />,
      label: 'Patients',
      path: `/doctor/dashboard/${id}/patients`,
      description: 'View patient information'
    },
    {
      icon: <EarningsIcon />,
      label: 'Earnings',
      path: `/doctor/dashboard/${id}/earnings`,
      description: 'Track your income'
    },
    {
      icon: <LeaveIcon />,
      label: 'Leave Management',
      path: `/doctor/dashboard/${id}/leave`,
      description: 'Apply for time off'
    },
    {
      icon: <ChatIcon />,
      label: 'Messages',
      path: `/user/${id}/chats`,
      description: 'Chat with patients'
    },
    {
      icon: <ReportsIcon />,
      label: 'Reports',
      path: `/doctor/dashboard/${id}/reports`,
      description: 'View analytics'
    },
    {
      icon: <UserInfoIcon />,
      label: 'User Info',
      path: `/user/${id}/info`,
      description: 'View and update personal info'
    },
    {
      icon: <ProfessionalInfoIcon />,
      label: 'Professional Info',
      path: `/doctor/${id}/professional_info`,
      description: 'View and update professional details'
    },
    {
      icon: <ProfileIcon />,
      label: 'Update Professional',
      path: `/doctor/${id}/update_doctor`,
      description: 'Update specialization and fees'
    },
    {
      icon: <NotificationsIcon />,
      label: 'Notifications',
      path: `/doctor/dashboard/${id}/notifications`,
      description: 'View all notifications'
    },
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      path: '#',
      description: 'Account preferences'
    },
    {
      icon: <HelpIcon />,
      label: 'Help & Support',
      path: '/user/about',
      description: 'Get assistance'
    }
  ];

  const isActive = (path: string) => {
    if (path === '#') return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[85] lg:hidden"
            onClick={onClose}
          />
        </motion.div>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/10 backdrop-blur-md border-r border-white/20 shadow-2xl z-[90] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 h-full flex flex-col pt-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
              <span className="mr-2">👨‍⚕️</span>
              Doctor Portal
            </h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition duration-300 text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* User Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-neon-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                Dr. {fetchdata?.user?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="font-semibold text-white">Dr. {fetchdata?.user?.name}</h3>
                <p className="text-sm text-white/70">{fetchdata?.user?.email}</p>
                <p className="text-xs text-neon-400 font-medium">Verified Doctor</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      if (item.path === '#') {
                        // Handle special cases like notifications
                        return;
                      }
                      onClose();
                    }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-neon-500/30 to-cyan-500/30 text-white shadow-lg border border-neon-400/50'
                        : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className={`text-xl ${isActive(item.path) ? 'text-neon-400' : 'text-white/60 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs opacity-60 mt-1 text-white/60">{item.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-xs text-white/50">
                QuickClinic Doctor Portal v1.0
              </p>
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </>
  );
};

export default DoctorSidebar;
