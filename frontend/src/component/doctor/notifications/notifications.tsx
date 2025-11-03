import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../../utils/api';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { Bell, CheckCircle2, Trash2, AlertCircle, Calendar, XCircle, RefreshCw, User } from 'lucide-react';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const DoctorNotificationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await axios.get(api.getUrl(`notifications/${id}`));
        if (response.data.success) {
          setNotifications(response.data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotifications();
    }
  }, [id]);

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.put(api.getUrl(`notification/${notificationId}/mark-read`));
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await axios.delete(api.getUrl(`notification/${notificationId}`));
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(api.getUrl(`notifications/${id}/mark-read`));
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await axios.delete(api.getUrl(`notifications/${id}/delete-all`));
      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_booked':
        return '📅';
      case 'appointment_cancelled':
        return '❌';
      case 'appointment_rescheduled':
        return '🔄';
      case 'profile_updated':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment_booked':
        return 'from-green-500 to-green-600';
      case 'appointment_cancelled':
        return 'from-red-500 to-red-600';
      case 'appointment_rescheduled':
        return 'from-yellow-500 to-yellow-600';
      case 'profile_updated':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading notifications...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6 lg:ml-80">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <Bell className="w-8 h-8 text-neon-400" />
                  Notifications
                </h1>
                <p className="text-center text-white/70">Stay updated with your practice activities</p>
              </div>

              <div className="p-8">
                {/* Action Buttons */}
                {notifications.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <NeonButton
                      onClick={markAllAsRead}
                      variant="outline"
                    >
                      <CheckCircle2 className="mr-2" />
                      Mark All as Read
                    </NeonButton>
                    <NeonButton
                      onClick={deleteAllNotifications}
                      variant="secondary"
                    >
                      <Trash2 className="mr-2" />
                      Delete All
                    </NeonButton>
                  </div>
                )}

                {/* Notifications List */}
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-white/30 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
                    <p className="text-white/70">You're all caught up! New notifications will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification, index) => {
                      const getIcon = () => {
                        switch (notification.type) {
                          case 'appointment_booked':
                            return <Calendar className="w-6 h-6" />;
                          case 'appointment_cancelled':
                            return <XCircle className="w-6 h-6" />;
                          case 'appointment_rescheduled':
                            return <RefreshCw className="w-6 h-6" />;
                          case 'profile_updated':
                            return <User className="w-6 h-6" />;
                          default:
                            return <AlertCircle className="w-6 h-6" />;
                        }
                      };

                      const getColor = () => {
                        switch (notification.type) {
                          case 'appointment_booked':
                            return 'from-green-500/30 to-green-600/30 border-green-400/50 text-green-300';
                          case 'appointment_cancelled':
                            return 'from-red-500/30 to-red-600/30 border-red-400/50 text-red-300';
                          case 'appointment_rescheduled':
                            return 'from-yellow-500/30 to-yellow-600/30 border-yellow-400/50 text-yellow-300';
                          case 'profile_updated':
                            return 'from-cyan-500/30 to-cyan-600/30 border-cyan-400/50 text-cyan-300';
                          default:
                            return 'from-neon-500/30 to-cyan-500/30 border-neon-400/50 text-neon-300';
                        }
                      };

                      return (
                        <motion.div
                          key={notification._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-6 rounded-xl border-2 transition duration-300 backdrop-blur-sm ${
                            notification.isRead 
                              ? 'bg-white/5 border-white/10' 
                              : `bg-gradient-to-r ${getColor()}`
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getNotificationColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                                {getIcon()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-white">{notification.title}</h3>
                                  {!notification.isRead && (
                                    <span className="w-2 h-2 bg-neon-400 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-white/80 mb-2">{notification.message}</p>
                                <p className="text-sm text-white/60">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {!notification.isRead && (
                                <NeonButton
                                  onClick={() => markAsRead(notification._id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </NeonButton>
                              )}
                              <NeonButton
                                onClick={() => deleteNotification(notification._id)}
                                variant="secondary"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </NeonButton>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DoctorNotificationsPage;
