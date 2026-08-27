export type SyncState = Record<string, unknown>

export type SyncClientOptions = {
  serviceUrl: string
  token: string
  signal?: AbortSignal
}

export type SyncResponse = {
  version: 1
  data: SyncState
}

export function getSyncServiceUrl(configuredUrl?: string) {
  return configuredUrl?.trim() || 'http://localhost:8787'
}

function getEndpoint(serviceUrl: string) {
  return `${getSyncServiceUrl(serviceUrl).replace(/\/$/, '')}/api/sync/state`
}

function requireAccess(options: SyncClientOptions) {
  const serviceUrl = getSyncServiceUrl(options.serviceUrl)
  if (!options.token.trim()) throw new Error('请输入同步 token。')
  return serviceUrl
}

async function parseResponse(response: Response): Promise<SyncResponse> {
  let payload: unknown
  try { payload = await response.json() } catch { throw new Error('同步服务返回了无法读取的响应。') }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string' ? (payload as { error: string }).error : `同步服务请求失败（HTTP ${response.status}）。`
    throw new Error(message)
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || (payload as { version?: unknown }).version !== 1 || !(payload as { data?: unknown }).data || typeof (payload as { data?: unknown }).data !== 'object' || Array.isArray((payload as { data?: unknown }).data)) throw new Error('同步服务返回的数据格式无效。')
  return payload as SyncResponse
}

export async function uploadSyncState(state: SyncState, options: SyncClientOptions) {
  const serviceUrl = requireAccess(options)
  const response = await fetch(getEndpoint(serviceUrl), { method: 'PUT', headers: { 'content-type': 'application/json', authorization: `Bearer ${options.token}` }, body: JSON.stringify({ version: 1, data: state }), signal: options.signal })
  return parseResponse(response)
}

export async function downloadSyncState(options: SyncClientOptions) {
  const serviceUrl = requireAccess(options)
  const response = await fetch(getEndpoint(serviceUrl), { headers: { authorization: `Bearer ${options.token}` }, signal: options.signal })
  return parseResponse(response)
}

export function createSyncClient(options: SyncClientOptions) {
  return {
    upload: (state: SyncState) => uploadSyncState(state, options),
    download: () => downloadSyncState(options)
  }
}
