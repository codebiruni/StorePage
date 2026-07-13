/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/connectdb";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import SubCategory from "@/models/sub-category.model";
import OrderModel from "@/models/order.model";
import Branch from "@/models/branch.model";
import Review from "@/models/review.model";
import QuestionAnswer from "@/models/quesAndAns.model";
import {
  inventoryValueAddFields,
  inventoryValueMatch,
} from "@/lib/inventoryValue";

interface InventoryDashboardResponse {
  success: boolean;
  data: {
    overview: {
      totalProducts: number;
      totalInventoryValue: number;
      lowStockProducts: number;
      outOfStockProducts: number;
      totalCategories: number;
      totalSubCategories: number;
      averageRating: number;
    };
    stockAnalysis: {
      stockLevels: Array<{
        level: string;
        count: number;
        percentage: number;
        value: number;
      }>;
      criticalProducts: Array<{
        _id: string;
        name: string;
        quantity: number;
        currentPrice: number;
        category: string;
        stockValue: number;
      }>;
    };
    categoryAnalysis: Array<{
      category: string;
      productCount: number;
      totalValue: number;
      averagePrice: number;
      lowStockCount: number;
      percentage: number;
    }>;
    priceAnalysis: {
      priceRanges: Array<{
        range: string;
        count: number;
        percentage: number;
      }>;
      averageProductPrice: number;
      highestPricedProduct: {
        name: string;
        price: number;
        category: string;
      };
      lowestPricedProduct: {
        name: string;
        price: number;
        category: string;
      };
    };
    salesPerformance: {
      topSellingProducts: Array<{
        productId: string;
        name: string;
        salesCount: number;
        revenue: number;
        quantitySold: number;
      }>;
      categorySales: Array<{
        category: string;
        salesCount: number;
        revenue: number;
        percentage: number;
      }>;
    };
    productPerformance: {
      bestRatedProducts: Array<{
        name: string;
        averageRating: number;
        reviewCount: number;
        price: number;
        category: string;
      }>;
      mostReviewedProducts: Array<{
        name: string;
        reviewCount: number;
        averageRating: number;
        category: string;
      }>;
    };
    inventoryTrends: {
      monthlyInventoryChange: Array<{
        month: string;
        productsAdded: number;
        inventoryValueChange: number;
        stockMovement: number;
      }>;
      categoryGrowth: Array<{
        category: string;
        growthRate: number;
        newProducts: number;
      }>;
    };
    branchAnalysis: Array<{
      branchName: string;
      productCount: number;
      inventoryValue: number;
      lowStockItems: number;
      averageRating: number;
    }>;
    recentActivity: {
      lowStockAlerts: Array<{
        product: string;
        quantity: number;
        category: string;
        urgency: string;
      }>;
      recentRestocks: Array<{
        product: string;
        previousQuantity: number;
        newQuantity: number;
        date: string;
      }>;
      newProducts: Array<{
        name: string;
        category: string;
        price: number;
        createdAt: string;
      }>;
    };
    orderInsights: {
      totals: {
        totalOrders: number;
        totalRevenue: number;
        averageOrderValue: number;
        cancelledOrders: number;
        deliveredOrders: number;
        pendingOrders: number;
      };
      statusBreakdown: Array<{
        status: string;
        count: number;
        percentage: number;
      }>;
      paymentBreakdown: Array<{
        method: string;
        count: number;
        percentage: number;
      }>;
      monthlyOrders: Array<{
        month: string;
        orders: number;
        revenue: number;
      }>;
      sourceBreakdown: Array<{
        source: string;
        count: number;
        percentage: number;
      }>;
      recentOrders: Array<{
        orderId: string;
        name: string;
        number: string;
        grandTotal: number;
        orderStatus: string;
        paymentStatus: string;
        paymentMethod: string;
        createdAt: string;
      }>;
    };
  };
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const url = new URL(request.url);
    const timeRange = url.searchParams.get("range") || "30d";

    // Get all dashboard data in parallel for better performance
    const [
      overview,
      stockAnalysis,
      categoryAnalysis,
      priceAnalysis,
      salesPerformance,
      productPerformance,
      inventoryTrends,
      branchAnalysis,
      recentActivity,
      orderInsights
    ] = await Promise.all([
      getOverviewStats(),
      getStockAnalysis(),
      getCategoryAnalysis(),
      getPriceAnalysis(),
      getSalesPerformance(timeRange),
      getProductPerformance(),
      getInventoryTrends(timeRange),
      getBranchAnalysis(),
      getRecentActivity(),
      getOrderInsights(timeRange)
    ]);

