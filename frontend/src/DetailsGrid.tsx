import React from "react";
import './DetailsGrid.css';
import type { FoodTruck } from "./types";

export default function DetailsGrid({ foodTruck }: { foodTruck: FoodTruck }) {
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : "—";
  const openMap = () => {
    const url = foodTruck.latitude && foodTruck.longitude
      ? `https://www.google.com/maps?q=${foodTruck.latitude},${foodTruck.longitude}`
      : foodTruck.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(foodTruck.address)}`
        : "";
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const copy = async (text?: string) => text && navigator.clipboard?.writeText(text);
  console.log(foodTruck);

  const rows: Array<[label: string, value: React.ReactNode]> = [
    ["Applicant", foodTruck.applicant],
    ["Facility Type", foodTruck.facilityType ?? "—"],
    ["Status", foodTruck.status ? <span className={`badge ${foodTruck.status?.toLowerCase()}`}>{foodTruck.status}</span> : "—"],
    ["Location", foodTruck.locationDescription ?? "—"],
    ["Address", foodTruck.address ?? "—"],
    ["Food Items", foodTruck.foodItems ?? "—"],
    ["Permit #", foodTruck.permit ?? "—"],
    ["Location ID", foodTruck.locationId?.toString() ?? "—"],
    ["Coordinates", (foodTruck.latitude && foodTruck.longitude) ? `${foodTruck.latitude.toFixed(6)}, ${foodTruck.longitude.toFixed(6)}` : "—"],
    ["Approved", fmtDate(foodTruck.approved)],
    ["Received", fmtDate(foodTruck.received)],
    ["Expires", fmtDate(foodTruck.expirationDate)],
    ["Schedule", foodTruck.schedule ? <a href={foodTruck.schedule} target="_blank" rel="noreferrer">Open schedule</a> : "—"],
  ];

  return (
    <div className="details">
      <div className="details-actions">
        <button onClick={() => copy(foodTruck.locationDescription)} className="btn-secondary">Copy Address</button>
        <button onClick={openMap} className="btn-primary">Open in Maps</button>
      </div>

      <div className="kv-grid">
        {rows.map(([k, v]) => (
          <div key={k} className="kv-row">
            <div className="kv-key">{k}</div>
            <div className="kv-val">{v}</div>
          </div>
        ))}
      </div>

      {(foodTruck.latitude && foodTruck.longitude) && (
        <div className="map-preview">
          <iframe
            title="map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${foodTruck.latitude},${foodTruck.longitude}&z=15&output=embed`}
          />
        </div>
      )}
    </div>
  );
}
