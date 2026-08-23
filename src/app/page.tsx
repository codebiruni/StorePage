import CouponProducts from "./_home/featuredProducts";
import HomeBanner from "./_home/HomeBanner";
import HomeCategory from "./_home/HomeCategory";
import HomeOffersProducts from "./_home/HomeOffersProducts";
import OffetsCards from "./_home/OffetsCards";
import Products from "./_home/Products";

// Pre-render the home page at build time, then refresh every 10 minutes via
// ISR. Vercel serves this from its edge cache; on BDIX the standalone server
// re-renders it on the `revalidate` interval and Nginx/Cloudflare can cache
// the HTML response.
export const dynamic = "force-static";
export const revalidate = 600;

export default function Home() {
  return (
    <div className="w-full top-padding">
      <HomeBanner />
      {/* <OffetsCards /> */}
      <HomeCategory />
      <Products />
      {/* <HomeOffersProducts /> */}
      {/* <CouponProducts /> */}
    </div>
  );
}