    const response: InventoryDashboardResponse = {
      success: true,
      data: {
        overview,
        stockAnalysis,
        categoryAnalysis,
        priceAnalysis,
        salesPerformance,
        productPerformance,
        inventoryTrends,
        branchAnalysis,
        recentActivity,
        orderInsights
      }
    };

    return NextResponse.json(response, { 
        status: 200
      });

  } catch (error: any) {
    console.error("Inventory dashboard error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch inventory dashboard data",
        data: null
      },
      { status: 500 }
    );
  }
}

// Overview Statistics
async function getOverviewStats() {
  const [
    totalProducts,
    categoriesCount,
    subCategoriesCount,
    inventoryValue,
    lowStockCount,
    outOfStockCount,
    averageRating
  ] = await Promise.all([
    Product.countDocuments({ isDeleted: false }),
    Category.countDocuments({ isDeleted: false }),
    SubCategory.countDocuments({ isDeleted: false }),
    Product.aggregate([
      inventoryValueMatch,
      inventoryValueAddFields,
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$inventoryValue", 0] } },
        },
      },
    ]),
    Product.countDocuments({ 
      isDeleted: false, 
      quentity: { $lt: 10, $gt: 0, $type: "number" } 
    }),
    Product.countDocuments({ 
      isDeleted: false, 
      quentity: { $eq: 0, $type: "number" } 
    }),
    Product.aggregate([
      { 
        $match: { 
          isDeleted: false, 
          averageRating: { $gt: 0, $type: "number" } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          average: { $avg: "$averageRating" } 
        } 
      }
    ])
  ]);

  return {
    totalProducts,
    totalInventoryValue: inventoryValue[0]?.total || 0,
    lowStockProducts: lowStockCount,
    outOfStockProducts: outOfStockCount,
    totalCategories: categoriesCount,
    totalSubCategories: subCategoriesCount,
    averageRating: averageRating[0]?.average ? Number(averageRating[0].average.toFixed(2)) : 0
  };
}

