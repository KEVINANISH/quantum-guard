import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
const VIDEO_SOURCES = ['/videos/bg1.mp4.mp4', '/videos/bg2.mp4.mp4', '/videos/bg3.mp4.mp4'] as const

type VideoBackgroundProps = { src: string }

export default function VideoBackground({ src }: VideoBackgroundProps) {
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const retryArmed = useRef(false)
  const retryHandler = useRef<(() => void) | null>(null)
  const [failedSources, setFailedSources] = useState<string[]>([])

  const removeRetryListeners = useCallback(() => {
    if (retryHandler.current) {
      for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
        window.removeEventListener(event, retryHandler.current)
      }
      retryHandler.current = null
    }
    retryArmed.current = false
  }, [])

  const armRetry = useCallback(() => {
    if (retryArmed.current) return
    retryArmed.current = true
    const retry = () => {
      removeRetryListeners()
      videos.current.forEach(video => {
        if (video) { video.muted = true; video.defaultMuted = true; video.playsInline = true; video.loop = true; void video.play().catch(() => {}) }
      })
    }
    retryHandler.current = retry
    for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
      window.addEventListener(event, retry, { once: true, passive: true })
    }
  }, [removeRetryListeners])

  const playVideo = useCallback((video: HTMLVideoElement) => {
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.loop = true
    void video.play().catch(armRetry)
  }, [armRetry])

  const videoRefCallbacks = useMemo(() => VIDEO_SOURCES.map((_, index) => (video: HTMLVideoElement | null) => {
    videos.current[index] = video
    if (video) playVideo(video)
  }), [playVideo])
  const handlePlayable = (source: string, video: HTMLVideoElement) => {
    setFailedSources(current => current.includes(source) ? current.filter(item => item !== source) : current)
    playVideo(video)
  }

  useEffect(() => {
    const target = videos.current.find(video => video?.dataset.videoSource === src)
    if (target) playVideo(target)
  }, [src, playVideo])

  useEffect(() => {
    const resumeWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        videos.current.forEach(video => { if (video) playVideo(video) })
      }
    }
    document.addEventListener('visibilitychange', resumeWhenVisible)
    return () => {
      document.removeEventListener('visibilitychange', resumeWhenVisible)
      removeRetryListeners()
    }
  }, [playVideo, removeRetryListeners])

  return (
    <div className="video-background" aria-hidden="true">
      {VIDEO_SOURCES.map((source, index) => <video
        key={source}
        ref={videoRefCallbacks[index]}
        className={`video-background__video ${source === src && !failedSources.includes(source) ? 'is-active' : ''}`}
        data-video-source={source}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={event => handlePlayable(source, event.currentTarget)}
        onCanPlay={event => handlePlayable(source, event.currentTarget)}
        onCanPlayThrough={event => handlePlayable(source, event.currentTarget)}
        onError={() => setFailedSources(current => current.includes(source) ? current : [...current, source])}
        style={{ pointerEvents: 'none' }}
      ><source src={source} type="video/mp4" /></video>)}
      <div className="video-background__overlay" />
    </div>
  )
}
