"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Phone,
  User,
  Gift,
  AlertCircle,
  Home,
  Briefcase,
  Plus,
} from "lucide-react";

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
}

interface ProfileInfoPartProps {
  profileData: ProfileData | null;
}

export default function ProfileInfoPart({ profileData }: ProfileInfoPartProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!profileData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Incomplete
            </h3>
            <p className="text-gray-600 mb-6">
              Your profile information is missing. Please complete your profile
              to access all features.
            </p>
            <Link href="/complete-account">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Complete Your Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasMissingInfo =
    !profileData.dateOfBirth ||
    !profileData.contacts?.length ||
    !profileData.address?.length;

  return (
    <div className="space-y-6">
      {hasMissingInfo && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800">
                  Profile Incomplete
                </h4>
                <p className="text-yellow-700 text-sm">
                  Some information is missing from your profile
                </p>
              </div>
            </div>
            <Link href="/complete-account?edit=1">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-yellow-300"
              >
                <Plus className="h-4 w-4" />
                Complete Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Full Name
              </label>
              <p className="text-gray-900 font-medium break-words">
                {profileData.name || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Username
              </label>
              <p className="text-gray-900 font-medium">
                @{profileData.username || "Not set"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Date of Birth
              </label>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                {formatDate(profileData.dateOfBirth)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Member Since
              </label>
              <p className="text-gray-900 font-medium">
                {new Date(profileData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Loyalty Points
              </label>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-500" />
                {profileData.loyaltyPoints || 0} points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileData.contacts?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData.contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="border rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium capitalize">
                      {contact.contactName}
                    </span>
                  </div>
                  <p className="text-gray-700 break-words">{contact.contact}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="mb-3">No contact information added</p>
              <Link href="/complete-account?edit=1">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Contacts
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileData.address?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileData.address.map((address) => (
                <div
                  key={address._id}
                  className="border rounded-lg p-4 hover:border-green-200 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      {address.addressName.toLowerCase() === "home" ? (
                        <Home className="h-4 w-4 text-green-600" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <span className="font-medium capitalize">
                      {address.addressName}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700 break-words">
                      {address.addressLine}
                    </p>
                    <p className="text-gray-600">
                      {address.district}, {address.city}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="mb-3">No address information added</p>
              <Link href="/complete-account?edit=1">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}