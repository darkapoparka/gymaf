"use client";
import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Timer, Zap, ZapOff } from 'lucide-react';
import { Dialog, ErrorNote } from './ui';

/** A live browser camera. It never requests access until the member opens it. */
export function CameraCapture({ onPhoto, onClose }: { onPhoto: (file: File) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null);
  const generation = useRef(0), countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [delay, setDelay] = useState(0), [remaining, setRemaining] = useState<number | null>(null);
  const [torchSupported, setTorchSupported] = useState(false), [torch, setTorch] = useState(false), [capturing, setCapturing] = useState(false);
  const busy = useRef(false);
  function cancelCountdown() { if (countdownTimer.current) clearInterval(countdownTimer.current); countdownTimer.current = null; setRemaining(null); busy.current = false; }
  useEffect(() => {
    const id = ++generation.current;
    const opening = navigator.mediaDevices?.getUserMedia ? navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1600 }, height: { ideal: 1200 } }, audio: false }) : Promise.reject(new Error('This browser cannot open the camera. Close this screen and use Photo Library.'));
    void opening.then(async next => {
      if (generation.current !== id) { next.getTracks().forEach(track => track.stop()); return; }
      stream.current = next;
      const track = next.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      setTorchSupported(!!capabilities?.torch);
      track.onended = () => { if (generation.current === id) { cancelCountdown(); setReady(false); setError('Camera disconnected. Retry to reconnect.'); } };
      if (video.current) { video.current.srcObject = next; await video.current.play(); }
      if (generation.current === id) setReady(true);
    }).catch(failure => {
      if (generation.current !== id) return;
      stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
      setError(failure instanceof DOMException && failure.name === 'NotAllowedError' ? 'Camera access was denied. Allow camera access in your browser, then Retry, or use Photo Library.' : !navigator.mediaDevices?.getUserMedia ? 'This browser cannot open the camera. Close this screen and use Photo Library.' : 'The camera could not open. Check that it is connected and not in use, then Retry.');
    });
    const hidden = () => { if (document.visibilityState === 'hidden') { cancelCountdown(); onClose(); } };
    document.addEventListener('visibilitychange', hidden);
    return () => { generation.current = id + 1; if (countdownTimer.current) clearInterval(countdownTimer.current); stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; document.removeEventListener('visibilitychange', hidden); };
    // onClose is deliberately read for this camera lifecycle, not used to reopen a stream on a parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, attempt]);
  async function capture() {
    const node = video.current;
    if (!node?.videoWidth || !node.videoHeight) { busy.current = false; setError('The camera is not ready. Wait for the preview and try again.'); return; }
    setCapturing(true); const id = generation.current;
    try {
      const canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(node.videoWidth, node.videoHeight));
      canvas.width = Math.round(node.videoWidth * scale); canvas.height = Math.round(node.videoHeight * scale);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Camera capture is unavailable.');
      context.drawImage(node, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('The photo could not be captured. Please retry.')), 'image/jpeg', .9));
      if (generation.current === id) onPhoto(new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' }));
    } catch (failure) { if (generation.current === id) setError(failure instanceof Error ? failure.message : 'Capture failed. Retry.'); }
    finally { busy.current = false; if (generation.current === id) { setCapturing(false); setRemaining(null); } }
  }
  function shutter() {
    if (!ready || busy.current) return; busy.current = true; setError('');
    if (!delay) { void capture(); return; }
    let seconds = delay; setRemaining(seconds);
    countdownTimer.current = setInterval(() => { seconds--; if (seconds <= 0) { if (countdownTimer.current) clearInterval(countdownTimer.current); countdownTimer.current = null; void capture(); } else setRemaining(seconds); }, 1000);
  }
  async function toggleTorch() {
    const track = stream.current?.getVideoTracks()[0]; if (!track || !torchSupported || busy.current) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] }); setTorch(!torch); }
    catch { setError('The camera light could not be changed on this device.'); }
  }
  function retry() { cancelCountdown(); setReady(false); setError(''); setTorch(false); setTorchSupported(false); setAttempt(n => n + 1); }
  return <Dialog title="Take Photo" className="connected-camera" onClose={() => { cancelCountdown(); onClose(); }}>
    <video ref={video} autoPlay muted playsInline aria-label="Live camera preview" className={facing === 'user' ? 'camera-mirrored' : ''}/>
    {!ready && !error && <p className="camera-status" role="status">Opening camera…</p>}
    {remaining !== null && <div className="camera-countdown" role="status" aria-label={`Taking photo in ${remaining} seconds`}>{remaining}</div>}
    <div className="camera-controls"><ErrorNote message={error}/>{error && <button className="button" onClick={retry}>Retry Camera</button>}
      <div className="camera-options"><button className="icon-button" disabled={!torchSupported || remaining !== null || capturing} onClick={() => void toggleTorch()} aria-pressed={torch} aria-label={torchSupported ? 'Camera light' : 'Camera light unavailable'}>{torch ? <Zap/> : <ZapOff/>}</button><div role="group" aria-label="Camera timer"><Timer size={18}/>{[0, 5, 10].map(value => <button key={value} disabled={remaining !== null || capturing} aria-pressed={delay === value} onClick={() => setDelay(value)}>{value ? `${value}s` : 'Timer Off'}</button>)}</div></div>
      <div className="camera-shutter-row"><button onClick={() => { if (remaining !== null) cancelCountdown(); else onClose(); }}>{remaining !== null ? 'Cancel Timer' : 'Cancel'}</button><button className="camera-shutter" aria-label="Take photo" disabled={!ready || remaining !== null || capturing} onClick={shutter}><Camera aria-hidden="true"/></button><button className="icon-button" aria-label="Switch camera" disabled={!ready || remaining !== null || capturing} onClick={() => { setReady(false); setError(''); setTorch(false); setTorchSupported(false); setFacing(value => value === 'user' ? 'environment' : 'user'); }}><RefreshCw/></button></div>
    </div>
  </Dialog>;
}
