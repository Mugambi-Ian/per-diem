import HomePageView from "@/client/modules/stores/pages/HomePageView";
import {loadStores} from "@/client/modules/stores/services/store.service";

export default async function HomePage() {
    const stores = await loadStores(3);

    return (
        <HomePageView stores={stores}/>
    );
}