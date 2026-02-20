import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DateTimeDisplay() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format: "Selasa, 11 Januari 2024 10:30:45"
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);

  // Split to separate date and time for styling if needed, or just display as is
  // Using replace to change "." to ":" for time separator if browser defaults to dot
  const displayString = formattedDate.replace(/\./g, ':');

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-lg text-sm font-medium text-slate-600 border border-slate-200/50">
      <Clock className="w-4 h-4 text-blue-600" />
      <span>{displayString}</span>
    </div>
  );
}
