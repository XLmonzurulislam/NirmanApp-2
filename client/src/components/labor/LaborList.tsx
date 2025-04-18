import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Worker } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, ArrowUpDown, Trash, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LaborListProps {
  siteId: number;
  onOpenAddForm: () => void;
  onOpenAttendanceForm: () => void;
}

const LaborList = ({ siteId, onOpenAddForm, onOpenAttendanceForm }: LaborListProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"name" | "role" | "dailyWage">("name");
  
  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: [`/api/sites/${siteId}/workers`],
    enabled: !!siteId,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (workerId: number) => {
      return await apiRequest("DELETE", `/api/workers/${workerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/workers`] });
      toast({
        title: t('workerDeleted'),
        description: t('workerDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('workerDeleteFailed'),
        variant: "destructive",
      });
    }
  });
  
  // Process filters and sort the workers
  const filteredWorkers = workers?.filter(worker => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.phone && worker.phone.includes(searchTerm));
    
    // Role filter
    const matchesRole = roleFilter === "all" || 
      worker.role.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === "role") {
      return sortOrder === "asc" 
        ? a.role.localeCompare(b.role) 
        : b.role.localeCompare(a.role);
    } else { // dailyWage
      return sortOrder === "asc" 
        ? a.dailyWage - b.dailyWage 
        : b.dailyWage - a.dailyWage;
    }
  });
  
  // Extract roles for filter
  const roles = workers 
    ? [...new Set(workers.map(worker => worker.role))]
    : [];
  
  const handleDelete = (workerId: number) => {
    if (window.confirm(t('confirmWorkerDelete'))) {
      deleteMutation.mutate(workerId);
    }
  };
  
  const toggleSort = (field: "name" | "role" | "dailyWage") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
        <CardTitle className="text-xl">{t('workersList')}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onOpenAttendanceForm}>
            <UserCheck size={16} className="mr-2" />
            {t('markAttendance')}
          </Button>
          <Button onClick={onOpenAddForm}>
            <Plus size={16} className="mr-2" />
            {t('addWorker')}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Search and Filter */}
        <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={t('searchWorkers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('allRoles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allRoles')}</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role.toLowerCase()}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Workers Table */}
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
                      {t('name')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("role")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('role')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("dailyWage")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('dailyWage')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead>{t('contact')}</TableHead>
                  <TableHead>{t('joinDate')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {t('noWorkersFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkers?.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.name}</TableCell>
                      <TableCell>{worker.role}</TableCell>
                      <TableCell>৳ {worker.dailyWage.toLocaleString()}</TableCell>
                      <TableCell>{worker.phone || '-'}</TableCell>
                      <TableCell>{new Date(worker.joinDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(worker.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LaborList;
