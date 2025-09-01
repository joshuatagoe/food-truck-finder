import './AnalysisModal.css'
import DetailsGrid from './DetailsGrid';
import type { FoodTruck } from "./types";

export default function AnalysisModal({
  foodTruck,
  onClose,
}: {
  foodTruck: FoodTruck;
  onClose: () => void;
}) {
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{foodTruck.applicant}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <DetailsGrid foodTruck={foodTruck} ></DetailsGrid>
        </div>
      </div>
    </div>
  );
}
