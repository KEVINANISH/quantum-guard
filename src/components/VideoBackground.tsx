import { useCallback, useEffect, useRef, useState } from 'react'

type VideoBackgroundProps = { src: string }

export default function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const retryListenersArmed = useRef(false)
  const retryHandler = useRef<(() => void) | null>(null)
  const [readySrc, setReadySrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const removeRetryListeners = useCallback(() => {
    const retry = retryHandler.current
    if (retry) {
      window.removeEventListener('click', retry)
      window.removeEventListener('keydown', retry)
      retryHandler.current = null
    }
    retryListenersArmed.current = false
  }, [])

  const armRetry = useCallback((video: HTMLVideoElement) => {
    if (retryListenersArmed.current) return
    retryListenersArmed.current = true
    const retry = () => {
      removeRetryListeners()
      video.muted = true
      video.defaultMuted = true
      video.loop = true
      video.playsInline = true
      video.autoplay = true
      void video.play().catch((error: unknown) => {
        console.error(error)
        setFailedSrc(src)
      })
    }
    retryHandler.current = retry
    window.addEventListener('click', retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
  }, [removeRetryListeners, src])

  const playVideo = useCallback((video: HTMLVideoElement, afterGesture = false) => {
    video.muted = true
    video.defaultMuted = true
    video.loop = true
    video.playsInline = true
    video.autoplay = true
    void video.play().catch((error: unknown) => {
      if (!afterGesture && error instanceof Error && error.name === 'NotAllowedError') {
        armRetry(video)
        return
      }
      console.error(error)
      setFailedSrc(src)
    })
  }, [armRetry, src])

  const bindVideo = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
    if (element) playVideo(element)
  }, [playVideo])

  useEffect(() => {
    const video = videoRef.current
    if (video) playVideo(video)
    return removeRetryListeners
  }, [src, playVideo, removeRetryListeners])

  useEffect(() => {
    const resumeWhenVisible = () => {
      if (document.visibilityState === 'visible' && videoRef.current) playVideo(videoRef.current)
    }
    document.addEventListener('visibilitychange', resumeWhenVisible)
    return () => document.removeEventListener('visibilitychange', resumeWhenVisible)
  }, [playVideo])

  return (
    <div className={`video-background${failedSrc === src ? ' has-failed' : ''}`} aria-hidden="true">
      <video
        key={src}
        ref={bindVideo}
        className={`video-background__video${readySrc === src && failedSrc !== src ? ' is-ready' : ''}`}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={event => {
          setReadySrc(src)
          setFailedSrc(current => current === src ? null : current)
          playVideo(event.currentTarget)
        }}
        onError={event => {
          const error = event.currentTarget.error ?? event.nativeEvent
          console.error(error)
          setFailedSrc(src)
        }}
        style={{ pointerEvents: 'none' }}
      />
      <div className="video-background__overlay" />
    </div>
  )
}
