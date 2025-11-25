import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, Filter, UserPlus, Users, Star, Calendar, MapPin, 
  Phone, Mail, Euro, Edit2, Trash2, UserCheck, UserX, ArrowLeft, Home, Bell, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotify } from '@/hooks/useNotify';
import { useDebounce } from '@/hooks/useDebounce';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import { useBookings } from '@/hooks/useBookings';
import StaffForm from '@/components/StaffForm';
import PWAInstallButton from '@/components/PWAInstallButton';
import NotificationSettings from '@/components/NotificationSettings';
import { CleaningStaff, StaffFilter, StaffSortBy } from '@/types/staff';
import { APP_CONFIG } from '@/constants/app';
import { sanitizeSearchTerm } from '@/utils/validation';

const PutzkraeftePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffFilter>('active');
  const [sortBy, setSortBy] = useState<StaffSortBy>('name');
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<CleaningStaff | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const { notify } = useNotify();
  
  const { bookings, totalCleaningTasks } = useBookings();
  
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
      notify({
        title: "Putzkraft hinzugefügt",
        description: "Die neue Putzkraft wurde erfolgreich erstellt.",
        eventType: "info"
      });
      setShowForm(false);
    } else {
      notify({
        title: "Fehler",
        description: result.error || "Putzkraft konnte nicht erstellt werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
    
    return result;
  }, [createStaff, notify]);

  const handleUpdateStaff = useCallback(async (formData: any) => {
    if (!editingStaff) return { success: false, error: 'Keine Putzkraft ausgewählt' };

    const result = await updateStaff(editingStaff.id, formData);
    
    if (result.success) {
      notify({
        title: "Putzkraft aktualisiert",
        description: "Die Änderungen wurden erfolgreich gespeichert.",
        eventType: "info"
      });
      setEditingStaff(null);
      setShowForm(false);
    } else {
      notify({
        title: "Fehler",
        description: result.error || "Änderungen konnten nicht gespeichert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
    
    return result;
  }, [editingStaff, updateStaff, notify]);

  const handleToggleStatus = useCallback(async (staff: CleaningStaff) => {
    const result = await toggleStaffStatus(staff.id, !staff.is_active);
    
    if (result.success) {
      notify({
        title: "Status geändert",
        description: `${staff.name} wurde ${staff.is_active ? 'deaktiviert' : 'aktiviert'}.`,
        eventType: "info"
      });
    } else {
      notify({
        title: "Fehler",
        description: result.error || "Status konnte nicht geändert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [toggleStaffStatus, notify]);

  const handleDelete = useCallback(async (staff: CleaningStaff) => {
    const result = await deleteStaff(staff.id);
    
    if (result.success) {
      notify({
        title: "Putzkraft entfernt",
        description: `${staff.name} wurde erfolgreich gelöscht.`,
        eventType: "info"
      });
    } else {
      notify({
        title: "Fehler",
        description: result.error || "Putzkraft konnte nicht gelöscht werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [deleteStaff, notify]);

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Amela Reinigungsportal</h1>
                </div>
              </div>
              <Button 
                onClick={handleCancelForm}
                variant="outline"
                className="hover-scale"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Liste
              </Button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex space-x-6">
              <Link to="/">
                <Button variant="ghost" size="sm" className="my-2 hover-scale">
                  🏠 Reinigungen ({totalCleaningTasks})
                </Button>
              </Link>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="my-2 hover-scale">
                  📅 Kalender
                </Button>
              </Link>
              <Button variant="default" size="sm" className="my-2">
                👥 Putzkräfte
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="my-2 hover-scale"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              >
                🔔 Benachrichtigungen
              </Button>
            </div>
            
            {/* Mobile Navigation - Icon Only */}
            <div className="sm:hidden flex justify-around items-center gap-1 py-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center relative hover-scale">
                  <span className="text-lg">🏠</span>
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] text-[10px] px-1 bg-primary text-primary-foreground">
                    {totalCleaningTasks}
                  </Badge>
                </Button>
              </Link>
              <Link to="/calendar">
                <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale">
                  <span className="text-lg">📅</span>
                </Button>
              </Link>
              <Button variant="default" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center">
                <span className="text-lg">👥</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale"
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              >
                <span className="text-lg">🔔</span>
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StaffForm
            staff={editingStaff || undefined}
            onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}
            onCancel={handleCancelForm}
          />
        </main>
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
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Amela Reinigungsportal</h1>
              </div>
            </div>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex space-x-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                🏠 Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                📅 Kalender
              </Button>
            </Link>
            <Button variant="default" size="sm" className="my-2">
              👥 Putzkräfte
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="my-2 hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              🔔 Benachrichtigungen
            </Button>
          </div>
          
          {/* Mobile Navigation - Icon Only */}
          <div className="sm:hidden flex justify-around items-center gap-1 py-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center relative hover-scale">
                <span className="text-lg">🏠</span>
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] text-[10px] px-1 bg-primary text-primary-foreground">
                  {totalCleaningTasks}
                </Badge>
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale">
                <span className="text-lg">📅</span>
              </Button>
            </Link>
            <Button variant="default" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center">
              <span className="text-lg">👥</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              <span className="text-lg">🔔</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showNotificationSettings ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Benachrichtigungseinstellungen</h1>
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationSettings(false)}
                className="hover-scale"
              >
                Zurück zu Putzkräfte
              </Button>
            </div>
            <NotificationSettings />
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm text-muted-foreground">👥 Gesamt</p>
                      <p className="text-2xl font-bold">{stats.totalStaff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm text-muted-foreground">✅ Aktiv</p>
                      <p className="text-2xl font-bold">{stats.activeStaff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm text-muted-foreground">⭐ Ø Bewertung</p>
                      <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-sm text-muted-foreground">📋 Aufträge</p>
                      <p className="text-2xl font-bold">{stats.totalAssignments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Header with Action Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Putzkräfte verwalten</h2>
                <p className="text-sm text-muted-foreground">Verwalten Sie Ihr Reinigungsteam</p>
              </div>
              <Button 
                onClick={() => setShowForm(true)}
                className="hover-scale"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Neue Putzkraft
              </Button>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Suche & Filter</span>
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount} aktiv
                      </Badge>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Filter className="w-4 h-4" />
                        {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="space-y-4 mt-4">
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
                  </CollapsibleContent>
                </Collapsible>
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
        )}
      </main>
    </div>
  );
};

export default PutzkraeftePage;