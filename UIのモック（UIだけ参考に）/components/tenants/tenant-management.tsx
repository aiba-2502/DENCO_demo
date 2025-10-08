"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash, Building, Key, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Sample tenant data - would be fetched from API in real app
const initialTenants = [
  {
    id: "tenant-1",
    name: "Acme Corp",
    apiKey: "vg-1234567890abcdef",
    apiSecret: "vg-secret-abcdefghijklmnopqrstuvwxyz",
    status: "active" as const,
    userCount: 12,
    createdAt: "2024-12-10T14:30:00",
  },
  {
    id: "tenant-2",
    name: "Globex Inc",
    apiKey: "vg-0987654321fedcba",
    apiSecret: "vg-secret-zyxwvutsrqponmlkjihgfedcba",
    status: "active" as const,
    userCount: 8,
    createdAt: "2025-01-15T10:15:00",
  },
  {
    id: "tenant-3",
    name: "Stark Industries",
    apiKey: "vg-abcdef1234567890",
    apiSecret: "vg-secret-1234567890abcdefghijklmnop",
    status: "inactive" as const,
    userCount: 5,
    createdAt: "2025-02-20T09:30:00",
  },
];

interface Tenant {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  status: "active" | "inactive";
  userCount: number;
  createdAt: string;
}

interface FormData {
  name: string;
  apiKey: string;
  apiSecret: string;
  status: "active" | "inactive";
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [showApiSecret, setShowApiSecret] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    apiKey: "",
    apiSecret: "",
    status: "active",
  });

  // Filter tenants based on search term and status filter
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      searchTerm === "" ||
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.apiKey.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      apiKey: "",
      apiSecret: "",
      status: "active",
    });
    setCurrentTenant(null);
  };

  // Handle add tenant
  const handleAddTenant = () => {
    const newTenant: Tenant = {
      id: `tenant-${tenants.length + 1}`,
      ...formData,
      userCount: 0,
      createdAt: new Date().toISOString(),
    };

    setTenants([...tenants, newTenant]);
    setIsAddDialogOpen(false);
    resetForm();
  };

  // Handle edit tenant button click
  const handleEditClick = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setFormData({
      name: tenant.name,
      apiKey: tenant.apiKey,
      apiSecret: tenant.apiSecret,
      status: tenant.status,
    });
    setIsEditDialogOpen(true);
  };

  // Handle update tenant
  const handleUpdateTenant = () => {
    if (!currentTenant) return;

    const updatedTenants = tenants.map((tenant) =>
      tenant.id === currentTenant.id
        ? { ...tenant, ...formData }
        : tenant
    );

    setTenants(updatedTenants);
    setIsEditDialogOpen(false);
    resetForm();
  };

  // Handle delete tenant
  const handleDeleteTenant = (tenantId: string) => {
    const updatedTenants = tenants.filter((tenant) => tenant.id !== tenantId);
    setTenants(updatedTenants);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Toggle API secret visibility
  const toggleApiSecretVisibility = (tenantId: string) => {
    setShowApiSecret((prev) => ({
      ...prev,
      [tenantId]: !prev[tenantId],
    }));
  };

  // Mask API secret
  const maskApiSecret = (secret: string) => {
    return `${secret.substring(0, 5)}...${secret.substring(secret.length - 5)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Building className="h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant with Vonage API credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Tenant Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  name="apiKey"
                  placeholder="Vonage API Key"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiSecret" className="text-right">
                  API Secret
                </Label>
                <Input
                  id="apiSecret"
                  name="apiSecret"
                  type="password"
                  placeholder="Vonage API Secret"
                  value={formData.apiSecret}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <div className="flex items-center space-x-4 col-span-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === "active"}
                      onChange={() => setFormData((prev) => ({ ...prev, status: "active" }))}
                      className="form-radio"
                    />
                    <span>Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={formData.status === "inactive"}
                      onChange={() => setFormData((prev) => ({ ...prev, status: "inactive" }))}
                      className="form-radio"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTenant}>Add Tenant</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Search</CardTitle>
          <CardDescription>
            Find tenants by name or API key
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by name or API key"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <CardDescription>
            Manage tenants and their Vonage API credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>API Secret</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-xs">{tenant.apiKey}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center space-x-1">
                        <span>
                          {showApiSecret[tenant.id] ? tenant.apiSecret : maskApiSecret(tenant.apiSecret)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => toggleApiSecretVisibility(tenant.id)}
                        >
                          {showApiSecret[tenant.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tenant.status === "active" ? "default" : "secondary"}
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.userCount}</TableCell>
                    <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {tenant.name}? This action cannot be undone and will remove all associated users and data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTenant(tenant.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center">
                      <Search className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No tenants match your search criteria</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Tenant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information and API credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="edit-apiKey"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-apiSecret" className="text-right">
                API Secret
              </Label>
              <Input
                id="edit-apiSecret"
                name="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <div className="flex items-center space-x-4 col-span-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={() => setFormData((prev) => ({ ...prev, status: "active" }))}
                    className="form-radio"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="status"
                    value="inactive"
                    checked={formData.status === "inactive"}
                    onChange={() => setFormData((prev) => ({ ...prev, status: "inactive" }))}
                    className="form-radio"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTenant}>Update Tenant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}