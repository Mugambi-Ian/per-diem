
import {Store} from "@/lib/modules/stores/schema/store";

export const loadStores = async (limit?: number): Promise<Store[]> => {

    const params = new URLSearchParams();
    if(limit) params.append('limit', limit.toString());

    const response = await fetch(process.env.NEXT_PUBLIC_APP_URI + `/api/v1/stores?${params.toString()}`, {
        credentials: 'include',
    });

    if (response.ok) {
        const data = await response.json();
        return data.data.payload || data.data.stores || []
    }
    return []
};