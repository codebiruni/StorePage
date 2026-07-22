/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import useContextData from "@/defaults/custom-component/useContextData";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Heart, Zap, Check, Plus, Minus } from "lucide-react";
import { useState } from "react";

export default function ActionsButtonComponent({ product , handleBuyData }: { product: any , handleBuyData:any }) {
  const { handleAddCart, handleAddWishlist } = useContextData();
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Resolve the actual stock/price taking the selected variant into account.
  // ProductIntroduce attaches `priceInfo` to the product object we receive.
  const priceInfo = product?.priceInfo;
  const stock: number = priceInfo
    ? priceInfo.variantId
      ? priceInfo.variantStock ?? 0
      : priceInfo.variantStock ?? 0
    : product?.quentity ?? 0;
  const effectivePrice: number = priceInfo
    ? priceInfo.currentPrice
    : product?.price ?? 0;
  const requiresVariant =
    Array.isArray(product?.priceVariants) && product.priceVariants.length > 0;
  const variantSelected = !requiresVariant || !!priceInfo?.variantId;
  const outOfStock = stock <= 0;

  // A stable key per product+variant, so different SKUs don't merge into one cart line.
  const cartLineId = priceInfo?.variantId
    ? `${product?.id}__${priceInfo.variantId}`
    : product?.id;

  // Check if product is already in cart or wishlist on component mount
  React.useEffect(() => {
    if (product) {
      // Check cart
      const existingCart = localStorage.getItem("cartProducts");
      if (existingCart) {
        const cartProducts = JSON.parse(existingCart);
        const now = Date.now();
        const validProducts = cartProducts.filter(
          (item: any) => item.expiresAt > now
        );
        const existsInCart = validProducts.some(
          (item: any) => item.product.id === product.id
        );
        setIsInCart(existsInCart);
      }

      // Check wishlist
      const existingWishlist = localStorage.getItem("WishlistProducts");
      if (existingWishlist) {
        const wishlistProducts = JSON.parse(existingWishlist);
        const now = Date.now();
        const validProducts = wishlistProducts.filter(
          (item: any) => item.expiresAt > now
        );
        const existsInWishlist = validProducts.some(
          (item: any) => item.product.id === product.id
        );
        setIsInWishlist(existsInWishlist);
      }
    }
  }, [product]);

  const handleAddCartData = () => {
    if (!product) return;

    // Guard: require variant selection when variants exist, and block out-of-stock.
    if (requiresVariant && !variantSelected) {
      toast.error("Please select a variant before adding to cart.");
      return;
    }
    if (outOfStock) {
      toast.error("This item is out of stock.");
      return;
    }

    const existing = localStorage.getItem("cartProducts");
    const cartProducts: any = existing ? JSON.parse(existing) : [];
    const now = Date.now();
    const validProducts = cartProducts.filter(
      (item: any) => item.expiresAt > now
    );

    // Stored product gets the variant's resolved price/SKU so the cart shows
    // the correct numbers even after the user navigates away.
    const storedProduct = {
      ...product,
      price: effectivePrice,
      priceInfo,
      displaySku: priceInfo?.variantSku,
    };

    const existingProductIndex = validProducts.findIndex(
      (item: any) =>
        (item.product.id === product.id &&
          item.product?.priceInfo?.variantId === priceInfo?.variantId) ||
        item.lineId === cartLineId
    );

    if (existingProductIndex !== -1) {
      const next =
        (validProducts[existingProductIndex].quantity || 0) + quantity;
      validProducts[existingProductIndex].quantity = Math.min(next, stock);
      toast.success("Product quantity increased in your cart!");
    } else {
      const newProduct: any = {
        product: storedProduct,
        lineId: cartLineId,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        quantity: Math.min(quantity, stock),
      };
      validProducts.push(newProduct);
      toast.success(
        "Product added to cart successfully! This item will expire in 30 days."
      );
    }

    localStorage.setItem("cartProducts", JSON.stringify(validProducts));
    handleAddCart(validProducts);
    setIsInCart(true);
  };

  const handleAddWishlistData = () => {
    if (!product) return;

    const existing = localStorage.getItem("WishlistProducts");
    const wishlistProducts: any = existing ? JSON.parse(existing) : [];

    const now = Date.now();
    const validProducts = wishlistProducts.filter(
      (item: any) => item.expiresAt > now
    );

    const alreadyExists = validProducts.some(
      (item: any) => item.product.id === product.id
    );

    if (alreadyExists) {
      toast.error("This product is already in your wishlist!");
      return;
    }

    // Add product with individual expiration (30 days from now)
    const newProduct: any = {
      product: product,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    };

    const updatedWishlistProducts = [...validProducts, newProduct];

    // Update localStorage
    localStorage.setItem(
      "WishlistProducts",
      JSON.stringify(updatedWishlistProducts)
    );

    handleAddWishlist(updatedWishlistProducts);
    setIsInWishlist(true);

    toast.success(
      "Product added to wishlist successfully! This item will expire in 30 days."
    );
  };


  const incrementQuantity = () => {
    if (stock > 0 && quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Guard the buy-now handler with the same variant/stock checks.
  const guardedBuyNow = () => {
    if (requiresVariant && !variantSelected) {
      toast.error("Please select a variant before buying.");
      return;
    }
    if (outOfStock) {
      toast.error("This item is out of stock.");
      return;
    }
    handleBuyData();
  };

  return (
    <Card className="p-0 border-0 shadow-none w-full">
      {/* Quantity Selector */}
      <div className="mb-3">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">
          Quantity
        </h3>
        <div className="flex items-center border rounded-md w-fit">
          <Button
            variant="ghost"
            size="icon"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="h-10 w-10 rounded-r-none"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="h-10 w-12 flex items-center justify-center border-x">
            <span className="font-medium">{quantity}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={incrementQuantity}
            disabled={stock > 0 && quantity >= stock}
            className="h-10 w-10 rounded-l-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-x-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Buy Now Button */}
        <Button
          onClick={guardedBuyNow}
          disabled={outOfStock || (requiresVariant && !variantSelected)}
          className="w-full"
        >
          <Zap className="mr-2 h-5 w-5" />
          {outOfStock ? "Out of Stock" : "Buy Now"}
        </Button>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddCartData}
          variant={isInCart ? "secondary" : "default"}
          disabled={outOfStock || (requiresVariant && !variantSelected)}
          className="w-full"
        >
          {isInCart ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Add to Wishlist Button */}
        <Button
          onClick={handleAddWishlistData}
          variant={isInWishlist ? "secondary" : "outline"}
          className="w-full "
        >
          <Heart
            className={`mr-2 h-5 w-5 ${
              isInWishlist ? "fill-red-500 text-red-500" : ""
            }`}
          />
          {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
        </Button>
      </div>

      {/* Additional Info */}
      <div className=" p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Free Shipping</span>
          <span className="font-medium">10-Day Returns</span>
        </div>
      </div>
    </Card>
  );
}
