import React from 'react';
import { Sparkles } from 'lucide-react';
import AmelaBookingInfoCard from './AmelaBookingInfoCard';
import AmelaCleaningCard from './AmelaCleaningCard';

interface AmelaEntryRowProps {
  entry: any;
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
      <AmelaCleaningCard
        task={task}
        staff={staff}
        onStatusUpdate={onStatusUpdate}
        onStaffUpdate={onStaffUpdate}
        onDateTimeUpdate={onDateTimeUpdate}
        onNotesUpdate={onTaskNotesUpdate}
      />
    );
  }

  const booking = entry.data;
  const tasks = (booking.service_tasks || []).filter(
    (t: any) => t.service_type === 'cleaning' || !t.service_type
  );

  if (tasks.length === 0) {
    return <AmelaBookingInfoCard booking={booking} />;
  }

  const isMulti = tasks.length > 1;

  return (
    <div className="border-l-2 border-primary/40 pl-3 space-y-2.5">
      <AmelaBookingInfoCard booking={booking} />
      {isMulti && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{tasks.length} Reinigungsaufträge zu dieser Buchung</span>
        </div>
      )}
      <div className="space-y-2.5">
        {tasks.map((task: any, idx: number) => (
          <AmelaCleaningCard
            key={task.id}
            task={task}
            staff={staff}
            onStatusUpdate={onStatusUpdate}
            onStaffUpdate={onStaffUpdate}
            onDateTimeUpdate={onDateTimeUpdate}
            onNotesUpdate={onTaskNotesUpdate}
            positionLabel={isMulti ? `${idx + 1}/${tasks.length}` : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default AmelaEntryRow;
