import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/layout/LanguageContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { insertAttendanceSchema, Worker } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AttendanceFormProps {
  siteId: number;
  open: boolean;
  onClose: () => void;
}

const AttendanceForm = ({ siteId, open, onClose }: AttendanceFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { present: boolean, hours: number, notes: string }>>({});
  
  const { data: workers, isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: [`/api/sites/${siteId}/workers`],
    enabled: !!siteId && open,
  });
  
  // Filter workers based on search term
  const filteredWorkers = workers?.filter(worker => 
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  useEffect(() => {
    // Initialize attendance records when workers are loaded
    if (workers) {
      const initialRecords: Record<number, { present: boolean, hours: number, notes: string }> = {};
      workers.forEach(worker => {
        initialRecords[worker.id] = { present: true, hours: 8, notes: "" };
      });
      setAttendanceRecords(initialRecords);
    }
  }, [workers]);
  
  const createAttendanceMutation = useMutation({
    mutationFn: async (values: any) => {
      // Create all attendance records in sequence
      for (const record of values) {
        await apiRequest("POST", "/api/attendance", record);
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sites/${siteId}/attendance`] });
      toast({
        title: t('attendanceMarked'),
        description: t('attendanceMarkedSuccess'),
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('attendanceMarkFailed'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const records = Object.entries(attendanceRecords).map(([workerId, record]) => ({
      workerId: parseInt(workerId),
      siteId,
      date: new Date(date),
      present: record.present,
      hoursWorked: record.present ? record.hours : 0,
      notes: record.notes
    }));
    
    createAttendanceMutation.mutate(records);
  };
  
  const handlePresentChange = (workerId: number, present: boolean) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], present }
    }));
  };
  
  const handleHoursChange = (workerId: number, hours: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], hours: parseFloat(hours) || 0 }
    }));
  };
  
  const handleNotesChange = (workerId: number, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], notes }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('markAttendance')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <FormLabel>{t('date')}</FormLabel>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <FormLabel>{t('search')}</FormLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder={t('searchWorkers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {workersLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p>{t('loadingWorkers')}</p>
            </div>
          ) : filteredWorkers && filteredWorkers.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
              {filteredWorkers.map(worker => (
                <Card key={worker.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{worker.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {worker.role} • ৳{worker.dailyWage}/day
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`present-${worker.id}`}
                          checked={attendanceRecords[worker.id]?.present}
                          onCheckedChange={(checked) => handlePresentChange(worker.id, !!checked)}
                        />
                        <label htmlFor={`present-${worker.id}`} className="text-sm">
                          {t('present')}
                        </label>
                      </div>
                      
                      {attendanceRecords[worker.id]?.present && (
                        <div className="w-20">
                          <Input 
                            type="number" 
                            min="0"
                            max="24"
                            placeholder="Hours"
                            value={attendanceRecords[worker.id]?.hours.toString()}
                            onChange={(e) => handleHoursChange(worker.id, e.target.value)}
                            className="h-8"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <Input 
                          placeholder={t('notes')}
                          value={attendanceRecords[worker.id]?.notes}
                          onChange={(e) => handleNotesChange(worker.id, e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? t('noWorkersMatchSearch') : t('noWorkersFound')}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={createAttendanceMutation.isPending || !filteredWorkers?.length}
          >
            {createAttendanceMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t('submitAttendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceForm;
