import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProductsClient from './ProductsClient'

export const revalidate = 0
const PAGE_SIZE = 15

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string }
}) {
  const page  = Math.max(1, Number(searchParams.page ?? 1))
  const query = searchParams.q ?? ''
  const from  = (page - 1) * PAGE_SIZE
  const to    = from + PAGE_SIZE - 1

  const supabase = createServerSupabaseClient()

  let req = supabase
    .from('products')
    .select('*, stores(name, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (query) req = req.ilike('name', `%${query}%`)

  const { data: products, count } = await req

  // Fetch stores for the add-product form
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {count ?? 0} products across all stores
        </p>
      </div>
      <ProductsClient
        products={products ?? []}
        stores={stores ?? []}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        query={query}
      />
    </div>
  )
}
