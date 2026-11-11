import type { Asset } from '../data/assets'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Safe'
export function severityFor(algorithm: Asset['algorithm']): Severity {
  if (['RSA-2048','ECDSA P-256','DH','ECDH'].includes(algorithm)) return 'Critical'
  if (algorithm === 'SHA-1') return 'High'
  if (algorithm === 'AES-128') return 'Medium'
  return 'Safe'
}
export function riskFor(asset: Asset) { return ({Critical: 95, High: 78, Medium: 52, Safe: 8} as const)[severityFor(asset.algorithm)] }
export function overallRisk(assets: Asset[]) { return assets.length ? Math.round(assets.reduce((n,a)=>n+(a.migrated?0:riskFor(a)),0)/assets.length) : 0 }
export function targetForAsset(asset: Asset): Asset['algorithm'] {
  if (asset.algorithm === 'AES-128') return 'AES-256'
  if (asset.algorithm === 'SHA-1') return 'SHA-256'
  if (asset.algorithm === 'SLH-DSA' || asset.algorithm === 'ML-DSA-65' || asset.algorithm === 'ML-KEM-768' || asset.algorithm === 'AES-256' || asset.algorithm === 'SHA-256') return asset.algorithm
  if (asset.type === 'Code signing' && asset.longLived) return 'SLH-DSA'
  if (asset.type === 'Code signing' || asset.algorithm === 'ECDSA P-256' || (asset.algorithm === 'RSA-2048' && asset.type === 'SSH')) return 'ML-DSA-65'
  return 'ML-KEM-768'
}
export function recommendationFor(asset: Asset) { return targetForAsset(asset) }
