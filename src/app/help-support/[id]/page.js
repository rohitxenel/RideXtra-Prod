"use client";
import { useParams } from "next/navigation";

// Reuse same dummy data here too
const userTickets = Array.from({ length: 20 }, (_, i) => ({
  id: `U${i + 1}`,
  date: "2025-01-01",
  time: "10:30 AM",
  driverName: `Driver ${i + 1}`,
  driverPhone: `99999${i}00`,
  pickup: `Pickup ${i + 1}`,
  drop: `Drop ${i + 1}`,
  totalFare: (100 + i * 5).toFixed(2),
  paymentType: i % 2 === 0 ? "CASH" : "CARD",
  cancelBy: i % 3 === 0 ? "User" : "Driver",
  rideType: i % 2 === 0 ? "Now" : "Schedule",
  bookingType: "Ride",
  reviewComment: "Smooth ride",
  review: (Math.random() * 5).toFixed(1),
  status: i % 2 === 0 ? "Completed" : "Pending",
}));

const driverTickets = Array.from({ length: 20 }, (_, i) => ({
  id: `D${i + 1}`,
  date: "2025-01-05",
  time: "2:15 PM",
  userName: `User ${i + 1}`,
  userPhone: `88888${i}11`,
  pickup: `Pickup ${i + 1}`,
  drop: `Drop ${i + 1}`,
  totalFare: (150 + i * 7).toFixed(2),
  paymentType: i % 2 === 0 ? "CASH" : "CARD",
  issue: i % 2 === 0 ? "Late pickup" : "Route issue",
  status: i % 2 === 0 ? "Open" : "Closed",
}));

export default function TicketDetails() {
  const { id } = useParams();
  const ticket =
    userTickets.find((t) => t.id === id) ||
    driverTickets.find((t) => t.id === id);

  if (!ticket) return <div className="p-6">Ticket not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Ticket Details</h1>
        {Object.entries(ticket).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between py-1 border-b last:border-none"
          >
            <span className="font-medium capitalize">{key}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
