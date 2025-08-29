import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BulkProviderImport from '@/components/admin/BulkProviderImport';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, Database, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, loading } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  // Redirect non-authenticated users
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return null; // Will be redirected by useEffect
  }

  // Check if user has admin access - email-based for now
  const adminEmails = [
    'your-email@example.com', // Replace with your actual email
    // Add more admin emails as needed
  ];
  
  const hasAdminAccess = user && adminEmails.includes(user.email || '');

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-2xl mx-auto text-center">
            <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
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
            <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block">
              ✓ Authenticated as {user.email}
            </div>
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