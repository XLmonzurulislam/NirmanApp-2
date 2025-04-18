import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertNoteSchema, Note } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface NoteFormProps {
  siteId: number;
  note: Note | null;
  open: boolean;
  onClose: () => void;
}

const NoteForm = ({ siteId, note, open, onClose }: NoteFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const categories = [
    'Important',
    'Progress',
    'Issue',
    'Meeting',
    'General'
  ];
  
  const formSchema = insertNoteSchema.extend({
    siteId: z.number().int().positive(),
    title: z.string().min(2, { message: t('titleRequired') }),
    content: z.string().min(2, { message: t('contentRequired') }),
    category: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteId,
      title: note?.title || "",
      content: note?.content || "",
      category: note?.category || undefined,
    },
  });
  
  useEffect(() => {
    if (note) {
      form.reset({
        siteId,
        title: note.title,
        content: note.content,
        category: note.category,
      });
    } else {
      form.reset({
        siteId,
        title: "",
        content: "",
        category: undefined,
      });
    }
  }, [note, form, siteId]);

  const createNoteMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (note) {
        return await apiRequest("PUT", `/api/notes/${note.id}`, values);
      } else {
        return await apiRequest("POST", "/api/notes", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/notes`] });
      toast({
        title: note ? t('noteUpdated') : t('noteCreated'),
        description: note ? t('noteUpdatedSuccess') : t('noteCreatedSuccess'),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: note ? t('noteUpdateFailed') : t('noteCreateFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createNoteMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{note ? t('editNote') : t('createNote')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('noteTitle')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('noteTitlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('category')}</FormLabel>
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
                      {categories.map((category) => (
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('noteContent')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('noteContentPlaceholder')} 
                      className="min-h-[200px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {note ? t('update') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteForm;
