import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Download, CheckCircle, XCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported_count: number;
  skipped_count?: number;
  error_count: number;
  total_found: number;
  providers: Array<{
    id: string;
    business_name: string;
    location: string;
    google_rating: number;
  }>;
  errors: Array<{
    name: string;
    error: string;
  }>;
}

const BulkProviderImport = () => {
  const [searchType, setSearchType] = useState<string>('nearby');
  const [limit, setLimit] = useState<number>(20);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      toast.info('Starting provider import...', {
        description: 'This may take a few minutes'
      });

      const { data, error } = await supabase.functions.invoke('import-providers', {
        body: { searchType, limit }
      });

      if (error) {
        throw error;
      }

      setImportResult(data);
      
      if (data.success) {
        const skippedMessage = data.skipped_count ? `, ${data.skipped_count} already existed` : '';
        toast.success(`Import completed!`, {
          description: `${data.imported_count} providers imported${skippedMessage}`
        });
      } else {
        toast.error('Import failed', {
          description: data.error || 'Unknown error occurred'
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Import failed', {
        description: error.message || 'Failed to import providers'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Provider Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="searchType">
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearby">Nearby Places</SelectItem>
                  <SelectItem value="keyword">Keyword Search</SelectItem>
                  <SelectItem value="all">Both (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limit">Import Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={1}
                max={100}
              />
            </div>
          </div>

          <Alert>
            <AlertDescription>
              This will search Google Places for kid-friendly activities in Central Texas and import them as unverified provider profiles.
              Existing providers (based on Google Place ID) will be skipped.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            className="w-full"
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isImporting ? 'Importing...' : 'Start Import'}
          </Button>
        </CardContent>
      </Card>

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported_count}
                </div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.skipped_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.error_count}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.total_found}
                </div>
                <div className="text-sm text-muted-foreground">Found</div>
              </div>
            </div>

            {importResult.providers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Successfully Imported:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div>
                        <div className="font-medium">{provider.business_name}</div>
                        <div className="text-sm text-muted-foreground">{provider.location}</div>
                      </div>
                      {provider.google_rating && (
                        <Badge variant="secondary">
                          ⭐ {provider.google_rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 rounded">
                      <div className="font-medium">{error.name}</div>
                      <div className="text-sm text-red-600">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkProviderImport;