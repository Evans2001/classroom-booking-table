'use client';

interface Booking {
  room: string;
  building: string;
  lecturer: string;
}

interface BookingModalProps {
  day: Date;
  time: string;
  bookings: Booking[];
  isLoading: boolean;
  onClose: () => void;
}

export default function BookingModal({ day, time, bookings, isLoading, onClose }: BookingModalProps) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Bookings for {day.toLocaleDateString()}</h3>
          <p>{time}</p>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <p>Loading bookings...</p>
          ) : bookings.length > 0 ? (
            <ul>
              {bookings.map((booking, index) => (
                <li key={index}>
                  <strong>Room:</strong> {booking.room} ({booking.building})<br />
                  <strong>Booked by:</strong> {booking.lecturer}
                </li>
              ))}
            </ul>
          ) : (
            <p>No rooms are booked for this time slot.</p>
          )}
        </div>
      </div>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }
        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          z-index: 100;
          width: 90%;
          max-width: 400px;
        }
        .modal-header {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 10px;
          position: relative;
        }
        .modal-header h3 {
          margin: 0;
        }
        .modal-header p {
          margin: 5px 0 0;
          color: #555;
        }
        .close-button {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #eee;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 20px;
          cursor: pointer;
        }
        .modal-body ul {
          list-style: none;
          padding: 0;
        }
        .modal-body li {
          padding: 10px;
          border-bottom: 1px solid #f0f0f0;
        }
        .modal-body li:last-child {
          border-bottom: none;
        }
      `}</style>
    </>
  );
}