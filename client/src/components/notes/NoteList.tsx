import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { Note } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NoteListProps {
  siteId: number;
  onEditNote: (note: Note | null) => void;
}

const NoteList = ({ siteId, onEditNote }: NoteListProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: [`/api/sites/${siteId}/notes`],
    enabled: !!siteId,
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/notes`] });
      toast({
        title: t('noteDeleted'),
        description: t('noteDeletedSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('noteDeleteFailed'),
        variant: "destructive",
      });
    }
  });
  
  // Filter notes based on search term
  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (note.category && note.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleDelete = (noteId: number) => {
    if (window.confirm(t('confirmNoteDelete'))) {
      deleteNoteMutation.mutate(noteId);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    
    switch (category.toLowerCase()) {
      case 'important':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'progress':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'issue':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 'meeting':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder={t('searchNotes')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-md" />
            ))}
          </div>
        ) : !filteredNotes || filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <h3 className="text-lg font-medium mb-2">{t('noNotesFound')}</h3>
            <p>{t('noNotesDescription')}</p>
            <Button className="mt-4" onClick={() => onEditNote(null)}>
              {t('createFirstNote')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="border rounded-md p-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{note.title}</h3>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => onEditNote(note)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarDays size={14} className="mr-1" />
                  {formatDate(note.date)}
                  {note.category && (
                    <Badge variant="outline" className={`ml-2 ${getCategoryColor(note.category)}`}>
                      {note.category}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {note.content.length > 150 
                    ? `${note.content.substring(0, 150)}...` 
                    : note.content
                  }
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteList;
