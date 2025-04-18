import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertPhotoSchema } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image } from "lucide-react";

interface PhotoUploadProps {
  siteId: number;
  open: boolean;
  onClose: () => void;
}

const PhotoUpload = ({ siteId, open, onClose }: PhotoUploadProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const formSchema = insertPhotoSchema.extend({
    siteId: z.number().int().positive(),
    title: z.string().min(2, { message: t('titleRequired') }),
    description: z.string().optional(),
    imageUrl: z.string().min(2, { message: t('imageRequired') })
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteId,
      title: "",
      description: "",
      imageUrl: "",
    },
  });

  const createPhotoMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // In a real-world app, we would upload the file to cloud storage
      // For this demo, we're using a placeholder URL
      return await apiRequest("POST", "/api/photos", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/photos`] });
      toast({
        title: t('photoUploaded'),
        description: t('photoUploadedSuccess'),
      });
      resetAndClose();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('photoUploadFailed'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Ensure we have an image URL (would be from cloud storage in real app)
    values.imageUrl = uploadedImageUrl || "https://placehold.co/800x600?text=Construction+Photo";
    
    createPhotoMutation.mutate(values);
  };
  
  const resetAndClose = () => {
    form.reset();
    setUploadedFiles([]);
    setUploadedImageUrl(null);
    onClose();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setUploadedFiles(filesArray);
      
      // Generate a temporary URL for preview
      const imageUrl = URL.createObjectURL(filesArray[0]);
      setUploadedImageUrl(imageUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('uploadPhoto')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>{t('selectImage')}</FormLabel>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
                {uploadedImageUrl ? (
                  <div className="p-2">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Preview" 
                      className="max-h-[200px] mx-auto rounded" 
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        setUploadedFiles([]);
                        setUploadedImageUrl(null);
                      }}
                    >
                      {t('removeImage')}
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="photo-upload" className="cursor-pointer block p-8">
                    <Image className="h-10 w-10 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('dragAndDropOrClick')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      JPG, PNG, GIF {t('acceptedFormats')}
                    </p>
                    <Input
                      id="photo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('photoTitle')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('photoTitlePlaceholder')} {...field} />
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
                      placeholder={t('photoDescriptionPlaceholder')} 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
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
              <Button 
                type="submit" 
                disabled={createPhotoMutation.isPending}
              >
                {createPhotoMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('upload')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;
