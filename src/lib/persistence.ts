import { initialAssets } from '../data/assets'
import type { Asset } from '../data/assets'
import { requiresMigrationAlgorithm } from './risk'

const ASSET_KEY = 'quantum-guard-assets'
const CERTIFICATE_KEY = 'quantum-guard-certificates'
const SCAN_HISTORY_KEY = 'quantum-guard-scan-history'
const LEGACY_SCAN_KEY = 'quantum-guard-last-scan'
const algorithms = new Set<Asset['algorithm']>(['RSA-2048','ECDSA P-256','DH','ECDH','AES-128','AES-256','SHA-1','SHA-256','ML-KEM-768','ML-DSA-65','SLH-DSA'])

export type ScanRecord = { completedAt: string; assetCount: number }
export type CertificateRecord = { name: string; type: string; phase: number; alg: string; expiry: string; parent: string }

function readJson(key: string): unknown {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as unknown : null
  } catch {
    return null
  }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
function validAsset(value: unknown): value is Omit<Asset,'migrationRequired'> & { migrationRequired?: boolean } {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.type === 'string' &&
    typeof item.owner === 'string' && typeof item.environment === 'string' && algorithms.has(item.algorithm as Asset['algorithm']) &&
    typeof item.longLived === 'boolean' && typeof item.migrated === 'boolean' &&
    (item.migrationRequired === undefined || typeof item.migrationRequired === 'boolean')
}

export function loadAssets(): Asset[] {
  const stored = readJson(ASSET_KEY)
  if (!Array.isArray(stored)) return initialAssets
  const assets = stored.filter(validAsset).map(asset => ({
    ...asset,
    migrationRequired: asset.migrationRequired ?? (asset.migrated || requiresMigrationAlgorithm(asset.algorithm)),
  }))
  return assets
}
export function saveAssets(assets: Asset[]) { return writeJson(ASSET_KEY, assets) }

export function loadCertificates(fallback: CertificateRecord[]): CertificateRecord[] {
  const stored = readJson(CERTIFICATE_KEY)
  if (!Array.isArray(stored)) return fallback
  return stored.filter((item): item is CertificateRecord => !!item && typeof item === 'object' &&
    typeof (item as CertificateRecord).name === 'string' && typeof (item as CertificateRecord).type === 'string' &&
    Number.isInteger((item as CertificateRecord).phase) && typeof (item as CertificateRecord).alg === 'string' &&
    typeof (item as CertificateRecord).expiry === 'string' && typeof (item as CertificateRecord).parent === 'string')
}
export function saveCertificates(certificates: CertificateRecord[]) { return writeJson(CERTIFICATE_KEY, certificates) }

export function loadScanHistory(): ScanRecord[] {
  const stored = readJson(SCAN_HISTORY_KEY)
  if (Array.isArray(stored)) return stored.filter((item): item is ScanRecord => !!item && typeof item === 'object' &&
    typeof (item as ScanRecord).completedAt === 'string' && Number.isFinite((item as ScanRecord).assetCount))
  const legacy = readJson(LEGACY_SCAN_KEY)
  if (typeof legacy === 'string' && !Number.isNaN(Date.parse(legacy))) return [{ completedAt: legacy, assetCount: 0 }]
  return []
}
export function saveScanHistory(history: ScanRecord[]) {
  const ok = writeJson(SCAN_HISTORY_KEY, history)
  if (history[0]) writeJson(LEGACY_SCAN_KEY, history[0].completedAt)
  return ok
}

export function resetDemoStorage() {
  try {
    localStorage.removeItem(ASSET_KEY)
    localStorage.removeItem(CERTIFICATE_KEY)
    localStorage.removeItem(SCAN_HISTORY_KEY)
    localStorage.removeItem(LEGACY_SCAN_KEY)
  } catch {
    // A reload will reinitialize in-memory demo state even when storage is unavailable.
  }
}
