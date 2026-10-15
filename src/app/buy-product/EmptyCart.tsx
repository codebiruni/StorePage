import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function EmptyCart() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-lg">
      <Card className="text-center py-10 px-6 border border-border/80 rounded-2xl shadow-xs bg-card">
        <CardContent className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              আপনার কার্ট বর্তমানে খালি আছে
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              অর্ডার করতে আপনার পছন্দের পণ্যগুলো ব্রাউজ করে কার্টে যোগ করুন।
            </p>
          </div>
          <Button asChild className="font-semibold cursor-pointer">
            <Link href="/products" className="flex items-center gap-2">
              পণ্যসমূহ দেখুন
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}