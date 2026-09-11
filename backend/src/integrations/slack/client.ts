import config from '../../config';

export const SLACK_SCOPES = 'chat:write,channels:read';

export function getSlackAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.slack.clientId,
    scope: SLACK_SCOPES,
    redirect_uri: config.slack.redirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}
