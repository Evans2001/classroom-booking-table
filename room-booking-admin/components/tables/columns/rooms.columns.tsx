import type { DataColumn } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Room } from "@/lib/types/room";
import { ROOM_TYPE_LABELS } from "@/lib/utils/constants";

export const roomsColumns: DataColumn<Room>[] = [
  {
    key: "name",
    header: "Room",
    render: (room) => (
      <div>
        <p className="font-medium text-slate-900">{room.name}</p>
        <p className="text-xs text-slate-500">{room.code}</p>
      </div>
    ),
  },
  {
    key: "location",
    header: "Location",
    render: (room) => `${room.building} / Floor ${room.floor}`,
  },
  {
    key: "type",
    header: "Type",
    render: (room) => ROOM_TYPE_LABELS[room.type],
  },
  {
    key: "capacity",
    header: "Capacity",
    render: (room) => room.capacity,
  },
  {
    key: "status",
    header: "Status",
    render: (room) => <StatusBadge status={room.status} />,
  },
];
