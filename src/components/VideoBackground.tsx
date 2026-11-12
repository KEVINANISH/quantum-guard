import { useCallback, useEffect, useRef, useState } from 'react'

type VideoBackgroundProps = { src: string }
type NetworkInfo = { saveData?: boolean; effectiveType?: string; addEventListener?: (name:string, callback:()=>void)=>void; removeEventListener?: (name:string, callback:()=>void)=>void }
type IdleWindow = Window & { requestIdleCallback?: (callback:()=>void, options?:{timeout:number})=>number; cancelIdleCallback?: (id:number)=>void }

function networkAllowsVideo() {
  if (typeof window === 'undefined') return false
  const connection=(navigator as Navigator & {connection?:NetworkInfo}).connection
  return !connection?.saveData && !['slow-2g','2g'].includes(connection?.effectiveType ?? '')
}

export default function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef=useRef<HTMLVideoElement|null>(null)
  const retryHandler=useRef<(()=>void)|null>(null)
  const [viewportAllowed,setViewportAllowed]=useState(networkAllowsVideo)
  const [loadedSrc,setLoadedSrc]=useState<string|null>(null)
  const [readySrc,setReadySrc]=useState<string|null>(null)
  const [failedSrc,setFailedSrc]=useState<string|null>(null)

  const removeRetry=useCallback(()=>{
    const retry=retryHandler.current
    if(retry){window.removeEventListener('pointerdown',retry);window.removeEventListener('keydown',retry);retryHandler.current=null}
  },[])

  const playVideo=useCallback((video:HTMLVideoElement,afterGesture=false)=>{
    video.muted=true
    video.defaultMuted=true
    video.loop=true
    video.playsInline=true
    video.autoplay=true
    void video.play().catch((error:unknown)=>{
      if(!afterGesture&&error instanceof Error&&error.name==='NotAllowedError'){
        if(retryHandler.current)return
        const retry=()=>{removeRetry();video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;void video.play().catch((retryError:unknown)=>{console.error(`Background video playback failed (${src}):`,retryError);setFailedSrc(src)})}
        retryHandler.current=retry
        window.addEventListener('pointerdown',retry,{once:true})
        window.addEventListener('keydown',retry,{once:true})
        return
      }
      console.error(`Background video playback failed (${src}):`,error)
      setFailedSrc(src)
    })
  },[removeRetry,src])

  useEffect(()=>{
    const updatePolicy=()=>setViewportAllowed(networkAllowsVideo())
    const connection=(navigator as Navigator & {connection?:NetworkInfo}).connection
    window.addEventListener('resize',updatePolicy,{passive:true})
    connection?.addEventListener?.('change',updatePolicy)
    return()=>{window.removeEventListener('resize',updatePolicy);connection?.removeEventListener?.('change',updatePolicy)}
  },[])

  useEffect(()=>{
    if(!viewportAllowed)return
    let timeout=0
    let idleId:number|undefined
    let cancelled=false
    const schedule=()=>{
      if(cancelled||!networkAllowsVideo())return
      const idleWindow=window as IdleWindow
      if(idleWindow.requestIdleCallback){idleId=idleWindow.requestIdleCallback(()=>{if(!cancelled)setLoadedSrc(src)},{timeout:1500})}
      else timeout=window.setTimeout(()=>{if(!cancelled)setLoadedSrc(src)},500)
    }
    if(document.readyState==='complete')schedule()
    else window.addEventListener('load',schedule,{once:true})
    return()=>{
      cancelled=true
      window.removeEventListener('load',schedule)
      if(timeout)window.clearTimeout(timeout)
      if(idleId!==undefined)(window as IdleWindow).cancelIdleCallback?.(idleId)
      removeRetry()
    }
  },[src,viewportAllowed,removeRetry])

  const bindVideo=useCallback((element:HTMLVideoElement|null)=>{
    videoRef.current=element
    if(element&&loadedSrc===src)playVideo(element)
  },[loadedSrc,playVideo,src])
  const posterClass=src.includes('bg1')?'poster-landing':src.includes('bg3')?'poster-lab':'poster-dashboard'

  return <div className={`video-background ${posterClass}${failedSrc===src?' has-failed':''}`} aria-hidden="true">
    <video
      key={src}
      ref={bindVideo}
      className={`video-background__video${readySrc===src&&failedSrc!==src?' is-ready':''}`}
      src={viewportAllowed&&loadedSrc===src?src:undefined}
      muted loop playsInline autoPlay preload="metadata" disablePictureInPicture disableRemotePlayback
      onCanPlay={event=>{setReadySrc(src);setFailedSrc(null);playVideo(event.currentTarget)}}
      onError={event=>{const error=event.currentTarget.error??event.nativeEvent;console.error(`Background video load failed (${src}):`,error);setFailedSrc(src)}}
    />
    <div className="video-background__overlay" />
  </div>
}