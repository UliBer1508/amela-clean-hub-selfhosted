import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Search, Filter, UserPlus, Users, Star, Calendar, MapPin, 
  Phone, Mail, Euro, Edit2, Trash2, UserCheck, UserX, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import StaffForm from '@/components/StaffForm';
import { CleaningStaff, StaffFilter, StaffSortBy } from '@/types/staff';
import { APP_CONFIG } from '@/constants/app';
import { sanitizeSearchTerm } from '@/utils/validation';

const PutzkraeftePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffFilter>('active');
  const [sortBy, setSortBy] = useState<StaffSortBy>('name');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<CleaningStaff | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const { toast } = useToast();
  
  const {
    staff,
    loading,
    error,
    stats,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    filteredAndSortedStaff,
    refetch
  } = useCleaningStaff();

  const handleCreateStaff = useCallback(async (formData: any) => {
    const result = await createStaff(formData);
    
    if (result.success) {
      toast({
        title: "Putzkraft hinzugefügt",
        description: "Die neue Putzkraft wurde erfolgreich erstellt.",
      });
      setShowForm(false);
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Putzkraft konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
    
    return result;
  }, [createStaff, toast]);

  const handleUpdateStaff = useCallback(async (formData: any) => {
    if (!editingStaff) return { success: false, error: 'Keine Putzkraft ausgewählt' };

    const result = await updateStaff(editingStaff.id, formData);
    
    if (result.success) {
      toast({
        title: "Putzkraft aktualisiert", 
        description: "Die Änderungen wurden erfolgreich gespeichert.",
      });
      setEditingStaff(null);
      setShowForm(false);
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
    
    return result;
  }, [editingStaff, updateStaff, toast]);

  const handleToggleStatus = useCallback(async (staff: CleaningStaff) => {
    const result = await toggleStaffStatus(staff.id, !staff.is_active);
    
    if (result.success) {
      toast({
        title: "Status geändert",
        description: `${staff.name} wurde ${staff.is_active ? 'deaktiviert' : 'aktiviert'}.`,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Status konnte nicht geändert werden.",
        variant: "destructive",
      });
    }
  }, [toggleStaffStatus, toast]);

  const handleDelete = useCallback(async (staff: CleaningStaff) => {
    const result = await deleteStaff(staff.id);
    
    if (result.success) {
      toast({
        title: "Putzkraft entfernt",
        description: `${staff.name} wurde erfolgreich gelöscht.`,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Putzkraft konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  }, [deleteStaff, toast]);

  const handleEdit = useCallback((staff: CleaningStaff) => {
    setEditingStaff(staff);
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditingStaff(null);
  }, []);

  const currentStaff = useMemo(() => 
    filteredAndSortedStaff(debouncedSearchTerm, statusFilter, sortBy), 
    [filteredAndSortedStaff, debouncedSearchTerm, statusFilter, sortBy]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'name') count++;
    return count;
  }, [debouncedSearchTerm, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Lade Putzkräfte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 story-link"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zu Reinigungen
            </Link>
          </div>
          <StaffForm
            staff={editingStaff || undefined}
            onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}
            onCancel={handleCancelForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link 
                to="/" 
                className="inline-flex items-center text-muted-foreground hover:text-foreground story-link"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Link>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Putzkräfte-Verwaltung</h1>
                <p className="text-sm text-muted-foreground">Verwalten Sie Ihre Reinigungsmitarbeiter</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="hover-scale"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Neue Putzkraft
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamt</p>
                    <p className="text-2xl font-bold">{stats.totalStaff}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aktiv</p>
                    <p className="text-2xl font-bold">{stats.activeStaff}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ø Bewertung</p>
                    <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Aufträge</p>
                    <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Suche & Filter</span>
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount} aktiv
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Suche nach Name, E-Mail oder Adresse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(sanitizeSearchTerm(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select value={statusFilter} onValueChange={(value: StaffFilter) => setStatusFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: StaffSortBy) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sortierung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nach Name</SelectItem>
                      <SelectItem value="rating">Nach Bewertung</SelectItem>
                      <SelectItem value="assignments">Nach Aufträgen</SelectItem>
                      <SelectItem value="created_at">Nach Datum</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('active');
                      setSortBy('name');
                    }}
                    disabled={activeFilterCount === 0}
                    className="hover-scale"
                  >
                    Filter zurücksetzen
                  </Button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {currentStaff.length} von {stats.totalStaff} Putzkräften
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentStaff.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Keine Putzkräfte gefunden. Versuchen Sie andere Filter oder fügen Sie neue hinzu.
                  </p>
                </CardContent>
              </Card>
            ) : (
              currentStaff.map((member) => (
                <Card key={member.id} className="hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {member.name}
                        </h3>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {member.quality_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      
                      {member.phone && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      
                      {member.address && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{member.address}</span>
                        </div>
                      )}
                      
                      {member.hourly_rate && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Euro className="w-4 h-4" />
                          <span>{member.hourly_rate.toFixed(2)} €/Std</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                      <div>
                        <p className="text-lg font-semibold">{member.total_assignments}</p>
                        <p className="text-xs text-muted-foreground">Aufträge gesamt</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{member.completed_assignments}</p>
                        <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                      </div>
                    </div>

                    {member.availability_days.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Verfügbare Tage:</p>
                        <div className="flex flex-wrap gap-1">
                          {member.availability_days.map(day => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {day.slice(0, 2)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Bearbeiten
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(member)}
                      >
                        {member.is_active ? (
                          <UserX className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Putzkraft löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie {member.name} löschen möchten? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(member)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PutzkraeftePage;