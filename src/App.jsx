import React, { Suspense, useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Float, PointMaterial, Points } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { LEVELS } from './constants'

// Shared mutable mouse ref
const mouseRef = { x: 0, y: 0 }

function ParticleSwarm({ count = 600 }) {
  const points = useRef()
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 25
      p[i * 3 + 1] = (Math.random() - 0.5) * 25
      p[i * 3 + 2] = (Math.random() - 0.5) * 25
    }
    return p
  }, [count])
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.05
      points.current.rotation.x = state.clock.elapsedTime * 0.02
    }
  })
  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.05} sizeAttenuation depthWrite={false} opacity={0.5} />
    </Points>
  )
}

function MouseSpotlight() {
  const lightRef = useRef()
  useFrame(() => {
    lightRef.current.position.lerp(new THREE.Vector3(mouseRef.x * 5, mouseRef.y * 5, 2), 0.08)
  })
  return <pointLight ref={lightRef} distance={12} intensity={10} color="#00f0ff" />
}

function SceneBackground() {
  const group = useRef()
  const obj1 = useRef()
  const obj2 = useRef()
  const obj3 = useRef()

  useFrame((state) => {
    const targetX = mouseRef.x * 0.8
    const targetY = mouseRef.y * 0.8
    group.current.rotation.y += (targetX - group.current.rotation.y) * 0.05
    group.current.rotation.x += (-targetY - group.current.rotation.x) * 0.05

    const s = 1 + Math.min(Math.abs(mouseRef.x), 0.5) * 2
    if (obj1.current) obj1.current.rotation.y += 0.01 * s
    if (obj2.current) obj2.current.rotation.x -= 0.01 * s
    if (obj3.current) obj3.current.rotation.z += 0.01 * s
  })

  return (
    <>
      <MouseSpotlight />
      <ambientLight intensity={0.1} />
      <group ref={group}>
        <Stars radius={50} depth={50} count={1500} factor={4} saturation={1} fade speed={1} />
        <ParticleSwarm count={600} />
        <Float speed={2} rotationIntensity={1} floatIntensity={2} position={[4, 2, -5]}>
          <mesh ref={obj1}>
            <octahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#00f0ff" wireframe />
          </mesh>
        </Float>
        <Float speed={1.5} rotationIntensity={2} floatIntensity={2} position={[-5, -2, -8]}>
          <mesh ref={obj2}>
            <torusGeometry args={[1.5, 0.4, 8, 50]} />
            <meshStandardMaterial color="#ff0055" wireframe />
          </mesh>
        </Float>
        <Float speed={3} rotationIntensity={1.5} floatIntensity={1} position={[2, -6, -10]}>
          <mesh ref={obj3}>
            <coneGeometry args={[1.5, 2, 4]} />
            <meshStandardMaterial color="#ffcc00" wireframe />
          </mesh>
        </Float>
      </group>
    </>
  )
}


// == Web Audio Sound Engine ==
const SoundEngine = {
  ctx: null,
  isMuted: false,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)() },
  setMuted(val) { this.isMuted = val },
  tone(freq, dur, type = 'square', vol = 0.25) {
    if (this.isMuted) return
    try {
      this.init()
      const o = this.ctx.createOscillator(), g = this.ctx.createGain()
      o.connect(g); g.connect(this.ctx.destination)
      o.type = type; o.frequency.setValueAtTime(freq, this.ctx.currentTime)
      g.gain.setValueAtTime(vol, this.ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
      o.start(); o.stop(this.ctx.currentTime + dur)
    } catch(e) {}
  },
  correct()  { [523,659,784,1047].forEach((f,i) => setTimeout(() => this.tone(f, 0.15), i*80)) },
  wrong()    { this.tone(150, 0.3, 'sawtooth', 0.2) },
  defeat()   { [392,523,659,784,880,784,1047].forEach((f,i) => setTimeout(() => this.tone(f, 0.2), i*90)) },
  xpGain()   { this.tone(880, 0.07); setTimeout(() => this.tone(1047, 0.07), 80) },
  select()   { this.tone(440, 0.05, 'sine', 0.1) },
}

