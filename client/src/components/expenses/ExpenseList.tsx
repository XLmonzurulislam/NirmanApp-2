import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Expense } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowUpDown, Trash, Receipt, FileDown, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface ExpenseListProps {
  siteId: number;
  onOpenAddForm: () => void;
  onViewReceipt: (expense: Expense) => void;
}

const ExpenseList = ({ siteId, onOpenAddForm, onViewReceipt }: ExpenseListProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: [`/api/sites/${siteId}/expenses`],
    enabled: !!siteId,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      return await apiRequest("DELETE", `/api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/expenses`] });
      toast({
        title: t('expenseDeleted'),
        description: t('expenseDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('expenseDeleteFailed'),
        variant: "destructive",
      });
    }
  });
  
  // Process filters and sort the expenses
  const filteredExpenses = expenses?.filter(expense => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount.toString().includes(searchTerm);
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || 
      expense.category.toLowerCase() === categoryFilter.toLowerCase();
    
    // Date range filter
    let matchesDateRange = true;
    const today = new Date();
    const expenseDate = new Date(expense.date);
    
    if (dateRangeFilter === "today") {
      matchesDateRange = expenseDate.toDateString() === today.toDateString();
    } else if (dateRangeFilter === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      matchesDateRange = expenseDate >= weekAgo;
    } else if (dateRangeFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      matchesDateRange = expenseDate >= monthAgo;
    }
    
    return matchesSearch && matchesCategory && matchesDateRange;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc" 
        ? new Date(a.date).getTime() - new Date(b.date).getTime() 
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "amount") {
      return sortOrder === "asc" 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    } else { // category
      return sortOrder === "asc" 
        ? a.category.localeCompare(b.category) 
        : b.category.localeCompare(a.category);
    }
  });
  
  // Calculate total filtered amount
  const totalAmount = filteredExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  
  // Extract categories for filter
  const categories = expenses 
    ? [...new Set(expenses.map(expense => expense.category))]
    : [];
  
  const handleDelete = (expenseId: number) => {
    if (window.confirm(t('confirmExpenseDelete'))) {
      deleteMutation.mutate(expenseId);
    }
  };
  
  const toggleSort = (field: "date" | "amount" | "category") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 space-y-0">
        <CardTitle className="text-xl">{t('expensesList')}</CardTitle>
        <Button onClick={onOpenAddForm}>
          <Plus size={16} className="mr-2" />
          {t('addExpense')}
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Search and Filter */}
        <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={t('searchExpenses')}
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
            
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('dateRange')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTime')}</SelectItem>
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="week">{t('lastWeek')}</SelectItem>
                <SelectItem value="month">{t('lastMonth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Total Amount Display */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('filteredTotal')}
              </h3>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="mt-2 md:mt-0">
              <Button variant="outline" size="sm">
                <FileDown size={16} className="mr-2" />
                {t('exportToCSV')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Expenses Table */}
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
                  <TableHead onClick={() => toggleSort("date")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('date')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("category")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('category')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort("amount")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t('amount')}
                      <ArrowUpDown size={14} className="ml-2" />
                    </div>
                  </TableHead>
                  <TableHead>{t('description')}</TableHead>
                  <TableHead>{t('receipt')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {t('noExpensesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
                      <TableCell>
                        {expense.hasReceipt ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onViewReceipt(expense)}
                          >
                            <Eye size={16} className="mr-1" />
                            {t('view')}
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">{t('noReceipt')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(expense.id)}
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

export default ExpenseList;
