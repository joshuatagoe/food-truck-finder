import React, { useEffect, useState } from 'react';
import { type Query, fetchFoodTruckData } from './services/fetchData';
import debounce from './services/debounce';
import './AutoComplete.css';
import type { FoodTruck } from './types';
import AnalysisModal from './AnalysisModal';
import LoadingSpinner from './LoadingSpinner';

interface AutoCompleteProps {
  useCache?: boolean;
  useDebounce?: boolean;
  debounceDuration?: number; // Debounce duration in milliseconds
  minSearchLength?: number;    // Minimum characters to trigger search
  cacheInvalidationTimer?: number; // Time to invalidate cache
}

type Status = 'APPROVED' | 'SUSPEND' | 'EXPIRED' | 'REQUESTED' | 'ISSUED';

function isStatus(value: string): value is Status {
  return ['APPROVED', 'SUSPEND', 'EXPIRED', 'REQUESTED', 'ISSUED'].includes(value);
}

function AutoComplete({
  useCache = true,
  useDebounce = true,
  debounceDuration = 2000,
  minSearchLength = 3,
  cacheInvalidationTimer = 60000
}: AutoCompleteProps) {

  const [truckName, setTruckName] = useState('');
  const [streetName, setStreetName] = useState('');
  const [status, setStatus] = useState<Status>('APPROVED');
  const [limit, setLimit] = useState('5');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [nearMe, setNearMe] = useState(false);
  const [data, setData] = useState<FoodTruck[]>([]);
  const [selected, setSelected] = useState<FoodTruck | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use debounced fetch function if debounce is enabled
  const fetchFoodTruckFunction = useDebounce ? debounce(fetchFoodTruckData, debounceDuration) : fetchFoodTruckData;

  useEffect(() => {
    if (!nearMe) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
      },
      (err) => {
        alert(err.message || "Unable to fetch location");
        setNearMe(false);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [nearMe]);

  useEffect(() => {
    runQuery();
  }, [truckName, streetName, status, limit, nearMe]);

  useEffect(() => {
    if (selected) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const runQuery = () => {
    // Fetch FoodTruck data only if the input length meets the minimum requirement
    if (truckName.length >= minSearchLength || streetName.length >= minSearchLength) {
      const query: Query = {
        applicantName: truckName,
        streetName: streetName,
        status: status,
        limit: Number(limit),
        useCache: useCache,
        ttl: cacheInvalidationTimer,
      };
      if (nearMe && latitude.length > 0 && longitude.length > 0) {
        query.latitude = latitude;
        query.longitude = longitude;
      }

      setIsLoading(true);
      fetchFoodTruckFunction(query)
        .then((foodTruckData) => setData(foodTruckData))
        .catch((error: Error) => console.error('Error fetching food truck data:', error))
        .finally(() => setIsLoading(false));
    } else {
      setData([]); // Clear previous results if input is too short
    }
  }

  const optionClick = (foodTruck: FoodTruck) => {
    setSelected(foodTruck); // Set selected food truck
  }

  const modalClose = () => {
    setSelected(null);
  }

  return (
    <div className='search'>
      <div className="autoSearch">
        <form role="search">
          <label htmlFor="status">Search Status</label>
          <select
            id="status"
            value={status}
            className='status'
            onChange={(e) => {
              if (isStatus(e.target.value)) {
                setStatus(e.target.value)
              }
            }}
          >
            <option value="APPROVED">APPROVED</option>
            <option value="SUSPEND">SUSPEND</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="ISSUED">ISSUED</option>
          </select>
          <label htmlFor='nearMe'>Check here to sort by closest to you</label>
          <input className="check" type="checkbox" checked={nearMe} onChange={(e) => setNearMe(e.target.checked)} id="nearMe" name="nearMe" />
          <label htmlFor='streetName'>Search Street:</label>
          <input
            disabled={!!selected} // Disable input if a food truck is selected
            value={streetName}
            onChange={(e) => setStreetName(e.target.value)}
            className={`searchBar ${data.length > 0 || selected ? 'optionsBorder' : ''}`}
            type='search'
            id="streetName"
            placeholder="Where are you looking?"
          ></input>
          <input
            disabled={!!selected} // Disable input if a food truck is selected
            value={truckName}
            onChange={(e) => setTruckName(e.target.value)}
            className={`searchBar ${data.length > 0 || selected ? 'optionsBorder' : ''}`}
            type='search'
            placeholder="Find your favourite Food Truck!"
          />
          <label htmlFor="limit">Choose a number:</label>
          <input
            type="number" id="limit" name="limit" min="1" max="50" value={limit} onChange={(e) => setLimit(e.target.value)}
            onBlur={() => {
              let value = limit;
              if (value.length > 1) {
                value = value.replace(/^0+/, "");
              }
              let num = Number(value)
              if (isNaN(num)) num = 1;
              if (num > 50) num = 50;
              if (num < 1) num = 1;
              setLimit(String(num));
            }}
          />
        </form>
      </div>
      {isLoading ? <LoadingSpinner></LoadingSpinner> : data.length > 0 && (
        <div className="options-list">
          {data.map((foodTruck) => (
            <SearchOption key={foodTruck.locationId} filterApplicant={truckName.toLowerCase()} filterStreet={streetName.toLowerCase()} onClick={optionClick} foodTruck={foodTruck} />
          ))}
        </div>
      )}
      {selected && <AnalysisModal foodTruck={selected} onClose={modalClose}></AnalysisModal>}
    </div>
  );
}

type SearchOptionProps = {
  foodTruck: FoodTruck,
  onClick: (foodTruck: FoodTruck) => void;
  filterApplicant: string,
  filterStreet: string,
}

function SearchOption({ foodTruck, onClick, filterApplicant, filterStreet }: SearchOptionProps) {
  const applicantName = foodTruck.applicant.toLowerCase();
  const streetName = foodTruck.address.toLowerCase();
  const startApplicant = applicantName.indexOf(filterApplicant);
  const endApplicant = startApplicant + filterApplicant.length;
  const startStreet = streetName.indexOf(filterStreet);
  const endStreet = startStreet + filterStreet.length;

  return (
    <div className="option-card" onClick={() => onClick(foodTruck)}>
      <div className="option-title"><HighlightedText name={foodTruck.applicant} start={startApplicant} end={endApplicant} /></div>
      <div className='option-location'><HighlightedText name={foodTruck.address} start={startStreet} end={endStreet} /></div>
      <div className='option-description'>{foodTruck.foodItems}</div>
    </div>
  );
}

type HighlightedTextProps = {
  name: string | null,
  start: number,
  end: number,
}

function HighlightedText({ name, start, end }: HighlightedTextProps) {
  return (
    name && (
      <>
        {name.split('').map((letter, idx) =>
          idx >= start && idx < end ? (
            <span key={idx} className="highlight">{letter}</span>
          ) : (
            <React.Fragment key={idx}>{letter}</React.Fragment>
          )
        )}
      </>
    )
  );
}

export default AutoComplete;