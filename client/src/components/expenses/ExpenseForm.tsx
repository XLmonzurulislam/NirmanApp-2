import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertExpenseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface ExpenseFormProps {
  siteId: number;
  open: boolean;
  onClose: () => void;
}

const ExpenseForm = ({ siteId, open, onClose }: ExpenseFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const expenseCategories = [
    'Materials',
    'Labor',
    'Transport',
    'Equipment',
    'Food',
    'Utilities',
    'Misc'
  ];
  
  const formSchema = insertExpenseSchema.extend({
    siteId: z.number().int().positive(),
    category: z.string().min(1, { message: t('categoryRequired') }),
    amount: z.number().positive({ message: t('amountPositive') }),
    date: z.date(),
    description: z.string().optional(),
    hasReceipt: z.boolean().default(false),
    receiptUrl: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteId,
      category: 'Materials',
      amount: 0,
      date: new Date(),
      description: "",
      hasReceipt: false,
      receiptUrl: "",
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // In a real app, we would upload the file to a server or cloud storage
      // and get a URL back. For now, we'll just use a placeholder.
      if (uploadedFile && values.hasReceipt) {
        values.receiptUrl = URL.createObjectURL(uploadedFile);
      }
      
      return await apiRequest("POST", "/api/expenses", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/expenses`] });
      toast({
        title: t('expenseAdded'),
        description: t('expenseAddedSuccess'),
      });
      resetAndClose();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('expenseAddFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createExpenseMutation.mutate(values);
  };
  
  const resetAndClose = () => {
    form.reset();
    setUploadedFile(null);
    onClose();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setUploadedFile(file);
      form.setValue("hasReceipt", true);
    } else {
      setUploadedFile(null);
      form.setValue("hasReceipt", false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('addExpense')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('expenseCategory')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('amount')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('date')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('expenseDescriptionPlaceholder')} 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasReceipt"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="flex flex-col">
                    <FormLabel>{t('receipt')}</FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <label 
                        htmlFor="hasReceipt" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('hasReceipt')}
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.watch("hasReceipt") && (
              <div className="space-y-2">
                <FormLabel>{t('uploadReceipt')}</FormLabel>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center">
                  <label htmlFor="receipt-upload" className="cursor-pointer block">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {uploadedFile ? uploadedFile.name : t('clickToUpload')}
                    </span>
                    <Input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
