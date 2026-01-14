import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MapPin, School, Check, Clock } from 'lucide-react';
import { useState } from 'react';

interface ParentCardProps {
  parent: {
    user_id: string;
    school_name?: string;
    neighborhood?: string;
    profile?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  onConnect: (userId: string) => Promise<void>;
  showConnectButton?: boolean;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

const ParentCard = ({ parent, onConnect, showConnectButton = true, connectionStatus = 'none' }: ParentCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await onConnect(parent.user_id);
    setIsConnecting(false);
  };

  const renderActionButton = () => {
    if (!showConnectButton) return null;

    if (connectionStatus === 'connected') {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <Check className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }

    if (connectionStatus === 'pending') {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Request Sent
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        {isConnecting ? 'Sending...' : 'Connect'}
      </Button>
    );
  };

  return (
    <Card className="p-5 rounded-2xl border-border/50 hover:border-border hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white font-semibold text-lg shadow-md">
            {parent.profile?.first_name?.charAt(0) || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-base text-foreground">
              {parent.profile?.first_name} {parent.profile?.last_name}
            </h4>
            <p className="text-sm text-muted-foreground">{parent.profile?.email}</p>
          </div>
        </div>
        {renderActionButton()}
      </div>

      <div className="flex gap-2 flex-wrap">
        {parent.school_name && (
          <Badge variant="secondary" className="text-xs rounded-full px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            <School className="h-3 w-3 mr-1" />
            {parent.school_name}
          </Badge>
        )}
        {parent.neighborhood && (
          <Badge variant="outline" className="text-xs rounded-full px-3 py-1">
            <MapPin className="h-3 w-3 mr-1" />
            {parent.neighborhood}
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default ParentCard;
