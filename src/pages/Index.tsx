import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Home, Users, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
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
                <h1 className="text-xl font-bold text-foreground">Amela Ferienhausmanagement</h1>
                <p className="text-sm text-muted-foreground">Zentrale Verwaltung für alle Services</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Willkommen im Management Portal
          </h2>
          <p className="text-lg text-muted-foreground">
            Verwalten Sie alle Aspekte Ihres Ferienhausbetriebs an einem Ort
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reinigungsportal */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/cleaning" className="block">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Reinigungsportal</CardTitle>
                    <p className="text-sm text-muted-foreground">Reinigungsaufträge verwalten</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Übersicht aller Buchungen mit Reinigungsaufträgen, Terminplanung und Putzkraft-Zuweisungen.
                </p>
                <Button variant="outline" className="w-full">
                  Zum Reinigungsportal
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Kalender */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link to="/calendar" className="block">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Kalender</CardTitle>
                    <p className="text-sm text-muted-foreground">Termine im Überblick</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monatskalender mit allen Check-ins, Check-outs, Reinigungen und Wäschediensten.
                </p>
                <Button variant="outline" className="w-full">
                  Zum Kalender
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Personal Verwaltung */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-75">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Personal</CardTitle>
                  <p className="text-sm text-muted-foreground">Mitarbeiter verwalten</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Verwaltung von Reinigungskräften, Wäschedienst und anderen Serviceprovidern.
              </p>
              <Button variant="outline" className="w-full" disabled>
                Bald verfügbar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Heute geplant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Reinigungsaufträge</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Diese Woche</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Anstehende Termine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Häuser</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">In Verwaltung</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
