import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BulkProviderImport from '@/components/admin/BulkProviderImport';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, Database } from 'lucide-react';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Manage providers and system data
            </p>
          </div>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Provider Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BulkProviderImport />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Environment:</span> Development</p>
                  <p><span className="font-semibold">Database:</span> Supabase</p>
                  <p><span className="font-semibold">Search Integration:</span> Google Places API</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;