'use client'

import { useParams, useRouter } from 'next/navigation'

export default function OrderSuccessPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.orderId

    return (
        <div className="container mx-auto py-16 text-center mt-20">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Order Successful!</h1>
                <p className="text-gray-600 mb-6">
                    Thank you for your purchase. Your order ID is:
                </p>
                <div className="bg-gray-100 p-4 rounded-md mb-8">
                    <p className="font-mono text-lg font-semibold">{orderId}</p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
                >
                    Return to Shop
                </button>
            </div>
        </div>
    )
}