import React from "react";

export default function Dashboard() {
  // Thay `your-dashboard-id` bằng id dashboard/panel thực tế
  return (
    <div className="w-full h-[80vh]">
      <iframe
        src="http://localhost:3000/d/your-dashboard-id"
        title="Grafana Dashboard"
        className="w-full h-full border rounded shadow"
      ></iframe>
    </div>
  );
}
