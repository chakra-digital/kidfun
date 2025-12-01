import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MapPin, School } from 'lucide-react';
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
}

const ParentCard = ({ parent, onConnect, showConnectButton = true }: ParentCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await onConnect(parent.user_id);
    setIsConnecting(false);
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-lg">
            {parent.profile?.first_name} {parent.profile?.last_name}
          </h4>
          <p className="text-sm text-muted-foreground">{parent.profile?.email}</p>
        </div>
        {showConnectButton && (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {isConnecting ? 'Sending...' : 'Connect'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {parent.school_name && (
          <div className="flex items-center text-sm">
            <School className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{parent.school_name}</span>
          </div>
        )}
        {parent.neighborhood && (
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{parent.neighborhood}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        {parent.school_name && (
          <Badge variant="secondary" className="text-xs">
            <School className="h-3 w-3 mr-1" />
            {parent.school_name}
          </Badge>
        )}
        {parent.neighborhood && (
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {parent.neighborhood}
          </Badge>
        )}
      </div>
    </Card>
  );
};

export default ParentCard;
