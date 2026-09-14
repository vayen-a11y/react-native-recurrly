import Constants from 'expo-constants'
import PostHog from 'posthog-react-native'

const rawProjectToken = Constants.expoConfig?.extra?.posthogProjectToken
const rawHost = Constants.expoConfig?.extra?.posthogHost
const normalizedProjectToken = typeof rawProjectToken === 'string'
  ? rawProjectToken.trim()
  : ''
const normalizedHost = typeof rawHost === 'string' ? rawHost.trim() : ''
const projectToken = normalizedProjectToken
  && normalizedProjectToken !== 'phc_your_project_token_here'
  ? normalizedProjectToken
  : null
const host = normalizedHost && !normalizedHost.includes('your-posthog-host')
  ? normalizedHost
  : null

if ((!projectToken || !host) && __DEV__) {
  const missingVariable = !projectToken
    ? 'POSTHOG_PROJECT_TOKEN'
    : 'POSTHOG_HOST'

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  )
}

export const posthog = projectToken && host
  ? new PostHog(projectToken, {host})
  : null
