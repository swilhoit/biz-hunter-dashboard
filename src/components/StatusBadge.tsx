import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'live' | 'removed' | 'pending';
  lastVerified?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  lastVerified, 
  className = "" 
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'live':
        return {
          icon: CheckCircle,
          text: 'Live',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        };
      case 'removed':
        return {
          icon: AlertTriangle,
          text: 'Removed',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Checking',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const { icon: Icon, text, className: statusClassName } = getStatusInfo();

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays === 0 && diffHours === 0) {
      return 'Just now';
    } else if (diffDays === 0) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const lastSeenText = formatLastSeen(lastVerified);

  return (
    <Badge 
      className={`text-xs flex items-center space-x-1 ${statusClassName} ${className}`}
      title={lastVerified ? `Last verified: ${new Date(lastVerified).toLocaleString()}` : undefined}
    >
      <Icon className="h-3 w-3" />
      <span>{text}</span>
      {lastSeenText && status !== 'pending' && (
        <span className="text-xs opacity-75">• {lastSeenText}</span>
      )}
    </Badge>
  );
};