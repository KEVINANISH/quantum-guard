import { motion } from 'framer-motion'

export default function HowItWorks({ title }: { title: string }) {
  const copy: Record<string, string> = {
    'Quantum readiness': 'We inventory cryptographic assets, compare algorithms against quantum attack models, and track each migration to post-quantum standards.',
    'Asset discovery': 'The inventory maps services and their cryptographic algorithms. Run a scan to reveal assets progressively or add/import your own records.',
    'Vulnerability assessment': 'Rules flag Shor-vulnerable public-key algorithms and weaker symmetric/hash primitives, with long-lived data highlighted for harvest-now exposure.',
    'Migration planner': 'Recommended targets are selected from the asset role: ML-KEM for key establishment, ML-DSA or SLH-DSA for signatures, and stronger symmetric/hash options.',
    'Hybrid key exchange': 'A classical X25519 secret and ML-KEM secret are combined with HKDF, then used to encrypt your message with AES-GCM.',
    'Algorithm benchmarks': 'Operations are timed locally in your browser; measurements vary by device and are comparative, not a security certification.',
    'Certificate migration': 'This simulated PKI view tracks classical, hybrid, and full-PQC phases; keys are ephemeral and certificates are not browser-trusted X.509.',
  }
  return <motion.aside className="how-it-works" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}><span className="how-icon">✦</span><div><b>How it works</b><p>{copy[title] ?? 'Quantum Guard assesses cryptographic exposure and guides a practical migration toward quantum-safe standards.'}</p></div></motion.aside>
}
