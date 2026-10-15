/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import useContextData from "@/defaults/custom-component/useContextData"
import { useSiteConfig } from "@/defaults/context/SiteConfigProvider"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import EmptyCart from './EmptyCart'
import OrderSummary from './OrderSummery'
import ShippingForm from './ShippingForm'
import { useOrderDraft } from '@/hooks/useOrderDraft'
import { ShieldCheck, Banknote } from 'lucide-react'

interface OrderFormData {
  name: string
  number: string
  district: string
  upazilla: string
  union: string // This field represents Village / Ward / Area Address
  note: string
  paymentMethod: 'cash-on-delivery'
}

interface PurchaseItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartProduct {
  product: {
    id: string
  }
  expiresAt: number
  quantity: number
}

interface WishlistProduct {
  product: {
    id: string
  }
  expiresAt: number
}

export default function PurchaseProducts() {
  const { purchasesData, handlePurchasedData, handleAddCart, handleAddWishlist } = useContextData()
  const [loading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const { config: siteConfig } = useSiteConfig()
  const insideCharge = siteConfig?.deliveryCharge?.insideDhaka ?? 70
  const outsideCharge = siteConfig?.deliveryCharge?.outsideDhaka ?? 90

  const [formData, setFormData] = useState<OrderFormData>({
    name: '',
    number: '',
    district: 'বাহিরে',
    upazilla: 'বাহিরে',
    union: '', // Used for Village / Ward / Area Address
    note: '',
    paymentMethod: 'cash-on-delivery'
  })

  const [itemsWithQuantity, setItemsWithQuantity] = useState<PurchaseItem[]>([])

  // Clean purchasesData on every render to remove any functions
  const cleanPurchasesData = Array.isArray(purchasesData)
    ? purchasesData.filter(item =>
      item &&
      typeof item === 'object' &&
      item.id &&
      typeof item.id === 'string'
    )
    : []

  useEffect(() => {
    console.log('Current purchasesData:', purchasesData)
    console.log('Clean purchasesData:', cleanPurchasesData)

    if (cleanPurchasesData.length > 0) {
      const initializedItems = cleanPurchasesData.map((item: any) => ({
        ...item,
        quantity: item.quantity || 1
      }))
      setItemsWithQuantity(initializedItems)
    } else {
      setItemsWithQuantity([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchasesData])

  const subtotal = itemsWithQuantity.reduce((sum: number, item: PurchaseItem) =>
    sum + (item.price * item.quantity), 0)

  const deliveryCharge = formData.district
    ? (/dhaka|ঢাকা/i.test(formData.district)
      ? insideCharge
      : outsideCharge)
    : outsideCharge
  const discount = 0
  const grandTotal = subtotal + deliveryCharge - discount

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Persist partial input so we don't lose the lead if the user navigates
  // away mid-checkout. Reads `formData` and the current cart on every save.
  const { draftId, saveDraft } = useOrderDraft({ source: "buy-product" })
  useEffect(() => {
    // Skip the very first render with an empty form
    if (!formData.name && !formData.number && !formData.union) return
    if (itemsWithQuantity.length === 0) return
    saveDraft({
      productIds: itemsWithQuantity.flatMap((it) =>
        Array.from({ length: it.quantity }, () => it.id),
      ),
      name: formData.name,
      number: formData.number,
      address: [formData.union, formData.upazilla, formData.district]
        .filter(Boolean)
        .join(", "),
      note: formData.note,
      totalAmount: subtotal,
      deliveryCharge,
      discount,
    })
    // We intentionally key off the form fields only; subtotal/deliveryCharge
    // are derived from them. eslint can't see the derived deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.name,
    formData.number,
    formData.union,
    formData.upazilla,
    formData.district,
    formData.note,
    itemsWithQuantity,
  ])

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setItemsWithQuantity(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const handleRemoveItem = (id: string) => {

    // 1. Remove from local state
    const updatedItems = itemsWithQuantity.filter(item => item.id !== id)
    setItemsWithQuantity(updatedItems)

    // 2. Remove from global state - SIMPLIFIED
    const updatedPurchases = cleanPurchasesData.filter((item: any) => {
      console.log('Checking item:', item.id, 'against:', id)
      return item.id !== id
    })

    console.log('Updated purchases after removal:', updatedPurchases)
    handlePurchasedData(updatedPurchases)

    // 3. Remove from storage
    removeProductsFromStorage([id])

    console.log('Removal completed')
  }

  const removeProductsFromStorage = (productIds: string[]) => {
    // Remove from cart
    const cartExisting = localStorage.getItem("cartProducts")
    if (cartExisting) {
      const cartProducts: CartProduct[] = JSON.parse(cartExisting)
      const now = Date.now()
      const validProducts = cartProducts.filter((item) => item.expiresAt > now)

      const updatedCartProducts = validProducts.filter(
        (item) => !productIds.includes(item.product.id)
      )

      localStorage.setItem("cartProducts", JSON.stringify(updatedCartProducts))
      handleAddCart(updatedCartProducts)
    }

    // Remove from wishlist
    const wishlistExisting = localStorage.getItem("WishlistProducts")
    if (wishlistExisting) {
      const wishlistProducts: WishlistProduct[] = JSON.parse(wishlistExisting)
      const now = Date.now()
      const validProducts = wishlistProducts.filter((item) => item.expiresAt > now)

      const updatedWishlistProducts = validProducts.filter(
        (item) => !productIds.includes(item.product.id)
      )

      localStorage.setItem("WishlistProducts", JSON.stringify(updatedWishlistProducts))
      handleAddWishlist(updatedWishlistProducts)
    }
  }

  const BDT_TO_USD_RATE = 1 / 122.71 // ≈ 0.008149, update periodically as rates shift

  const trackPurchaseEvent = async (eventId: string) => {
    if (typeof window === 'undefined') return;

    const usdValue = Math.round(grandTotal * BDT_TO_USD_RATE * 100) / 100

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (typeof window.fbq !== 'undefined') {
        const payload = {
          value: usdValue,
          currency: 'USD',
          content_type: 'product',
          contents: itemsWithQuantity.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        }
        console.log('[PURCHASE PAYLOAD]:', JSON.stringify(payload))
        window.fbq('track', 'Purchase', payload, { eventID: eventId })
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const handleSubmitOrder = async () => {
    const requiredFields = [
      { field: 'name', label: 'Full Name' },
      { field: 'number', label: 'Phone Number' },
      { field: 'district', label: 'District' },
      { field: 'upazilla', label: 'Thana / Upazila' },
      { field: 'union', label: 'Village / Ward Address' }
    ]

    const missingField = requiredFields.find(field => !formData[field.field as keyof OrderFormData])
    if (missingField) {
      toast.error(`Please fill in the ${missingField.label} field`)
      return
    }

    if (itemsWithQuantity.length === 0) {
      toast.error('No products in cart')
      return
    }

    const phoneRegex = /^01[3-9]\d{8}$/
    if (!phoneRegex.test(formData.number)) {
      toast.error('Please enter a valid Bangladeshi phone number (01XXXXXXXXX)')
      return
    }

    setLoading(true)

    try {
      const productsWithQuantity: string[] = []
      itemsWithQuantity.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          productsWithQuantity.push(item.id)
        }
      })

      // Clean address aggregation using only your updated variables
      const orderData = {
        name: formData.name,
        number: formData.number,
        address: `${formData.union}, ${formData.upazilla}, ${formData.district}`,
        products: productsWithQuantity,
        totalAmount: subtotal,
        deliveryCharge,
        discount,
        grandTotal,
        paymentMethod: formData.paymentMethod,
        note: formData.note,
        source: 'buy-product',
        draftId, // promote draft → pending if the server recognises it
      }

      const response = await fetch('/api/v1/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("SERVER VALIDATION ERROR DETAILS:", errorData);
        throw new Error(errorData?.message || 'Failed to create order');
      }

      const result = await response.json()

      // 👇 GENERATE A UNIQUE DEDUPLICATION KEY
      const uniqueEventId = `pur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 1. Fire Browser Pixel with the eventID parameter.
      await trackPurchaseEvent(uniqueEventId)

      try {
        await fetch('/api/v1/meta-capi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventName: 'Purchase',
            eventId: uniqueEventId,
            value: Math.round(grandTotal * BDT_TO_USD_RATE * 100) / 100,
            currency: 'USD',
            products: itemsWithQuantity.map(item => ({ id: item.id, quantity: item.quantity })),
            userData: {
              ph: formData.number,
              fn: formData.name
            }
          }),
        });
      } catch (capiError) {
        console.error("Server-side CAPI failed to fire:", capiError);
      }

      const orderedProductIds = itemsWithQuantity.map(item => item.id)
      // The API responds with { success, data: { orderId, ... } } — read the
      // server-assigned id from `data` so the thanks page shows the real one.
      const finalOrderId =
        result?.data?.orderId || result?.orderId || `ORD-${Date.now()}`

      // 👇 1. Block the UI from switching to EmptyCart
      setIsRedirecting(true)

      handlePurchasedData([])
      setItemsWithQuantity([])
      setFormData({
        name: '',
        number: '',
        district: '',
        upazilla: '',
        union: '',
        note: '',
        paymentMethod: 'cash-on-delivery'
      })
      removeProductsFromStorage(orderedProductIds)
      router.push(`/step/thanks?orderId=${encodeURIComponent(finalOrderId)}`)
    } catch (error) {
      console.error('Order submission error:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)

    }
  }

  if (isRedirecting) {
    return null; // Or you could return a simple <div className="p-8 text-center">Redirecting...</div>
  }

  if (itemsWithQuantity.length === 0 && cleanPurchasesData.length === 0) {
    return <EmptyCart />
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Checkout Page Header */}
      <div className="mb-6 pb-4 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              চেকআউট
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              অর্ডারটি সম্পন্ন করতে নিচের তথ্যগুলো পূরণ করুন
            </p>
          </div>

          {/* Trust badges row */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              নিরাপদ চেকআউট
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground font-medium">
              <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
              ক্যাশ অন ডেলিভারি
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Shipping details (7 cols on desktop) */}
        <div className="lg:col-span-7 order-2 lg:order-1">
          <ShippingForm
            formData={formData}
            onInputChange={handleInputChange}
            deliveryCharge={deliveryCharge}
            grandTotal={grandTotal}
            loading={loading}
            onSubmitOrder={handleSubmitOrder}
            isFormValid={
              !!formData.name.trim() &&
              !!formData.number.trim() &&
              !!formData.union.trim()
            }
            insideCharge={insideCharge}
            outsideCharge={outsideCharge}
          />
        </div>

        {/* Order summary (5 cols on desktop, sticky) */}
        <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-28">
          <OrderSummary
            itemsWithQuantity={itemsWithQuantity}
            subtotal={subtotal}
            deliveryCharge={deliveryCharge}
            discount={discount}
            grandTotal={grandTotal}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  )
}