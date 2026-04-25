'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Plus, Search, ChevronLeft, ChevronRight, X, Loader2, Package, Trash2 } from 'lucide-react'

// ── Zod schema ────────────────────────────────────────────────────
const productSchema = z.object({
  store_id:    z.string().min(1, 'Select a store'),
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price:       z.coerce.number().positive('Price must be positive'),
  category:    z.string().min(1, 'Select a category'),
  in_stock:    z.boolean().default(true),
})
type ProductForm = z.infer<typeof productSchema>

const CATEGORIES = ['Fashion', 'Electronics', 'Food & Drinks', 'Health & Beauty', 'Home & Garden', 'Sports', 'Other']

type Product = any
type Store   = { id: string; name: string }

export default function ProductsClient({
  products, stores, total, page, pageSize, query
}: {
  products: Product[]; stores: Store[]; total: number;
  page: number; pageSize: number; query: string
}) {
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [slideOver, setSlideOver]   = useState(false)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setPreview]  = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const totalPages = Math.ceil(total / pageSize)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { in_stock: true },
  })

  // ── Search ─────────────────────────────────────────────────────
  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams)
    params.set('q', e.target.value)
    params.set('page', '1')
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(p))
    startTransition(() => router.push(`${pathname}?${params}`))
  }

  // ── Image pick ─────────────────────────────────────────────────
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Submit new product ─────────────────────────────────────────
  async function onSubmit(values: ProductForm) {
    setSubmitting(true)
    const supabase = createClient()
    let imageUrl = ''

    if (imageFile) {
      const ext  = imageFile.name.split('.').pop()
      const path = `${values.store_id}-products/${Date.now()}.${ext}`
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('product-image')
        .upload(path, imageFile, { upsert: true })
      if (uploadErr) { alert(uploadErr.message); setSubmitting(false); return }
      const { data: url } = supabase.storage.from('product-image').getPublicUrl(upload.path)
      imageUrl = url.publicUrl
    }

    const { error } = await supabase.from('products').insert({
      ...values,
      image_url: imageUrl,
    })

    if (error) { alert(error.message); setSubmitting(false); return }

    reset(); setImageFile(null); setPreview(''); setSlideOver(false)
    setSubmitting(false)
    router.refresh()
  }

  // ── Delete product ─────────────────────────────────────────────
  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-card border border-input focus-within:ring-2 focus-within:ring-ring transition">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text" defaultValue={query} onChange={handleSearch}
            placeholder="Search products…"
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
        <button onClick={() => setSlideOver(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className={cn('divide-y divide-border', isPending && 'opacity-50')}>
            {products.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No products found.</td></tr>
            )}
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image_url
                      ? <Image src={p.image_url} alt={p.name} width={36} height={36} className="rounded-lg object-cover w-9 h-9 flex-shrink-0" />
                      : <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                    }
                    <span className="font-medium line-clamp-1">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.stores?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/15">{p.category}</span>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                    p.in_stock ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20')}>
                    {p.in_stock ? 'In Stock' : 'Out'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-1">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Product Slide-over ── */}
      {slideOver && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSlideOver(false)} />
          {/* Panel */}
          <div className="w-full max-w-md bg-card border-l border-border flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="font-semibold">Add New Product</h2>
              <button onClick={() => setSlideOver(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Store */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Store *</label>
                <select {...register('store_id')} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select a store…</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.store_id && <p className="text-xs text-destructive">{errors.store_id.message}</p>}
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Name *</label>
                <input {...register('name')} placeholder="e.g. Men's Casual Shirt"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea {...register('description')} rows={3} placeholder="Short product description…"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Price (GH₵) *</label>
                  <input {...register('price')} type="number" step="0.01" placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring" />
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Category *</label>
                  <select {...register('category')} className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                </div>
              </div>

              {/* In stock */}
              <div className="flex items-center gap-2.5">
                <input {...register('in_stock')} type="checkbox" id="in_stock"
                  className="w-4 h-4 rounded accent-primary cursor-pointer" />
                <label htmlFor="in_stock" className="text-sm font-medium cursor-pointer">In Stock</label>
              </div>

              {/* Image upload */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Image</label>
                <div className="relative">
                  {imagePreview
                    ? <div className="relative rounded-lg overflow-hidden h-40">
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        <button type="button" onClick={() => { setImageFile(null); setPreview('') }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition">
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    : <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-background">
                        <Package className="w-6 h-6 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Click to upload image</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                  }
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : <><Plus className="w-4 h-4" /> Add Product</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