function QuizComponent({ question, options, correctAnswerIndex, onLevelComplete, onWrong, onShoot }) {
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [showDefeated, setShowDefeated] = useState(false)
  const [isRemoved, setIsRemoved] = useState(false)
  const [bossHp, setBossHp] = useState(100)
  const [hpFlash, setHpFlash] = useState(false)
  const [isExploding, setIsExploding] = useState(false)

  const handleSelect = (index) => {
    if (answered) return
    SoundEngine.select()
    setSelectedIndex(index)
    setAnswered(true)
    if (index === correctAnswerIndex) {
      SoundEngine.correct()
      setBossHp(0)
      setTimeout(() => {
        SoundEngine.defeat()
        if (onShoot) onShoot()
        setIsExploding(true)
        setTimeout(() => {
          setIsExploding(false)
          setShowDefeated(true)
        }, 500)
        setTimeout(() => { 
          setIsRemoved(true)
          if (onLevelComplete) onLevelComplete() 
        }, 1500)
      }, 100)
    }
    } else {
      SoundEngine.wrong()
      setHpFlash(true)
      setBossHp(prev => Math.max(0, prev - 25))
      setTimeout(() => { setHpFlash(false); setAnswered(false); setSelectedIndex(null) }, 700)
      if (onWrong) onWrong()
    }
  }

  return (
    <AnimatePresence>
      {!isRemoved && (
        <motion.div
          className="content-box combat-panel"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4 }}
        >
          {!showDefeated ? (
            <div className={`quiz-box ${isExploding ? 'boss-explosion' : ''}`}>
              <h4 style={{ color: 'var(--color-red)', marginBottom: '10px', textAlign: 'center' }}>!! MINI-BOSS CHALLENGE !!</h4>
              <div className="boss-hp-wrap">
                <span className="boss-hp-label">BOSS HP</span>
                <div className="boss-hp-track">
                  <div className={`boss-hp-fill ${hpFlash ? 'hp-flash' : ''}`} style={{ width: `${bossHp}%` }} />
                </div>
                <span className="boss-hp-num">{bossHp}%</span>
              </div>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px', marginTop: '12px' }}>{question}</p>
              <div className="quiz-grid">
                {options.map((opt, i) => {
                  let btnClass = 'quiz-btn'
                  if (answered) {
                    if (i === correctAnswerIndex) btnClass += ' correct'
                    else if (i === selectedIndex) btnClass += ' wrong'
                  }
                  return <button key={i} className={btnClass} onClick={() => handleSelect(i)} disabled={answered}>{opt}</button>
                })}
              </div>
            </div>
          ) : (
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ padding: '20px', textAlign: 'center' }}>
              <h2 style={{ color: 'var(--color-green)', textShadow: '0 0 20px var(--color-green)', marginBottom: '10px' }}>*** BOSS DEFEATED! ***</h2>
              <p style={{ color: 'var(--color-cyan)', fontSize: '1.1rem' }}>Map Expanded. You may now proceed.</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}


