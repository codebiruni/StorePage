"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AddCategoryForm from "@/app/dashboard/categories/children/AddCategoryForm";
import AddSubCategoryForm from "@/app/dashboard/sub-categories/children/AddSubCategoryForm";

export interface CategoryOption {
  _id: string;
  name: string;
}

interface BaseProps {
  /** The fetch endpoint. For "category" -> /api/v1/product/category… */
  endpoint: string;
  /** Extra query params (e.g. { category: selectedId } for sub-categories). */
  extraParams?: Record<string, string | undefined>;
  /** Disabled when no parent has been chosen (e.g. sub-categories). */
  disabled?: boolean;
  disabledHint?: string;
}

interface CategoryProps extends BaseProps {
  name: "category";
  label: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}
interface SubCategoryProps extends BaseProps {
  name: "subCategory";
  label: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

type Props = CategoryProps | SubCategoryProps;

/**
 * Reusable shadcn-combobox-backed category selector.
 * - Type to search (server-side via `?search=…`).
 * - Keyboard-navigable, accessible (Radix Popover + cmdk).
 * - Plays nicely with react-hook-form via FormField/FormControl.
 */
export default function CategoryCombobox({
  form,
  name,
  label,
  placeholder = "Select…",
  endpoint,
  extraParams,
  disabled,
  disabledHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const value = form.watch(name);
  const selected = useMemo(
    () => options.find((o) => o._id === value),
    [options, value],
  );

  const handleOpenCreateModal = () => {
    setOpen(false);
    setIsCreateOpen(true);
  };

  const handleCreated = (item: any) => {
    setIsCreateOpen(false);
    if (item?._id && item?.name) {
      setOptions((prev) => {
        const exists = prev.some((o) => o._id === item._id);
        if (exists) return prev;
        return [{ _id: item._id, name: item.name }, ...prev];
      });
      form.setValue(name, item._id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  // Debounced fetch — avoids hammering the API while the user is still typing.
  useEffect(() => {
    if (disabled) {
      setOptions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          search: search.trim(),
          page: "1",
          limit: "30",
          ...Object.fromEntries(
            Object.entries(extraParams ?? {}).filter(
              ([, v]) => v !== undefined && v !== "",
            ),
          ),
        });
        const res = await fetch(`${endpoint}?${qs.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setOptions(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("CategoryCombobox fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, endpoint, extraParams, disabled]);

  // When the form has an existing value (edit mode) and we have not yet
  // fetched that exact row, ensure the label still shows. We do this by
  // re-fetching with the empty search so the first page includes the saved id.
  useEffect(() => {
    if (!value || options.some((o) => o._id === value)) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({
          search: "",
          page: "1",
          limit: "30",
          ...Object.fromEntries(
            Object.entries(extraParams ?? {}).filter(
              ([, v]) => v !== undefined && v !== "",
            ),
          ),
        });
        const res = await fetch(`${endpoint}?${qs.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setOptions(Array.isArray(data?.data) ? data.data : []);
      } catch {
        /* swallow — shown "Select…" */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenCreateModal}
                  className="h-6 px-1.5 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-md cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  New {label}
                </Button>
              )}
            </div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                      "w-full justify-between font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {disabled
                      ? disabledHint ?? "Pick a parent first"
                      : selected?.name ?? placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={`Search ${label.toLowerCase()}…`}
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </div>
                    ) : options.length === 0 ? (
                      <CommandEmpty className="py-4 px-3 text-center space-y-2">
                        <p className="text-xs text-muted-foreground">
                          No matching {label.toLowerCase()} found.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleOpenCreateModal}
                          className="text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 h-7 cursor-pointer mx-auto"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Create {search.trim() ? `"${search.trim()}"` : `New ${label}`}
                        </Button>
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {options.map((opt) => (
                          <CommandItem
                            key={opt._id}
                            value={opt.name}
                            onSelect={() => {
                              field.onChange(opt._id);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                opt._id === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {opt.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                  {/* Quick create action footer inside the dropdown */}
                  <div className="p-1 border-t border-border/60 bg-muted/20">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenCreateModal}
                      className="w-full justify-start text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 h-8 gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {search.trim()
                        ? `Create "${search.trim()}"`
                        : `Create new ${label.toLowerCase()}`}
                    </Button>
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Creation Modal for Category / Subcategory */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {name === "category" ? "Create New Category" : "Create New Subcategory"}
            </DialogTitle>
            <DialogDescription>
              {name === "category"
                ? "Add a new product category to organize your store."
                : "Add a new subcategory linked to your selected category."}
            </DialogDescription>
          </DialogHeader>
          {name === "category" ? (
            <AddCategoryForm
              initialName={search.trim()}
              onSuccess={handleCreated}
              onCancel={() => setIsCreateOpen(false)}
            />
          ) : (
            <AddSubCategoryForm
              initialName={search.trim()}
              initialCategoryId={extraParams?.category}
              onSuccess={handleCreated}
              onCancel={() => setIsCreateOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
