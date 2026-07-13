import Link from "next/link";

export default function StepNotFound() {
  return (
    <div
      className="step-container step-container--narrow"
      style={{
        textAlign: "center",
        padding: "80px 20px",
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px" }}>
        পণ্য পাওয়া যায়নি
      </h1>
      <p style={{ color: "#475569", margin: "0 0 24px" }}>
        দুঃখিত, এই লিংকে আর কোনো পণ্য নেই। হয়তো লিংকের মেয়াদ শেষ বা পণ্যটি
        মুছে ফেলা হয়েছে।
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "10px 18px",
          background: "#16a34a",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 700,
        }}
      >
        হোম পেজে যান
      </Link>
    </div>
  );
}