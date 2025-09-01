import { getItem, setItem } from "./storageWithExpiry";
import { type FoodTruck, type SearchParams } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export type Query = SearchParams & {
    useCache: boolean;
    ttl: number;
};

export const fetchFoodTruckData = async (query: Query): Promise<FoodTruck[]> => {
    const { applicantName, streetName, status, limit, useCache, ttl } = query;
    const latitude = query?.latitude;
    const longitude = query?.longitude;
    const key = JSON.stringify(query);

    // Try to retrieve cached data if caching is enabled
    const cachedData = useCache ? getItem<FoodTruck[]>(key) : null;

    if (!cachedData) {
        // Fetch the data from the server if no cache exists
        const params = new URLSearchParams({
            applicantName,
            streetName,
            status,
            limit: String(limit),
        });

        if (latitude !== undefined) params.set("latitude", String(latitude));
        if (longitude !== undefined) params.set("longitude", String(longitude));

        const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response}`);
        }

        const foodTrucks: FoodTruck[] = await response.json();
        // Cache the result if caching is enabled
        if (useCache) {
            setItem(key, foodTrucks, ttl);
        }

        return foodTrucks;
    }

    // Return cached data
    return cachedData;
};
