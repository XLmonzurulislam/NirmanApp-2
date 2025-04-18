import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { useLocation } from "wouter";
import ExpenseList from "@/components/expenses/ExpenseList";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { Site, Expense } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const Expenses = () => {
  const { t } = useLanguage();
  const [location] = useLocation();
  
  const [addFormOpen, setAddFormOpen] = useState(location.includes("action=add"));
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [receiptViewOpen, setReceiptViewOpen] = useState(false);
  
  const { data: sites, isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });
  
  // Use the first site as default
  const currentSite = sites?.[0];
  
  const handleOpenAddForm = () => {
    setAddFormOpen(true);
  };
  
  const handleCloseAddForm = () => {
    setAddFormOpen(false);
  };
  
  const handleViewReceipt = (expense: Expense) => {
    setSelectedExpense(expense);
    setReceiptViewOpen(true);
  };
  
  const handleCloseReceiptView = () => {
    setSelectedExpense(null);
    setReceiptViewOpen(false);
  };

  return (
    <div className="p-4 md:p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('expenseTracker')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {sitesLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : currentSite ? (
              `${currentSite.name} - ${t('manageExpenses')}`
            ) : (
              t('noProjectSelected')
            )}
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      {currentSite ? (
        <>
          <ExpenseList 
            siteId={currentSite.id}
            onOpenAddForm={handleOpenAddForm}
            onViewReceipt={handleViewReceipt}
          />
          
          <ExpenseForm 
            siteId={currentSite.id}
            open={addFormOpen}
            onClose={handleCloseAddForm}
          />
          
          {/* Receipt Viewer Dialog */}
          <Dialog open={receiptViewOpen} onOpenChange={handleCloseReceiptView}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('receipt')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-4">
                {selectedExpense?.receiptUrl ? (
                  <img 
                    src={selectedExpense.receiptUrl} 
                    alt="Receipt"
                    className="max-w-full max-h-[500px] object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">{t('noReceiptImage')}</p>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <h3 className="font-medium">{selectedExpense?.category}</h3>
                  <p className="text-gray-500 text-sm">{selectedExpense?.description}</p>
                  <p className="text-lg font-bold mt-2">
                    {selectedExpense?.amount.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'BDT',
                      maximumFractionDigits: 0
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedExpense && new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                
                <Button className="mt-4" onClick={handleCloseReceiptView}>
                  {t('close')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-xl font-semibold mb-2">{t('noExpensesYet')}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
            {t('selectOrCreateProject')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Expenses;
