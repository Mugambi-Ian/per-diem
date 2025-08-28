import { StoreForm } from '@/client/modules/stores/components';
import {StoreService} from "@/lib/modules/stores/service/store.service";
import {OperatingHour} from "@/client/modules/stores/components/DayOperatingHours";

async function getStore(storeId: string) {
  const json = await StoreService.get(storeId);
  const store = json?.data;

  return {
    name: store.name,
    slug: store.slug,
    address: store.address,
    timezone: store.timezone,
    lat: String(store.lat ?? ''),
    lng: String(store.lng ?? ''),
    operatingHours: (store.operatingHours || []).map((h:OperatingHour) => ({
      id: String(h.id),
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isOpen: h.isOpen,
      closesNextDay: h.closesNextDay,
      dstAware: h.dstAware,
    })),
  };
}

// Server component
interface EditStorePageProps {
  params: { id: string };
}

export default async function EditStorePage({ params }: EditStorePageProps) {
    const initialValues = await getStore(params.id);
    return <StoreForm mode="edit" storeId={params.id} initialValues={initialValues} />;
}
