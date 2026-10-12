import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle } from 'lucide-react'

interface OrderFormData {
  name: string
  number: string
  district: string
  upazilla: string
  union: string // This field now securely represents Village / Ward / Area Address
  note: string
  paymentMethod: 'cash-on-delivery'
}

interface ShippingFormProps {
  formData: OrderFormData
  onInputChange: (field: keyof OrderFormData, value: string) => void
  deliveryCharge: number
  grandTotal: number
  loading: boolean
  onSubmitOrder: () => void
  isFormValid: boolean
}

// District values used for each zone.
// IMPORTANT: the parent uses /dhaka|ঢাকা/i to compute deliveryCharge.
// 'ঢাকা'      → matches → 70৳  (inside)
// 'বাহিরে'    → no match → 90৳ (outside) — no latin 'dhaka' in this string
const INSIDE_DISTRICT = 'ঢাকা'
const INSIDE_UPAZILLA = 'ঢাকা'
const OUTSIDE_DISTRICT = 'বাহিরে'   // pure Bangla, will NOT match /dhaka|ঢাকা/i
const OUTSIDE_UPAZILLA = 'বাহিরে'

export default function ShippingForm({
  formData,
  onInputChange,
  deliveryCharge,
  grandTotal,
  loading,
  onSubmitOrder,
  isFormValid
}: ShippingFormProps) {
  // Safe check: matches parent's /dhaka|ঢাকা/i regex
  const isInsideDhaka = /dhaka|ঢাকা/i.test(formData.district)
  const hasSelectedZone = formData.district !== ''

  const selectOutside = () => {
    onInputChange('district', OUTSIDE_DISTRICT)
    onInputChange('upazilla', OUTSIDE_UPAZILLA)
  }

  const selectInside = () => {
    onInputChange('district', INSIDE_DISTRICT)
    onInputChange('upazilla', INSIDE_UPAZILLA)
  }

  return (
    <div className="min-h-screen bg-[#eef0f5] dark:bg-background px-4 py-6 font-inherit text-foreground transition-colors duration-200">

      {/* Page Heading */}
      <h2 className="text-[20px] font-bold text-[#1a8a3c] dark:text-[#22c55e] mb-6 leading-relaxed">
        আপনার ডেলিভারি ঠিকানা দিন
      </h2>

      {/* Full Name */}
      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-foreground">
          আপনার নামঃ <span className="text-[#e53e3e]">*</span>
        </label>
        <Input
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="আপনার পূর্ণ নাম লিখুন"
          required
          className="w-full h-12 px-3 text-[15px] rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 shadow-none focus:ring-0 focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Address */}
      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-foreground">
          ঠিকানাঃ <span className="text-[#e53e3e]">*</span>
        </label>
        <Input
          value={formData.union}
          onChange={(e) => onInputChange('union', e.target.value)}
          placeholder="গ্রাম, থানা এবং জেলা"
          required
          className="w-full h-12 px-3 text-[15px] rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 shadow-none focus:ring-0 focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Phone Number */}
      <div className="mb-6">
        <label className="block mb-1.5 text-sm font-medium text-foreground">
          ফোন নাম্বারঃ <span className="text-[#e53e3e]">*</span>
        </label>
        <Input
          value={formData.number}
          onChange={(e) => onInputChange('number', e.target.value)}
          placeholder="01XXXXXXXXX"
          pattern="01[3-9]\d{8}"
          required
          className="w-full h-12 px-3 text-[15px] rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 shadow-none focus:ring-0 focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Order Note */}
      <div className="mb-6">
        <label className="block mb-1.5 text-sm font-medium text-foreground">
          অর্ডার নোট (ঐচ্ছিক)
        </label>
        <Textarea
          value={formData.note}
          onChange={(e) => onInputChange('note', e.target.value)}
          placeholder="বিশেষ কোনো নির্দেশনা থাকলে লিখুন..."
          rows={2}
          className="w-full px-3 py-2.5 text-[15px] rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 shadow-none resize-none focus:ring-0 focus:border-muted-foreground transition-colors"
        />
      </div>

      {/* Shipping Zone */}
      <div className="mb-7">
        <h3 className="text-[17px] font-bold text-foreground mb-3">
          Shipping
        </h3>

        <div className="bg-card border border-border rounded-lg overflow-hidden transition-colors">
          {/* Outside Dhaka — 90৳ */}
          <label className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="shippingZone"
                checked={hasSelectedZone && !isInsideDhaka}
                onChange={selectOutside}
                className="w-4.5 h-4.5 accent-primary cursor-pointer"
              />
              <span className="text-[15px] text-foreground">ঢাকার বাহিরে:</span>
            </div>
            <span className="text-[15px] font-medium text-foreground">90 ৳</span>
          </label>

          {/* Inside Dhaka — 70৳ */}
          <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="shippingZone"
                checked={hasSelectedZone && isInsideDhaka}
                onChange={selectInside}
                className="w-4.5 h-4.5 accent-primary cursor-pointer"
              />
              <span className="text-[15px] text-foreground">ঢাকার ভিতরে:</span>
            </div>
            <span className="text-[15px] font-medium text-foreground">70 ৳</span>
          </label>
        </div>

        {/* Delivery charge preview */}
        {hasSelectedZone && (
          <div className="mt-2.5 flex justify-between items-center">
            <p className="text-sm text-[#1a6e30] dark:text-[#4ade80] font-medium">
              ⚡ ১ ঘন্টার মধ্যে ফোনে কনফার্মেশন পাবেন
            </p>
            <p className="text-sm font-semibold text-foreground">
              ডেলিভারি চার্জ: {deliveryCharge} ৳
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmitOrder}
        disabled={loading || !isFormValid}
        className="w-full h-13 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-65 transition-all flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            অর্ডার প্রক্রিয়া হচ্ছে...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            অর্ডার করুন — {grandTotal} ৳
          </>
        )}
      </Button>

      {/* Payment method note */}
      <p className="text-center mt-3 text-sm text-muted-foreground">
        💵 ক্যাশ অন ডেলিভারি — পণ্য পেয়ে পেমেন্ট করুন
      </p>

    </div>
  )
}