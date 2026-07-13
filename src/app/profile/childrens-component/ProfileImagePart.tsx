"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Crown,
  User,
  Shield,
  Edit,
  MapPin,
  Star,
} from "lucide-react";

interface ProfileImagePartProps {
  image: string | null;
  name: string | null;
  email: string | null;
  number: string | null;
  username: string | null;
  role: string | null;
}

export default function ProfileImagePart({
  image,
  name,
  email,
  number,
  username,
  role,
}: ProfileImagePartProps) {
  const defaultProfileImage = "https://i.postimg.cc/XJDtkf1V/images.jpg";
  const coverImage =
    "https://i.postimg.cc/FH556xrz/desktop-wallpaper-ecommerce-website-design-company-noida-e-commerce-banner-design-e-commerce.jpg";

  const getInitials = (value: string | null) => {
    if (!value) return "U";
    return value
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDetails = (value: string | null) => {
    switch (value?.toLowerCase()) {
      case "admin":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: <Shield className="h-3 w-3" />,
        };
      case "super-admin":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <Crown className="h-3 w-3" />,
        };
      case "moderator":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Star className="h-3 w-3" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: <User className="h-3 w-3" />,
        };
    }
  };

  const roleDetails = getRoleDetails(role);

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="relative h-32 md:h-40 bg-gradient-to-r from-blue-600 to-purple-600">
        <Image
          width={1000}
          height={160}
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-lg -mt-16 md:-mt-20">
            <AvatarImage
              src={image || defaultProfileImage}
              alt={name || "User"}
            />
            <AvatarFallback className="text-2xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 w-full">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                {name || "Unknown User"}
              </h1>
              {role && (
                <Badge
                  variant="outline"
                  className={`${roleDetails.color} border px-3 py-1 rounded-full flex items-center gap-1 w-fit`}
                >
                  {roleDetails.icon}
                  <span className="text-xs font-medium capitalize">
                    {role.replace("-", " ")}
                  </span>
                </Badge>
              )}
            </div>

            {username && <p className="text-sm text-gray-500">@{username}</p>}

            <div className="flex flex-col gap-2 text-sm text-gray-600 pt-2">
              {email && (
                <div className="flex items-center gap-2 justify-center min-w-0">
                  <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}

              {number && (
                <div className="flex items-center gap-2 justify-center">
                  <Phone className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{number}</span>
                </div>
              )}
            </div>

            {(!email || !number) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                <p className="text-yellow-800 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {!email && !number
                    ? "Add your email and phone number to complete your profile"
                    : !email
                    ? "Add your email address to complete your profile"
                    : "Add your phone number to complete your profile"}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link href="/complete-account?edit=1">
                <Button className="gap-2 w-full">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
