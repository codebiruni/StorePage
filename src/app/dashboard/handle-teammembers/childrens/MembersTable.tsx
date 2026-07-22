/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface IManagement {
  _id: string;
  name: string;
  image?: string;
  user: {
    _id: string;
    email: string;
    number?: string;
    username?: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export default function MembersTable() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [managementData, setManagementData] = useState<IManagement[]>([]);
  const [totalManagement, setTotalManagement] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedManagementId, setSelectedManagementId] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(false);
  const itemsPerPage = 50;

  // Fetch management data
  const fetchManagement = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/v1/management?search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          credentials: "include",
          
        }
      );

      const data = await res.json();
      if (data.success) {
        setManagementData(data.data);
        setTotalManagement(data.pagination.total);
      } else {
        toast.error("Failed to fetch management data");
      }
    } catch (error) {
      console.error("Error fetching management data:", error);
      toast.error("Failed to fetch management data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagement();
  }, [searchTerm, currentPage]);

  // Filter management based on search term
  const filteredManagement = managementData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      (item.user?.email &&
        item.user.email.toLowerCase().includes(searchLower)) ||
      (item.user?.number &&
        item.user.number.toLowerCase().includes(searchLower)) ||
      (item.user?.username &&
        item.user.username.toLowerCase().includes(searchLower))
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(totalManagement / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredManagement.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (id: string) => {
    router.push(`/dashboard/handle-teammembers/edit/${id}`);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/handle-teammembers/details/${id}`);
  };

  const handleDeleteClick = (id: string, isDeleted: boolean) => {
    setSelectedManagementId(id);
    setDeleteDialogOpen(true);
    setDeleteInfo(isDeleted);
  };

  const confirmDelete = async () => {
    if (!selectedManagementId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/v1/management/${selectedManagementId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Management ${deleteInfo ? "restored" : "deleted"} successfully`
        );

        // Update the local state instead of refetching to immediately reflect the change
        setManagementData((prevManagement) =>
          prevManagement.map((item) =>
            item._id === selectedManagementId
              ? { ...item, isDeleted: !deleteInfo }
              : item
          )
        );

        // Also update the total count if needed
        if (deleteInfo) {
          setTotalManagement((prev) => prev + 1);
        } else {
          setTotalManagement((prev) => prev - 1);
        }
      } else {
        toast.error(
          data.message ||
            `Failed to ${deleteInfo ? "restore" : "delete"} management`
        );
      }
    } catch (error) {
      console.error("Error updating management:", error);
      toast.error(`Failed to ${deleteInfo ? "restore" : "delete"} management`);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedManagementId(null);
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "secondary";
      case "super-admin":
        return "destructive";
      case "menager":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusVariant = (isDeleted?: boolean) => {
    return isDeleted ? "destructive" : "default";
  };

  const getStatusText = (isDeleted?: boolean) => {
    return isDeleted ? "Deleted" : "Active";
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b bg-muted/30">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">All members</p>
          <p className="text-xs text-muted-foreground">
            Search, review and manage every staff member
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by name, email, or number..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-xs"
          />
          <Badge variant="secondary" className="px-3 py-1.5 text-xs">
            Total {totalManagement}
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>User Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.user?.username && (
                          <p className="text-sm text-gray-500">
                            @{item.user.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.user?.email && (
                        <p className="text-sm">{item.user.email}</p>
                      )}
                      {item.user?.number && (
                        <p className="text-sm">{item.user.number}</p>
                      )}
                      {!item.user && (
                        <p className="text-sm text-gray-400">No user account</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.user ? (
                      <Badge variant={getRoleVariant(item.user.role)}>
                        {item.user.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No Role</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(item.isDeleted)}>
                      {getStatusText(item.isDeleted)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-[1000]">
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleViewDetails(item._id)}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => handleEdit(item._id)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600"
                          onClick={() =>
                            handleDeleteClick(item._id, item.isDeleted || false)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          {item.isDeleted ? "Restore" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No management members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t bg-muted/30 text-sm">
        <p className="text-muted-foreground">
          Showing{" "}
          {totalManagement === 0
            ? 0
            : (currentPage - 1) * itemsPerPage + 1}{" "}
          to {Math.min(currentPage * itemsPerPage, totalManagement)} of{" "}
          {totalManagement} members
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] z-[1001]">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {deleteInfo ? "restore" : "delete"} this
              management member?{" "}
              {deleteInfo
                ? "They will be accessible again."
                : "This action will soft delete the member."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="animate-spin text-white" />
              ) : (
                ""
              )}
              {deleteInfo ? "Restore" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
