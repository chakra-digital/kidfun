import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, X } from 'lucide-react';
import { ThreadTimeProposal, ProposalStatus } from '@/hooks/useCoordinationThreads';
import { cn } from '@/lib/utils';

interface ThreadProposalsProps {
  proposals: ThreadTimeProposal[];
  currentUserId: string;
  onAccept: (proposalId: string) => void;
}

const statusStyles: Record<ProposalStatus, string> = {
  proposed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  accepted: 'bg-green-500/10 text-green-600 border-green-500/20',
  withdrawn: 'bg-muted text-muted-foreground'
};

export function ThreadProposals({ proposals, currentUserId, onAccept }: ThreadProposalsProps) {
  const activeProposals = proposals.filter(p => p.status === 'proposed');
  const acceptedProposal = proposals.find(p => p.status === 'accepted');

  if (acceptedProposal) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <Check className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-medium text-green-700">
            {format(new Date(acceptedProposal.proposed_date), 'EEEE, MMMM d • h:mm a')}
          </p>
          <p className="text-sm text-green-600">
            Confirmed by {acceptedProposal.proposer_name}
          </p>
        </div>
      </div>
    );
  }

  if (activeProposals.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No times proposed yet</p>
        <p className="text-xs">Be the first to suggest a time!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Proposed times:</p>
      {activeProposals.map((proposal) => {
        const isMyProposal = proposal.proposed_by === currentUserId;
        
        return (
          <div
            key={proposal.id}
            className={cn(
              "flex items-center justify-between gap-3 p-3 rounded-lg border",
              statusStyles[proposal.status]
            )}
          >
            <div className="flex-1">
              <p className="font-medium">
                {format(new Date(proposal.proposed_date), 'EEE, MMM d • h:mm a')}
              </p>
              <p className="text-xs opacity-70">
                Proposed by {isMyProposal ? 'you' : proposal.proposer_name}
              </p>
              {proposal.notes && (
                <p className="text-xs mt-1 opacity-70">"{proposal.notes}"</p>
              )}
            </div>
            
            {!isMyProposal && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAccept(proposal.id)}
                className="shrink-0"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            )}
            
            {isMyProposal && (
              <Badge variant="outline" className="shrink-0">Your proposal</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
