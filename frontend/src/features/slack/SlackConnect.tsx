import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Slack, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { slackApi } from '../../services/api';

interface SlackConnectProps {
  status?: { connected: boolean; teamName?: string | null } | null;
}

export function SlackConnect({ status }: SlackConnectProps) {
  const queryClient = useQueryClient();

  const disconnectMutation = useMutation({
    mutationFn: slackApi.disconnect,
    onSuccess: () => {
      toast.success('Slack disconnected');
      queryClient.invalidateQueries({ queryKey: ['slack'] });
    },
    onError: () => toast.error('Failed to disconnect Slack'),
  });

  if (status?.connected) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Slack Connected</p>
            {status.teamName && (
              <p className="text-xs text-green-600">Workspace: {status.teamName}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => disconnectMutation.mutate()}
          disabled={disconnectMutation.isPending}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <Slack className="w-4 h-4 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Connect Slack</p>
          <p className="text-xs text-gray-500">Get notified when rate limits are reached</p>
        </div>
      </div>
      <a
        href="/auth/slack/connect"
        className="flex items-center gap-1.5 text-xs bg-[#4A154B] text-white px-3 py-1.5 rounded-lg hover:bg-[#611f69] transition-colors font-medium"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Connect Slack
      </a>
    </div>
  );
}
