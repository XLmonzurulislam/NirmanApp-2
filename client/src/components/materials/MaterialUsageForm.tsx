import { useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertMaterialTransactionSchema } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MaterialUsageFormProps {
  siteId: number;
  materialId: number | null;
  open: boolean;
  onClose: () => void;
}

const MaterialUsageForm = ({ siteId, materialId, open, onClose }: MaterialUsageFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: material } = useQuery({
    queryKey: [`/api/materials/${materialId}`],
    enabled: !!materialId,
  });
  
  const formSchema = insertMaterialTransactionSchema.extend({
    materialId: z.number().int().positive(),
    siteId: z.number().int().positive(),
    transactionType: z.enum(["added", "used"]),
    quantity: z.number().positive({ message: t('quantityPositive') }),
    notes: z.string().optional(),
    recordedBy: z.string().min(1, { message: t('recordedByRequired') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialId: materialId || 0,
      siteId,
      transactionType: "added",
      quantity: 0,
      notes: "",
      recordedBy: "Admin",
    },
  });
  
  // Update form values when materialId changes
  useEffect(() => {
    if (materialId) {
      form.setValue("materialId", materialId);
    }
  }, [materialId, form]);

  const createTransactionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/material-transactions", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/materials`] });
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${materialId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/material-transactions`] });
      toast({
        title: t('stockUpdated'),
        description: t('stockUpdatedSuccess'),
      });
      resetAndClose();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('stockUpdateFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTransactionMutation.mutate(values);
  };
  
  const resetAndClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t('updateMaterialStock')}
            {material && `: ${material.name}`}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t('transactionType')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="added" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('addStock')}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="used" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {t('useStock')}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantity')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  {material && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('currentStock')}: {material.quantity} {material.unit}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notes')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('notesPlaceholder')} 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recordedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recordedBy')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('recordedByPlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createTransactionMutation.isPending}>
                {createTransactionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('update')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialUsageForm;
