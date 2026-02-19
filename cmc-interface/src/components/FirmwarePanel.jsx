import React from 'react';
import { Package, Calendar, Download } from 'lucide-react';

export const FirmwarePanel = ({ firmwareData }) => {
  // Debug logging
  console.log('FirmwarePanel render:', { firmwareData, length: firmwareData?.length });

  if (!firmwareData || firmwareData.length === 0) {
    console.log('FirmwarePanel: No data to display');
    return (
      <div className="p-4 text-center text-base-content/40">
        <p className="text-sm">No firmware history to display</p>
      </div>
    );
  }

  console.log('FirmwarePanel: Displaying', firmwareData.length, 'items');

  // Sort by install date, newest first
  const sortedData = [...firmwareData].sort((a, b) => 
    new Date(b.installDate) - new Date(a.installDate)
  );

  return (
    <div className="p-4">
      <div className="space-y-2">
        {sortedData.map((firmware, idx) => (
          <FirmwareCard key={`${firmware.version}-${firmware.installDate}-${idx}`} firmware={firmware} />
        ))}
      </div>
    </div>
  );
};

const FirmwareCard = ({ firmware }) => {
  console.log('Rendering FirmwareCard:', firmware);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString;
    }
  };

  return (
    <div className="bg-base-300 p-3 rounded-lg">
      <div className="flex items-start gap-3">
        <Package className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-base-content">{firmware.version}</p>
            {firmware.version?.includes('_rc') && (
              <span className="badge badge-warning badge-xs">RC</span>
            )}
            {firmware.version?.includes('modified') && (
              <span className="badge badge-info badge-xs">Modified</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs text-base-content/40">
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3 flex-shrink-0" />
              <span>Packaged: {formatDate(firmware.packageDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>Installed: {formatDate(firmware.installDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};