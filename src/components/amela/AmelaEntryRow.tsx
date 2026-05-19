import React from 'react';
import AmelaBookingInfoCard from './AmelaBookingInfoCard';
import AmelaCleaningCard from './AmelaCleaningCard';

interface AmelaEntryRowProps {
  entry: any; // CleaningEntry union from useBookings
  staff: any[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onStaffUpdate: (taskId: string, staffId: string | null) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onTaskNotesUpdate?: (taskId: string, notes: string) => void;
}

const AmelaEntryRow: React.FC<AmelaEntryRowProps> = ({
  entry,
  staff,
  onStatusUpdate,
  onStaffUpdate,
  onDateTimeUpdate,
  onTaskNotesUpdate,
}) => {
  if (entry.type === 'standalone') {
    const task = entry.data;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AmelaCleaningCard
          task={task}
          staff={staff}
          onStatusUpdate={onStatusUpdate}
          onStaffUpdate={onStaffUpdate}
          onDateTimeUpdate={onDateTimeUpdate}
          onNotesUpdate={onTaskNotesUpdate}
        />
      </div>
    );
  }

  const booking = entry.data;
  const tasks = (booking.service_tasks || []).filter(
    (t: any) => t.service_type === 'cleaning' || !t.service_type
  );

  if (tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AmelaBookingInfoCard booking={booking} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task: any) => (
        <div key={task.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AmelaBookingInfoCard booking={booking} />
          <AmelaCleaningCard
            task={task}
            staff={staff}
            onStatusUpdate={onStatusUpdate}
            onStaffUpdate={onStaffUpdate}
            onDateTimeUpdate={onDateTimeUpdate}
            onNotesUpdate={onTaskNotesUpdate}
          />
        </div>
      ))}
    </div>
  );
};

export default AmelaEntryRow;