// Stock Level Analysis
async function getStockAnalysis() {
  // Total non-deleted products with any trackable stock (variants or
  // top-level `quentity`). Used as the denominator for percentage labels so
  // the radial chart stays stable even if some products lack a price.
  const totalProducts = await Product.countDocuments({
    isDeleted: false,
    $or: [
      { "priceVariants.0": { $exists: true } },
      { quentity: { $exists: true } },
    ],
  });

  // Effective stock = top-level `quentity` plus the sum of
  // `priceVariants[].quentity`. Products with no top-level field still bucket
  // correctly off the variant total.
  //
  // Legacy rows sometimes stored `quentity` as a string, which makes
  // `$add` throw "$add only supports numeric or date types, not string".
  // Coerce to a number defensively before summing so the dashboard keeps
  // loading even if the schema invariant is broken.
  const stockLevels = await Product.aggregate([
    inventoryValueMatch,
    {
      $addFields: {
        quantityNum: {
          $cond: [
            { $eq: [{ $type: "$quentity" }, "number"] },
            "$quentity",
            {
              $cond: [
                { $in: [{ $type: "$quentity" }, ["string", "long", "int", "double", "decimal"]] },
                { $toDouble: "$quentity" },
                0,
              ],
            },
          ],
        },
        variantQtyNum: {
          $sum: {
            $map: {
              input: { $ifNull: ["$priceVariants", []] },
              as: "v",
              in: {
                $cond: [
                  { $eq: [{ $type: "$$v.quentity" }, "number"] },
                  "$$v.quentity",
                  {
                    $cond: [
                      { $in: [{ $type: "$$v.quentity" }, ["string", "long", "int", "double", "decimal"]] },
                      { $toDouble: "$$v.quentity" },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalStock: { $add: ["$quantityNum", "$variantQtyNum"] },
      },
    },
    inventoryValueAddFields,
    {
      $addFields: {
        stockLevel: {
          $switch: {
            branches: [
              { case: { $eq: ["$totalStock", 0] }, then: "Out of Stock" },
              { case: { $lt: ["$totalStock", 10] }, then: "Critical" },
              { case: { $lt: ["$totalStock", 30] }, then: "Low" },
              { case: { $lt: ["$totalStock", 100] }, then: "Medium" },
            ],
            default: "High",
          },
        },
      },
    },
    {
      $group: {
        _id: "$stockLevel",
        count: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ["$inventoryValue", 0] } },
      },
    },
  ]);

  // Stable ordering independent of the aggregate ordering.
  const LEVEL_ORDER = [
    "Out of Stock",
    "Critical",
    "Low",
    "Medium",
    "High",
  ] as const;

  const formattedStockLevels = LEVEL_ORDER.map((level) => {
    const stockData = stockLevels.find((s) => s._id === level) || {
      count: 0,
      totalValue: 0,
    };
    return {
      level,
      count: stockData.count,
      percentage: totalProducts > 0 ? (stockData.count / totalProducts) * 100 : 0,
      value: stockData.totalValue,
    };
  });

  const criticalProducts = await Product.aggregate([
    inventoryValueMatch,
    {
      $addFields: {
        quantityNum: {
          $cond: [
            { $eq: [{ $type: "$quentity" }, "number"] },
            "$quentity",
            {
              $cond: [
                { $in: [{ $type: "$quentity" }, ["string", "long", "int", "double", "decimal"]] },
                { $toDouble: "$quentity" },
                0,
              ],
            },
          ],
        },
        variantQtyNum: {
          $sum: {
            $map: {
              input: { $ifNull: ["$priceVariants", []] },
              as: "v",
              in: {
                $cond: [
                  { $eq: [{ $type: "$$v.quentity" }, "number"] },
                  "$$v.quentity",
                  {
                    $cond: [
                      { $in: [{ $type: "$$v.quentity" }, ["string", "long", "int", "double", "decimal"]] },
                      { $toDouble: "$$v.quentity" },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalStock: { $add: ["$quantityNum", "$variantQtyNum"] },
      },
    },
    { $match: { totalStock: { $lt: 10, $gte: 0 } } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
    inventoryValueAddFields,
    { $sort: { totalStock: 1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        quentity: 1,
        priceVariants: 1,
        generalPrice: 1,
        categoryName: "$categoryInfo.name",
        inventoryValue: 1,
        totalStock: 1,
      },
    },
  ]);

  return {
    stockLevels: formattedStockLevels,
    criticalProducts: criticalProducts.map((product: any) => {
      const currentPrice = product.generalPrice?.currentPrice ?? 0;
      const stockValue = product.inventoryValue ?? 0;
      return {
        _id: product._id.toString(),
        name: product.name,
        quantity: product.totalStock ?? 0,
        currentPrice,
        category: product.categoryName || "Uncategorized",
        stockValue,
      };
    }),
  };
}

// Category-wise Analysis - FIXED VERSION
async function getCategoryAnalysis() {
  const categoryData = await Product.aggregate([
    inventoryValueMatch,
    inventoryValueAddFields,
    {
      $addFields: {
        quantityNum: {
          $cond: [
            { $eq: [{ $type: "$quentity" }, "number"] },
            "$quentity",
            {
              $cond: [
                { $in: [{ $type: "$quentity" }, ["string", "long", "int", "double", "decimal"]] },
                { $toDouble: "$quentity" },
                0,
              ],
            },
          ],
        },
        variantQtyNum: {
          $sum: {
            $map: {
              input: { $ifNull: ["$priceVariants", []] },
              as: "v",
              in: {
                $cond: [
                  { $eq: [{ $type: "$$v.quentity" }, "number"] },
                  "$$v.quentity",
                  {
                    $cond: [
                      { $in: [{ $type: "$$v.quentity" }, ["string", "long", "int", "double", "decimal"]] },
                      { $toDouble: "$$v.quentity" },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalStock: { $add: ["$quantityNum", "$variantQtyNum"] },
        averagePrice: { $ifNull: ["$generalPrice.currentPrice", 0] },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo",
      },
    },
    {
      $unwind: {
        path: "$categoryInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$categoryInfo.name",
        productCount: { $sum: 1 },
        totalValue: { $sum: { $ifNull: ["$inventoryValue", 0] } },
        averagePrice: { $avg: "$averagePrice" },
        lowStockCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ["$totalStock", 10] },
                  { $gte: ["$totalStock", 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { productCount: -1 } },
  ]);

  const totalProducts = categoryData.reduce((sum, cat) => sum + cat.productCount, 0);

  return categoryData.map(category => ({
    category: category._id || "Uncategorized",
    productCount: category.productCount,
    totalValue: category.totalValue,
    averagePrice: Math.round(category.averagePrice || 0),
    lowStockCount: category.lowStockCount,
    percentage: totalProducts > 0 ? (category.productCount / totalProducts) * 100 : 0
  }));
}

// Price Analysis
async function getPriceAnalysis() {
  const priceRanges = await Product.aggregate([
    { 
      $match: { 
        isDeleted: false,
        "generalPrice.currentPrice": { $type: "number" }
      } 
    },
    {
      $bucket: {
        groupBy: "$generalPrice.currentPrice",
        boundaries: [0, 500, 1000, 5000, 10000, 50000, Infinity],
        default: "Other",
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  const rangeLabels = [
    { range: "Under ৳500", min: 0, max: 500 },
    { range: "৳500 - ৳1,000", min: 500, max: 1000 },
    { range: "৳1,000 - ৳5,000", min: 1000, max: 5000 },
    { range: "৳5,000 - ৳10,000", min: 5000, max: 10000 },
    { range: "৳10,000 - ৳50,000", min: 10000, max: 50000 },
    { range: "Over ৳50,000", min: 50000, max: Infinity }
  ];

  const formattedRanges = rangeLabels.map(range => {
    const rangeData = priceRanges.find(p => 
      p._id >= range.min && p._id < range.max
    ) || { count: 0 };
    
    return {
      range: range.range,
      count: rangeData.count,
      percentage: 0
    };
  });

  const totalProducts = formattedRanges.reduce((sum, range) => sum + range.count, 0);
  formattedRanges.forEach(range => {
    range.percentage = totalProducts > 0 ? (range.count / totalProducts) * 100 : 0;
  });

  const [priceStats, highestProduct, lowestProduct] = await Promise.all([
    Product.aggregate([
      { 
        $match: { 
          isDeleted: false,
          "generalPrice.currentPrice": { $type: "number" }
        } 
      },
      { 
        $group: { 
          _id: null, 
          average: { $avg: "$generalPrice.currentPrice" } 
        } 
      }
    ]),
    Product.findOne({ 
      isDeleted: false,
      "generalPrice.currentPrice": { $type: "number" }
    })
      .populate<{ category: { name: string } }>("category", "name")
      .sort({ "generalPrice.currentPrice": -1 })
      .select("name generalPrice.currentPrice category")
      .lean(),
    Product.findOne({ 
      isDeleted: false,
      "generalPrice.currentPrice": { $type: "number" }
    })
      .populate<{ category: { name: string } }>("category", "name")
      .sort({ "generalPrice.currentPrice": 1 })
      .select("name generalPrice.currentPrice category")
      .lean()
  ]);

  const highestProductData = highestProduct as any;
  const lowestProductData = lowestProduct as any;

  return {
    priceRanges: formattedRanges,
    averageProductPrice: Math.round(priceStats[0]?.average || 0),
    highestPricedProduct: {
      name: highestProductData?.name || "N/A",
      price: highestProductData?.generalPrice?.currentPrice || 0,
      category: highestProductData?.category?.name || "N/A"
    },
    lowestPricedProduct: {
      name: lowestProductData?.name || "N/A",
      price: lowestProductData?.generalPrice?.currentPrice || 0,
      category: lowestProductData?.category?.name || "N/A"
    }
  };
}

// Sales Performance Analysis
async function getSalesPerformance(timeRange: string) {
  const dateFilter = getDateFilter(timeRange);
  
  const topSellingProducts = await OrderModel.aggregate([
    { 
      $match: { 
        isDeleted: false,
        createdAt: dateFilter,
        orderStatus: { $ne: "cancelled" }
      } 
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products",
        salesCount: { $sum: 1 },
        revenue: { $sum: "$grandTotal" }
      }
    },
    { $sort: { salesCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" }
  ]);

  const categorySales = await OrderModel.aggregate([
    { 
      $match: { 
        isDeleted: false,
        createdAt: dateFilter,
        orderStatus: { $ne: "cancelled" }
      } 
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" },
    {
      $lookup: {
        from: "categories",
        localField: "productInfo.category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    { $unwind: "$categoryInfo" },
    {
      $group: {
        _id: "$categoryInfo.name",
        salesCount: { $sum: 1 },
        revenue: { $sum: "$grandTotal" }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  const totalRevenue = categorySales.reduce((sum, cat) => sum + cat.revenue, 0);

  return {
    topSellingProducts: topSellingProducts.map(product => ({
      productId: product._id.toString(),
      name: product.productInfo.name,
      salesCount: product.salesCount,
      revenue: product.revenue,
      quantitySold: product.salesCount
    })),
    categorySales: categorySales.map(category => ({
      category: category._id,
      salesCount: category.salesCount,
      revenue: category.revenue,
      percentage: totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0
    }))
  };
}

// Product Performance (Reviews & Ratings)
async function getProductPerformance() {
  const bestRatedProducts = await Product.find({
    isDeleted: false,
    averageRating: { $gt: 0, $type: "number" }
  })
  .populate("category", "name")
  .sort({ averageRating: -1 })
  .limit(10)
  .select("name averageRating totalReviewCount generalPrice.currentPrice category")
  .lean();

  const mostReviewedProducts = await Product.find({
    isDeleted: false,
    totalReviewCount: { $gt: 0, $type: "number" }
  })
  .populate("category", "name")
  .sort({ totalReviewCount: -1 })
  .limit(10)
  .select("name totalReviewCount averageRating category")
  .lean();

  return {
    bestRatedProducts: bestRatedProducts.map((product: any) => ({
      name: product.name,
      averageRating: product.averageRating,
      reviewCount: product.totalReviewCount,
      price: product.generalPrice?.currentPrice || 0,
      category: product.category?.name || "Uncategorized"
    })),
    mostReviewedProducts: mostReviewedProducts.map((product: any) => ({
      name: product.name,
      reviewCount: product.totalReviewCount,
      averageRating: product.averageRating,
      category: product.category?.name || "Uncategorized"
    }))
  };
}

// Inventory Trends
// Inventory Trends
async function getInventoryTrends(timeRange: string) {
  const monthlyData = await Product.aggregate([
    { 
      $match: { 
        isDeleted: false,
        quentity: { $type: "number" },
        "generalPrice.currentPrice": { $type: "number" },
        createdAt: { $exists: true, $ne: null } // Add this filter
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        productsAdded: { $sum: 1 },
        initialValue: { 
          $sum: { 
            $multiply: [
              { $ifNull: ["$quentity", 0] }, 
              { $ifNull: ["$generalPrice.currentPrice", 0] }
            ] 
          } 
        }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 6 }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return {
    monthlyInventoryChange: monthlyData.map(data => ({
      month: `${monthNames[(data._id.month - 1) || 0]} ${data._id.year || new Date().getFullYear()}`,
      productsAdded: data.productsAdded,
      inventoryValueChange: data.initialValue,
      stockMovement: data.productsAdded
    })),
    categoryGrowth: []
  };
}

// Branch Analysis
async function getBranchAnalysis() {
  const branches = await Branch.find({ isActive: true, isDeleted: false })
    .select("name contactNumber address")
    .lean();

  // Since products don't have branch info, return basic branch data
  // You can enhance this when you add branch reference to products
  return branches.map(branch => ({
    branchName: branch.name,
    productCount: 0,
    inventoryValue: 0,
    lowStockItems: 0,
    averageRating: 0
  }));
}

// Recent Activity
// Recent Activity
async function getRecentActivity() {
  const [lowStockAlerts, recentProducts] = await Promise.all([
    Product.find({
      isDeleted: false,
      quentity: { $lt: 10, $gte: 0, $type: "number" }
    })
    .populate("category", "name")
    .sort({ quentity: 1 })
    .limit(5)
    .select("name quentity category")
    .lean(),
    Product.find({ 
      isDeleted: false,
      createdAt: { $exists: true, $ne: null } // Add this filter
    })
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name category generalPrice.currentPrice createdAt")
    .lean()
  ]);

  return {
    lowStockAlerts: lowStockAlerts.map((product: any) => ({
      product: product.name,
      quantity: product.quentity || 0,
      category: product.category?.name || "Uncategorized",
      urgency: product.quentity === 0 ? "Out of Stock" : 
               product.quentity < 5 ? "Critical" : "Low"
    })),
    recentRestocks: [],
    newProducts: recentProducts.map((product: any) => ({
      name: product.name,
      category: product.category?.name || "Uncategorized",
      price: product.generalPrice?.currentPrice || 0,
      createdAt: product.createdAt ? product.createdAt.toISOString() : new Date().toISOString() // Safe access
    }))
  };
}

// Order Insights — single round-trip payload that powers the dashboard's
// orders KPI strip, trend chart, status donut, and recent-orders list.
// `timeRange` controls only the trend chart; KPI totals always reflect the
// lifetime view so merchants can see the whole picture at a glance.
async function getOrderInsights(timeRange: string) {
  const dateFilter = getDateFilter(timeRange);

  const [
    lifetimeTotals,
    statusAgg,
    paymentAgg,
    sourceAgg,
    monthlyOrders,
    recentOrders,
  ] = await Promise.all([
    // Lifetime headline numbers. Cancelled orders are excluded from revenue
    // so the average order value isn't dragged down by voids.
    OrderModel.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $ne: ["$orderStatus", "cancelled"] },
                "$grandTotal",
                0,
              ],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
            },
          },
          deliveredOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: {
              $cond: [{ $in: ["$orderStatus", ["pending", "confirmed", "processing"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    OrderModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    OrderModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          isDeleted: false,
          orderStatus: { $ne: "cancelled" },
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]),
    OrderModel.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "orderId name number grandTotal orderStatus paymentStatus paymentMethod createdAt",
      )
      .lean(),
  ]);

  const totalsRaw = lifetimeTotals[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    cancelledOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
  };
  const totalRevenueSum = statusAgg.reduce((sum, s) => sum + s.count, 0);
  const totalOrdersByPayment = paymentAgg.reduce(
    (sum, p) => sum + p.count,
    0,
  );
  const totalOrdersBySource = sourceAgg.reduce(
    (sum, s) => sum + s.count,
    0,
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return {
    totals: {
      totalOrders: totalsRaw.totalOrders,
      totalRevenue: totalsRaw.totalRevenue,
      averageOrderValue:
        totalsRaw.totalOrders - totalsRaw.cancelledOrders > 0
          ? totalsRaw.totalRevenue /
            (totalsRaw.totalOrders - totalsRaw.cancelledOrders)
          : 0,
      cancelledOrders: totalsRaw.cancelledOrders,
      deliveredOrders: totalsRaw.deliveredOrders,
      pendingOrders: totalsRaw.pendingOrders,
    },
    statusBreakdown: statusAgg.map((row) => ({
      status: row._id || "unknown",
      count: row.count,
      percentage:
        totalRevenueSum > 0 ? (row.count / totalRevenueSum) * 100 : 0,
    })),
    paymentBreakdown: paymentAgg.map((row) => ({
      method: row._id || "cash-on-delivery",
      count: row.count,
      percentage:
        totalOrdersByPayment > 0
          ? (row.count / totalOrdersByPayment) * 100
          : 0,
    })),
    monthlyOrders: monthlyOrders.map((row) => ({
      month: `${monthNames[(row._id.month - 1) || 0]} ${row._id.year || new Date().getFullYear()}`,
      orders: row.orders,
      revenue: row.revenue,
    })),
    sourceBreakdown: sourceAgg.map((row) => ({
      source: row._id || "storefront",
      count: row.count,
      percentage:
        totalOrdersBySource > 0 ? (row.count / totalOrdersBySource) * 100 : 0,
    })),
    recentOrders: (recentOrders as any[]).map((order) => ({
      orderId: order.orderId,
      name: order.name,
      number: order.number,
      grandTotal: order.grandTotal,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt
        ? new Date(order.createdAt).toISOString()
        : new Date().toISOString(),
    })),
  };
}

// Helper function for date filtering
function getDateFilter(timeRange: string) {
  const now = new Date();
  const filter: any = {};

  switch (timeRange) {
    case "7d":
      filter.$gte = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30d":
      filter.$gte = new Date(now.setDate(now.getDate() - 30));
      break;
    case "90d":
      filter.$gte = new Date(now.setDate(now.getDate() - 90));
      break;
    default:
      filter.$gte = new Date(now.setDate(now.getDate() - 30));
  }

  return filter;
}

// POST endpoint for custom inventory reports
export async function POST(request: NextRequest) {
  try {
    await connectDb();
    const { reportType, filters } = await request.json();

    let reportData;

    switch (reportType) {
      case 'stock-levels':
        reportData = await getDetailedStockLevels(filters);
        break;
      case 'category-performance':
        reportData = await getDetailedCategoryPerformance(filters);
        break;
      case 'price-analysis':
        reportData = await getDetailedPriceAnalysis(filters);
        break;
      default:
        return NextResponse.json(
          { success: false, message: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      reportType
    }, { status: 200 });

  } catch (error: any) {
    console.error("Custom inventory report error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate custom report"
      },
      { status: 500 }
    );
  }
}

// Additional detailed report functions
async function getDetailedStockLevels(filters: any) {
  const matchStage: any = { 
    isDeleted: false,
    quentity: { $type: "number" },
    "generalPrice.currentPrice": { $type: "number" }
  };
  
  if (filters?.category) {
    const category = await Category.findOne({ name: filters.category, isDeleted: false });
    if (category) {
      matchStage.category = category._id;
    }
  }

  if (filters?.stockLevel) {
    switch (filters.stockLevel) {
      case 'out-of-stock':
        matchStage.quentity = 0;
        break;
      case 'critical':
        matchStage.quentity = { $lt: 10, $gt: 0 };
        break;
      case 'low':
        matchStage.quentity = { $gte: 10, $lt: 30 };
        break;
    }
  }

  const products = await Product.find(matchStage)
    .populate("category", "name")
    .populate("subCategory", "name")
    .select("name quentity generalPrice.currentPrice category subCategory brand")
    .sort({ quentity: 1 })
    .lean();

  return {
    products: products.map((product: any) => ({
      name: product.name,
      quantity: product.quentity || 0,
      price: product.generalPrice?.currentPrice || 0,
      stockValue: (product.quentity || 0) * (product.generalPrice?.currentPrice || 0),
      category: product.category?.name || "Uncategorized",
      subCategory: product.subCategory?.name || "N/A",
      brand: product.brand || "N/A"
    })),
    totalProducts: products.length,
    totalValue: products.reduce((sum: number, product: any) => 
      sum + ((product.quentity || 0) * (product.generalPrice?.currentPrice || 0)), 0
    )
  };
}

async function getDetailedCategoryPerformance(filters: any) {
  const matchStage: any = { 
    isDeleted: false,
    orderStatus: { $ne: "cancelled" }
  };
  
  if (filters?.timeRange) {
    matchStage.createdAt = getDateFilter(filters.timeRange);
  }

  const categoryPerformance = await OrderModel.aggregate([
    { 
      $match: matchStage
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" },
    {
      $lookup: {
        from: "categories",
        localField: "productInfo.category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    { $unwind: "$categoryInfo" },
    {
      $group: {
        _id: "$categoryInfo.name",
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
        averageOrderValue: { $avg: "$grandTotal" },
        uniqueCustomers: { $addToSet: "$number" }
      }
    },
    {
      $project: {
        category: "$_id",
        totalOrders: 1,
        totalRevenue: 1,
        averageOrderValue: { $round: ["$averageOrderValue", 2] },
        uniqueCustomers: { $size: "$uniqueCustomers" }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  return categoryPerformance;
}

async function getDetailedPriceAnalysis(filters: any) {
  const matchStage: any = { 
    isDeleted: false,
    quentity: { $type: "number" },
    "generalPrice.currentPrice": { $type: "number" }
  };
  
  if (filters?.category) {
    const category = await Category.findOne({ name: filters.category, isDeleted: false });
    if (category) {
      matchStage.category = category._id;
    }
  }

  const priceAnalysis = await Product.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        averagePrice: { $avg: "$generalPrice.currentPrice" },
        minPrice: { $min: "$generalPrice.currentPrice" },
        maxPrice: { $max: "$generalPrice.currentPrice" },
        medianPrice: { $avg: "$generalPrice.currentPrice" },
        totalValue: {
          $sum: { 
            $multiply: [
              { $ifNull: ["$quentity", 0] }, 
              { $ifNull: ["$generalPrice.currentPrice", 0] }
            ] 
          }
        }
      }
    }
  ]);

  const priceDistribution = await Product.aggregate([
    { $match: matchStage },
    {
      $bucket: {
        groupBy: "$generalPrice.currentPrice",
        boundaries: [0, 1000, 5000, 10000, 25000, 50000, 100000, Infinity],
        output: {
          count: { $sum: 1 },
          totalValue: {
            $sum: { 
              $multiply: [
                { $ifNull: ["$quentity", 0] }, 
                { $ifNull: ["$generalPrice.currentPrice", 0] }
              ] 
            }
          }
        }
      }
    }
  ]);

  return {
    summary: priceAnalysis[0] || {},
    distribution: priceDistribution
  };
}