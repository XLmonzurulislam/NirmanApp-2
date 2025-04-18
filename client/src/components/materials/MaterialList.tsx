import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Link, useLocation } from "wouter";
import { Material } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package2, Search, Plus, ArrowUpDown, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaterialListProps {
  siteId: number;
  onOpenAddForm: () => void;
  onOpenUsageForm: (materialId: number) => void;
}

const MaterialList = ({ siteId, onOpenAddForm, onOpenUsageForm }: MaterialListProps) => {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "lastUpdated">("name");
  
  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: [`/api/sites/${siteId}/materials`],
    enabled: !!siteId,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (materialId: number) => {
      return await apiRequest("DELETE", `/api/materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/materials`] });
      toast({
        title: t('materialDeleted'),
        description: t('materialDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('materialDeleteFailed'),
        variant: "destructive",
      });
    }
  });
  
  // Process filters and sort the materials
  const filteredMaterials = materials?.filter(material => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || 
      material.category.toLowerCase() === categoryFilter.toLowerCase();
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = material.quantity < material.minStockLevel;
    } else if (stockFilter === "sufficient") {
      matchesStock = material.quantity >= material.minStockLevel;
    }
    
    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === "quantity") {
      return sortOrder === "asc" 
        ? a.quantity - b.quantity 
        : b.quantity - a.quantity;
    } else { // lastUpdated
      return sortOrder === "asc" 
        ? new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime() 
        : new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });
  
  // Extract categories for filter
  const categories = materials 
    ? [...new Set(materials.map(material => material.category))]
    : [];
  
  const handleDelete = (materialId: number) => {
    if (window.confirm(t('confirmMaterialDelete'))) {
      deleteMutation.mutate(materialId);
    }
  };
  
  const toggleSort = (field: "name" | "quantity" | "lastUpdated") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };
  
  const getStockStatus = (material: Material) => {
    const stockPercentage = (material.quantity / material.minStockLevel) * 100;
    
    if (stockPercentage < 40) {
      return {
        label: t('critical'),
        badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      };
    } else if (stockPercentage < 100) {
      return {
        label: t('low'),
        badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      };
    } else {
      return {
        label: t('sufficient'),
        badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      };
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
        <CardTitle className="text-xl">{t('materialsList')}</CardTitle>
        <Button onClick={onOpenAddForm}>
          <Plus size={16} className="mr-2" />
          {t('addMaterial')}
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Search and Filter */}
        <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={t('searchMaterials')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('stockStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="low">{t('lowStock')}</SelectItem>
                <SelectItem value="sufficient">{t('sufficient')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Materials Table */}
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-20 w-full mb-2" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("name")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('material')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("quantity")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('currentStock')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("lastUpdated")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('lastUpdated')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      {t('noMaterialsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials?.map((material) => {
                    const status = getStockStatus(material);
                    const stockPercentage = Math.min(100, Math.round((material.quantity / material.minStockLevel) * 100));
                    
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <Package2 className="text-gray-600 dark:text-gray-300" size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{material.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{material.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{material.quantity} {material.unit}</div>
                          <div className="flex items-center mt-1">
                            <div className="w-20 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div 
                                className={`h-2 rounded-full ${
                                  stockPercentage < 40 ? 'bg-red-500' : 
                                  stockPercentage < 100 ? 'bg-yellow-500' : 'bg-green-500'
                                }`} 
                                style={{ width: `${stockPercentage}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{stockPercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(material.lastUpdated).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.badge}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onOpenUsageForm(material.id)}
                          >
                            {t('updateStock')}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialList;
