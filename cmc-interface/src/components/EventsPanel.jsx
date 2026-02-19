import React from 'react';
import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export const EventsPanel = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 text-center text-base-content/40">
        <p className="text-sm">No events to display</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {events.map((event, idx) => (
          <EventCard key={event.id || idx} event={event} />
        ))}
      </div>
    </div>
  );
};

const EventCard = ({ event }) => {
  const getSeverity = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'error':
        return { Icon: XCircle, colorClass: 'text-error', badgeClass: 'badge-error' };
      case 'warning':
        return { Icon: AlertTriangle, colorClass: 'text-warning', badgeClass: 'badge-warning' };
      case 'info':
        return { Icon: Info, colorClass: 'text-info', badgeClass: 'badge-info' };
      default:
        return { Icon: AlertCircle, colorClass: 'text-base-content/50', badgeClass: 'badge-ghost' };
    }
  };

  const { Icon, colorClass, badgeClass } = getSeverity(event.severity);

  return (
    <div className="bg-base-300 p-3 rounded-lg">
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-base-content">{event.message}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-base-content/40">
            <span>{new Date(event.timestamp).toLocaleString()}</span>
            {event.username && <><span>•</span><span>{event.username}</span></>}
            {event.severity && (
              <span className={`badge badge-xs ${badgeClass}`}>
                {event.severity.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};