function App() {
  const [started, setStarted] = useState(false)
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [hp, setHp] = useState(3)
  const [isWalking, setIsWalking] = useState(false)
  const [isShooting, setIsShooting] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [screenShake, setScreenShake] = useState(false)
  const [copied, setCopied] = useState(null)
  
  // New States
  const [isMuted, setIsMuted] = useState(false)
  const [collectedSkills, setCollectedSkills] = useState([])
  const [achievements, setAchievements] = useState([])
  const [inventoryOpen, setInventoryOpen] = useState(false)

  const scrollTimeout = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    SoundEngine.setMuted(isMuted)
  }, [isMuted])

  const addAchievement = (text, icon = '🏆') => {
    const id = Date.now()
    setAchievements(prev => [...prev, { id, text, icon }])
    setTimeout(() => {
      setAchievements(prev => prev.filter(a => a.id !== id))
    }, 4000)
  }

  const handleLevelComplete = (nextLevel) => {
    SoundEngine.xpGain()
    setXp(prev => prev + 1000)
    
    // Collect skills from completed level
    const currentLevelData = LEVELS.find(l => l.id === maxUnlockedLevel)
    if (currentLevelData) {
      let skillsToCollect = []
      if (currentLevelData.skills) skillsToCollect = currentLevelData.skills
      if (currentLevelData.categories) {
        currentLevelData.categories.forEach(cat => skillsToCollect.push(...cat.skills))
      }
      setCollectedSkills(prev => [...new Set([...prev, ...skillsToCollect])])
    }

    addAchievement(`LEVEL ${maxUnlockedLevel} CLEARED!`, '⚔️')
    setMaxUnlockedLevel(prev => Math.max(prev, nextLevel))
    setScrollProgress(0)
    setIsWalking(false)
  }

  const handleWrongAnswer = () => setHp(prev => Math.max(0, prev - 1))

  const handleShoot = () => {
    setIsShooting(true)
    setScreenShake(true)
    setTimeout(() => setIsShooting(false), 1000)
    setTimeout(() => setScreenShake(false), 500)
  }

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target
    const maxScroll = scrollHeight - clientHeight
    const totalProgress = maxScroll > 0 ? scrollTop / maxScroll : 0
    const progressPerLevel = (totalProgress * maxUnlockedLevel) % 1
    setScrollProgress(progressPerLevel)
    if (!isWalking && !isShooting) setIsWalking(true)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => setIsWalking(false), 150)
  }

  const handleMouseMove = (e) => {
    mouseRef.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseRef.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }

  const renderHearts = () => {
    const full = '\u2665'
    const empty = '\u2661'
    if (hp === 0) return empty + empty + empty
    return full.repeat(hp) + empty.repeat(3 - hp)
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  }

  return (
    <div
      className={screenShake ? 'screen-shake' : ''}
      style={{ width: '100vw', height: '100vh', background: '#030308', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >

      {/* Achievement Notifications */}
      <div className="achievement-container">
        <AnimatePresence>
          {achievements.map(ach => (
            <motion.div
              key={ach.id}
              className="achievement-toast"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <span className="achievement-icon">{ach.icon}</span>
              <span>{ach.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Inventory System */}
      {started && (
        <div className="inventory-tab">
          <button className="inventory-btn" onClick={() => setInventoryOpen(!inventoryOpen)}>
            {inventoryOpen ? 'CLOSE' : 'SKILLS'}
          </button>
          <AnimatePresence>
            {inventoryOpen && (
              <motion.div
                className="inventory-panel"
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
              >
                <div className="inventory-title">SKILL COLLECTION</div>
                <div className="inventory-grid">
                  {['Python', 'React', 'Three.js', 'n8n', 'Flask', 'MongoDB', 'Node.js', 'Java', 'Git', 'AI/ML'].map(skill => (
                    <div key={skill} className={`inventory-item ${collectedSkills.includes(skill) || collectedSkills.some(s => s.includes(skill)) ? 'unlocked' : ''}`}>
                      <div className="inventory-item-icon">
                        {skill === 'Python' ? '🐍' : skill === 'React' ? '⚛️' : skill === 'n8n' ? '⚙️' : '📜'}
                      </div>
                      {skill}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Welcome Splash */}
      {!started && (
        <div className="splash-screen" onClick={() => setStarted(true)}>
          <img src="/avatar.png" alt="Ankith Raj" className="splash-avatar" />
          <h1 className="font-arcade text-gradient splash-title" style={{ marginBottom: '20px', textAlign: 'center' }}>Welcome to Ankith's Quest</h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '40px', color: 'var(--text-muted)' }}>An Interactive Developer Portfolio</p>
          <button className="cyber-button" style={{ fontSize: '1.5rem', padding: '20px 40px' }}>PRESS START</button>
        </div>
      )}

      {/* HUD */}
      <div className="hud" style={{ opacity: started ? 1 : 0, transition: 'opacity 1s ease', zIndex: 100 }}>
        <div className="hud-xp">
          <div style={{ marginBottom: '8px', color: 'var(--text-main)' }}>PLAYER 1: ANKITH</div>
          <div>XP: {xp.toString().padStart(4, '0')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="hud-hp">HP: <span className="hearts">{renderHearts()}</span></div>
          <button className="audio-toggle" onClick={() => setIsMuted(!isMuted)}>
            <span className="audio-icon">{isMuted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      </div>

      {/* 3D Background */}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <color attach="background" args={[maxUnlockedLevel >= 7 ? '#100000' : '#030308']} />
        <Suspense fallback={null}>
          <SceneBackground />
        </Suspense>
      </Canvas>

      {/* Scroll Area */}
      {started && (
        <div
          ref={scrollContainerRef}
          className="main-scroll-area"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, overflowY: 'auto', overflowX: 'hidden' }}
          onScroll={handleScroll}
        >
          <div style={{ paddingBottom: '30vh' }}>

            {/* Render Levels 1-5 from constants */}
            {LEVELS.map((level, idx) => {
              const isUnlocked = maxUnlockedLevel >= level.id
              if (!isUnlocked) return null
              
              const alignment = idx % 3 === 0 ? 'align-center' : idx % 3 === 1 ? 'align-left' : 'align-right'
              const panelClass = `panel-${level.color.split('--color-')[1].replace(')', '')}`

              return (
                <motion.section key={level.id} className={`html-section ${alignment}`} variants={containerVariants} initial="hidden" animate="visible">
                  <div className={`content-box glass-panel ${panelClass}`} style={{ maxWidth: level.id === 1 ? '900px' : '850px' }}>
                    <h2 className="font-arcade" style={{ color: level.color, marginBottom: '20px' }}>{level.title}</h2>
                    {level.subtitle && <h3 className="font-arcade text-gradient" style={{ marginTop: '10px' }}>{level.subtitle}</h3>}
                    {level.description && <p style={{ marginTop: '20px', fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>{level.description}</p>}
                    
                    {level.skills && (
                      <div style={{ display: 'flex', gap: '20px', marginTop: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {level.skills.map(s => (
                          <span key={s} style={{ background: `rgba(255,255,255,0.05)`, border: `1px solid ${level.color}`, padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem' }}>{s}</span>
                        ))}
                      </div>
                    )}

                    {level.items && level.items.map((item, i) => (
                      <div key={i} className="project-card" style={{ 
                        border: `1px solid ${level.color}`, 
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        padding: '15px',
                        marginBottom: '15px'
                      }}>
                        <h3 style={{ color: level.color }}>{item.title}</h3>
                        {item.subtitle && <p>{item.subtitle}</p>}
                        {item.details && <p style={{ color: 'var(--color-cyan)', marginTop: '5px' }}>{item.details}</p>}
                        {item.description && <p style={{ marginBottom: '8px' }}>{item.description}</p>}
                        {item.tags && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {item.tags.map(t => (
                              <span key={t} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${level.color}`, padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', color: level.color }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {level.categories && (
                      <div className="skills-grid">
                        {level.categories.map((cat, i) => (
                          <div key={i} className="skill-category" style={{ 
                            border: `1px solid ${level.color}`,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '15px'
                          }}>
                            <h3 style={{ color: level.color }}>{cat.title}</h3>
                            <ul>{cat.skills.map(s => <li key={s}>{s}</li>)}</ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {level.id === 1 && maxUnlockedLevel === 1 && (
                      <button className="cyber-button" style={{ marginTop: '30px' }} onClick={() => handleLevelComplete(2)}>ENTER THE DUNGEON</button>
                    )}
                  </div>
                  
                  {level.quiz && maxUnlockedLevel === level.id && (
                    <QuizComponent 
                      question={level.quiz.question} 
                      options={level.quiz.options} 
                      correctAnswerIndex={level.quiz.correctIndex} 
                      onLevelComplete={() => handleLevelComplete(level.id + 1)} 
                      onWrong={handleWrongAnswer} 
                      onShoot={handleShoot} 
                    />
                  )}
                </motion.section>
              )
            })}

            {/* LEVEL 6: RESUME */}
            <AnimatePresence>
              {maxUnlockedLevel >= 6 && (
                <motion.section className="html-section align-center" variants={containerVariants} initial="hidden" animate="visible">
                  <div className="content-box glass-panel panel-hero" style={{ maxWidth: '700px', width: '100%', textAlign: 'center' }}>
                    <h2 className="font-arcade text-gradient" style={{ marginBottom: '10px' }}>Level 6: The Scroll</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1.1rem' }}>You have unlocked the legendary Resume artifact.</p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '30px' }}>
                      <a href="/Kanakaboina_Ankith_Raj_resume%202.pdf" download="Kanakaboina_Ankith_Raj_resume_2.pdf" className="cyber-button" style={{ textDecoration: 'none', display: 'inline-block' }}>DOWNLOAD RESUME</a>
                      <a href="/Kanakaboina_Ankith_Raj_resume%202.pdf" target="_blank" rel="noreferrer" className="cyber-button" style={{ textDecoration: 'none', display: 'inline-block', borderColor: 'var(--color-cyan)' }}>REVIEW RESUME</a>
                    </div>
                    {maxUnlockedLevel === 6 && (
                      <button className="cyber-button" style={{ borderColor: 'var(--color-green)' }} onClick={() => handleLevelComplete(7)}>FACE THE FINAL BOSS</button>
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* LEVEL 7: CONTACT */}
            <AnimatePresence>
              {maxUnlockedLevel >= 7 && (
                <motion.section className="html-section align-center" variants={containerVariants} initial="hidden" animate="visible">
                  <div className="content-box glass-panel panel-red" style={{ maxWidth: '700px', width: '100%' }}>
                    <h2 className="font-arcade" style={{ color: 'var(--color-red)', marginBottom: '25px' }}>Level 7: Final Boss</h2>
                    <div style={{ display: 'flex', gap: '25px', alignItems: 'center', padding: '25px', background: 'rgba(0,0,0,0.5)', borderRadius: '15px', border: '1px solid var(--color-red)', flexWrap: 'wrap' }}>
                      <img src="/avatar.png" alt="Ankith Raj" style={{ width: '130px', height: '130px', objectFit: 'cover', objectPosition: 'center 20%', borderRadius: '15px', border: '2px solid var(--color-red)' }} />
                      <div style={{ textAlign: 'left', flex: 1, minWidth: '200px' }}>
                        <h3 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Summon Ankith</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.1rem' }}>ak.kanakaboina@gmail.com</span>
                          <button onClick={() => copyToClipboard('ak.kanakaboina@gmail.com', 'email')} className="quiz-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                            {copied === 'email' ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>
                        {/* Re-adding Phone */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                          <span style={{ fontSize: '1.1rem' }}>+91 89856 90144</span>
                          <button onClick={() => copyToClipboard('+918985690144', 'phone')} className="quiz-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                            {copied === 'phone' ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>
                        {/* Re-adding Social Links */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                          <a href="https://linkedin.com/in/kanakaboina-ankith-raj-b4a7092a0/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-cyan)', textDecoration: 'none', fontWeight: 'bold' }}>LINKEDIN</a>
                          <a href="https://github.com/Ankithraj-1312" target="_blank" rel="noreferrer" style={{ color: 'var(--color-yellow)', textDecoration: 'none', fontWeight: 'bold' }}>GITHUB</a>
                          <a href="https://youtube.com/@theNubeeGamer" target="_blank" rel="noreferrer" style={{ color: 'var(--color-pink)', textDecoration: 'none', fontWeight: 'bold' }}>NUBEE GAMER</a>
                          <a href="https://youtube.com/@factscreate1" target="_blank" rel="noreferrer" style={{ color: 'var(--color-purple)', textDecoration: 'none', fontWeight: 'bold' }}>FACTSCRATE</a>
                        </div>
                        {/* Re-adding Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <a href="mailto:ak.kanakaboina@gmail.com" className="cyber-button" style={{ fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block' }}>SEND EMAIL</a>
                          <a href="https://wa.me/918985690144" target="_blank" rel="noreferrer" className="cyber-button" style={{ fontSize: '0.8rem', borderColor: 'var(--color-green)', textDecoration: 'none', display: 'inline-block' }}>WHATSAPP</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

          </div>
        </div>
      )}

      {/* 8-Bit Player Character */}
      {started && (
        <div className="player-container" style={{ left: `${5 + scrollProgress * 75}%` }}>
          <div
            className={`player-sprite ${isWalking && !isShooting ? 'walking' : ''} ${isShooting ? 'shooting' : ''}`}
            style={{ transform: isShooting || scrollProgress > 0.8 ? 'scaleX(-1)' : 'scaleX(1)' }}
          />
          {isShooting && <div className="laser-beam" />}
        </div>
      )}
    </div>
  )
}

export default App
