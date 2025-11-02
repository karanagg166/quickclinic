import Appointment from '../models/appointmentmodel';

/**
 * Utility function to mark past scheduled appointments as Completed
 * This can be called:
 * 1. Manually via API endpoint: PUT /api/v1/patient/mark-past-appointments-completed
 * 2. Automatically on server start (for non-Vercel environments)
 * 3. Via cron job or scheduled task
 */
export const markPastAppointmentsAsCompleted = async (): Promise<{ updatedCount: number; matchedCount: number }> => {
  try {
    const now = new Date();
    
    // Find all appointments that are Scheduled
    const pastAppointments = await Appointment.find({
      status: 'Scheduled'
    });

    // Filter appointments where date + time <= current date/time
    const appointmentsToUpdate = pastAppointments.filter(appointment => {
      // Combine date and time to create a full datetime
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours, minutes || 0, 0, 0);
      
      // Check if appointment datetime is in the past (<= now)
      return appointmentDate <= now;
    });

    if (appointmentsToUpdate.length === 0) {
      console.log('No past appointments to mark as completed');
      return { updatedCount: 0, matchedCount: 0 };
    }

    // Update all matching appointments to Completed status
    const appointmentIds = appointmentsToUpdate.map(app => app._id);
    const updateResult = await Appointment.updateMany(
      { _id: { $in: appointmentIds } },
      { $set: { status: 'Completed' } }
    );

    console.log(`✅ Marked ${updateResult.modifiedCount} past appointments as Completed`);
    return {
      updatedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    };
  } catch (error) {
    console.error('Error marking past appointments as completed:', error);
    throw error;
  }
};

