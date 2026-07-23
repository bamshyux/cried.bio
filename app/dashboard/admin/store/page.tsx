import { AdminPageHeader } from "@/components/admin/admin-ui";
import { StoreAdminPanel } from "@/components/admin/store-admin-panel";
import { getAllBadgesCatalog } from "@/lib/data/badges";
import { listStoreProductsAdmin } from "@/lib/data/store";

export default async function AdminStorePage() {
  const [products, badges] = await Promise.all([listStoreProductsAdmin(), getAllBadgesCatalog()]);

  return (
    <>
      <AdminPageHeader
        title="Store Management"
        description="Create and manage one-time store products, pricing, visibility, icons, and badge grants."
      />
      <StoreAdminPanel products={products} badges={badges} />
    </>
  );
}
