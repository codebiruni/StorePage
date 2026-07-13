"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ProfileImagePart from "./childrens-component/ProfileImagePart";
import ProfileInfoPart from "./childrens-component/ProfileInfoPart";
import useContextData from "@/defaults/custom-component/useContextData";

interface Contact {
  contactName: string;
  contact: string;
  _id: string;
}

interface Address {
  addressName: string;
  district: string;
  city: string;
  addressLine: string;
  _id: string;
}

interface ProfileData {
  _id: string;
  name: string;
  username: string;
  email: string;
  number: string;
  dateOfBirth: string;
  contacts: Contact[];
  address: Address[];
  image: string;
  referralCode: string;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    email?: string;
    role?: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: ProfileData;
}

export default function UserProfile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { UserData, handleUser } = useContextData();

  useEffect(() => {
    if (!UserData) {
      router.push("/");
    }
  }, [UserData, router]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/user/logout", {
        method: "POST",
      });
      if (response.ok) {
        // Clear context user state if available, then send to home.
        if (typeof handleUser === "function") {
          handleUser(null);
        }
        router.refresh();
        router.push("/");
      } else {
        console.error("Logout API responded with an error");
      }
    } catch (error) {
      console.error("Network error during logout:", error);
    }
  };

  const fetchProfileData = async () => {
    try {
      setError(null);
      const res = await fetch(`/api/v1/profile`, {
        method: "GET",
        credentials: "include",
      });

      if (res.status === 404 || res.statusText === "Not Found") {
        router.push("/complete-account");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      if (data.success && data.data) {
        setProfileData(data.data);
      } else {
        router.push("/complete-account");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load profile"
      );
    }
  };

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchProfileData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your personal information and account details
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1">
            <ProfileImagePart
              image={profileData?.image || null}
              name={profileData?.name || null}
              email={profileData?.email || profileData?.user?.email || null}
              number={profileData?.number || null}
              username={profileData?.username || null}
              role={profileData?.user?.role || null}
            />
          </aside>

          <section className="lg:col-span-2">
            <ProfileInfoPart profileData={profileData} />
          </section>
        </div>
      </div>
    </div>
  );
}
