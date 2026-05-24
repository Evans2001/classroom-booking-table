'use client';

import { useState, useEffect, useMemo } from 'react';
import BookingModal from './BookingModal';

// Define the structure for a time slot and a booking
interface TimeSlot {
  start: Date;
  label: string;
}

interface Booking {
  room: string;
  building: string;
  lecturer: string;
}

// Mock function to fetch bookings. Replace this with your actual API call.
const fetchBookingsForSlot = async (day: Date, time: Date): Promise<Booking[]> => {
  console.log(`Fetching bookings for: ${day.toDateString()} at ${time.toLocaleTimeString()}`);
  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return mock data. In a real app, you would fetch this from your backend.
  // Example: GET /api/bookings?date=${day.toISOString()}&time=${time.toISOString()}
  if (day.getDate() % 2 === 0 && time.getHours() % 2 === 0) {
    return [
      { room: 'CL-101', building: 'Computing', lecturer: 'Dr. Smith' },
      { room: 'EL-Auditorium', building: 'Engineering', lecturer: 'Prof. Jones' },
    ];
  }
  return [];
};


export default function CalendarView() {
  const [startDate, setStartDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; time: TimeSlot } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Generate time slots from 8:30 AM to 9:30 PM (for the 9:30-10:30 slot)
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    const date = new Date();
    for (let hour = 8; hour <= 21; hour++) {
      date.setHours(hour, 30, 0, 0);
      slots.push({
        start: new Date(date),
        label: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      });
    }
    return slots;
  }, []);

  // Update the 7-day view when the start date changes
  const days = useMemo(() => {
    const getNext7Days = (start: Date): Date[] => {
      const result: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const nextDay = new Date(start);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(start.getDate() + i);
        result.push(nextDay);
      }
      return result;
    };
    return getNext7Days(startDate);
  }, [startDate]);

  // Effect to automatically refresh to the current day after midnight
  useEffect(() => {
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const msUntilMidnight = endOfToday.getTime() - today.getTime();

    const timeoutId = setTimeout(() => {
      setStartDate(new Date()); // Reset to the new day
    }, msUntilMidnight + 1);

    return () => clearTimeout(timeoutId);
  }, [days]); // Reruns when the days array changes

  // --- Handlers ---
  const handleNextThreeDays = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() + 3);
    setStartDate(newStartDate);
  };

  const handlePrevThreeDays = () => {
    const newStartDate = new Date(startDate);
    newStartDate.setDate(startDate.getDate() - 3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Prevent scrolling to before today
    setStartDate(newStartDate < today ? today : newStartDate);
  };

  const handleSlotClick = async (day: Date, time: TimeSlot) => {
    setSelectedSlot({ day, time });
    setIsLoadingBookings(true);
    const fetchedBookings = await fetchBookingsForSlot(day, time.start);
    setBookings(fetchedBookings);
    setIsLoadingBookings(false);
  };

  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="calendar-container">
      <div className="calendar-controls">
        <button onClick={handlePrevThreeDays} disabled={isToday(startDate)}>Prev</button>
        <button onClick={handleNextThreeDays}>Next</button>
      </div>
      <div className="calendar-scroll-area">
        <div className="calendar-grid">
          {/* Time column */}
          <div className="time-column">
            <div className="header-cell">Time</div>
            {timeSlots.map((time) => (
              <div key={time.label} className="time-cell">{time.label}</div>
            ))}
          </div>

          {/* Day columns */}
          <div className="days-container">
            <div className="days-header">
              {days.map((day) => (
                <div key={day.toISOString()} className={`header-cell day-header-cell ${isToday(day) ? 'today' : ''}`}>
                  <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div>{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
            <div className="days-body">
              {days.map((day) => (
                <div key={day.toISOString()} className="day-column">
                  {timeSlots.map((time) => (
                    <div
                      key={time.label}
                      className="slot-cell"
                      onClick={() => handleSlotClick(day, time)}
                    >
                      {/* You can display info inside the cell here if needed */}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <BookingModal
          day={selectedSlot.day}
          time={selectedSlot.time.label}
          bookings={bookings}
          isLoading={isLoadingBookings}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      <style jsx>{`
        .calendar-container {
          display: flex;
          flex-direction: column;
          height: 80vh; /* Adjust height as needed */
          font-family: sans-serif;
          background-color: #f9f9f9;
        }
        .calendar-controls {
          padding: 10px;
          display: flex;
          justify-content: center;
          gap: 10px;
          border-bottom: 1px solid #ddd;
        }
        .calendar-controls button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          background-color: white;
          border-radius: 5px;
          cursor: pointer;
        }
        .calendar-controls button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .calendar-scroll-area {
          flex-grow: 1;
          overflow: auto; /* Allows both vertical and horizontal scroll */
        }
        .calendar-grid {
          display: flex;
        }
        .time-column {
          position: sticky;
          left: 0;
          z-index: 10;
          background-color: #f0f0f0;
        }
        .header-cell, .time-cell, .slot-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #eee;
          border-right: 1px solid #eee;
        }
        .header-cell {
          height: 60px;
          font-weight: bold;
          background-color: #f0f0f0;
          flex-direction: column;
        }
        .day-header-cell.today {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        .time-cell, .slot-cell {
          height: 50px;
        }
        .time-cell {
          width: 100px;
          font-size: 12px;
        }
        .days-container {
          display: flex;
          flex-direction: column;
        }
        .days-header, .days-body {
          display: flex;
        }
        .day-column, .day-header-cell {
          min-width: 120px; /* Adjust width of day columns */
          flex: 1;
        }
        .slot-cell {
          cursor: pointer;
          background-color: #fff;
          transition: background-color 0.2s;
        }
        .slot-cell:hover {
          background-color: #eef7ff;
        }
      `}</style>
    </div>
  );
}