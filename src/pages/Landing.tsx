import { animate as animateValue, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HowItWorks from '../components/HowItWorks'

const stats = [
  { value: '2035', label: 'Quantum readiness horizon', detail: 'Start preparing today' },
  { value: '20+', label: 'Assets in your inventory', detail: 'Across enterprise systems' },
  { value: '3', label: 'Migration phases', detail: 'A clear path to PQC' },
]

function AnimatedStatValue({value}:{value:string}){const [current,setCurrent]=useState(0);const target=Number.parseInt(value,10);useEffect(()=>{const controls=animateValue(0,target,{duration:1.1,delay:.25,ease:'easeOut',onUpdate:n=>setCurrent(Math.round(n))});return()=>controls.stop()},[target]);return <>{current}{value.includes('+')?'+':''}</>}

export default function Landing() {
  return <main className="landing-page">
    <header className="landing-nav"><Link className="landing-brand" to="/">⌬ <span>Quantum<strong>Guard</strong></span></Link><span className="landing-status"><i /> Quantum readiness platform</span><Link to="/dashboard" className="landing-nav-link">Open dashboard ↗</Link></header>
    <div className="landing-particles" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${(i*47)%100}%`,top:`${(i*31)%100}%`,animationDelay:`${(i%8)*-.7}s`,animationDuration:`${5+(i%6)}s`}}/>)}</div><div className="landing-how"><HowItWorks title="Landing"/></div>
    <section className="landing-hero">
      <motion.div className="landing-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
        <span className="landing-kicker"><i /> THE QUANTUM ERA IS APPROACHING</span>
        <h1>Get ready for<br/>the <em>quantum threat.</em></h1>
        <p>Protect the data that matters before quantum computers arrive. Find your exposure, prioritize your migration, and move to quantum-safe cryptography.</p>
        <div className="landing-hndl"><span>⌁</span><p><b>Harvest now, decrypt later.</b> Encrypted data stolen today could be exposed tomorrow.</p></div>
        <Link to="/dashboard" className="button landing-cta">Launch dashboard <span>→</span></Link>
      </motion.div>
      <motion.div className="landing-emblem" initial={{ opacity: 0, scale: .86, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .9, delay: .15 }}><div className="emblem-orbit orbit-one"/><div className="emblem-orbit orbit-two"/><div className="emblem-core">⌬</div><span className="emblem-tag tag-top">Crypto agility</span><span className="emblem-tag tag-bottom">Post-quantum ready</span></motion.div>
    </section>
    <section className="landing-stats">{stats.map((stat, i) => <motion.article className="landing-stat-entrance" key={stat.label} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .25 + i * .12 }}><div className="landing-stat"><span className="stat-index">0{i + 1} / READINESS</span><strong><AnimatedStatValue value={stat.value}/></strong><b>{stat.label}</b><small>{stat.detail}</small></div></motion.article>)}</section>
    <footer className="landing-footer"><span>Quantum Guard · Security command</span><span>Built for a quantum-safe future <i>✦</i></span></footer>
  </main>
}
