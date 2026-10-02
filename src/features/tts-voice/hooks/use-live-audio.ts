import { useCallback, useEffect, useRef, useState } from 'react';
import { toLocalTtsAudioUrl } from '../lib/runtime-model';
import type { TtsProgressEvent } from '../types';

/** Play complete WAV chunks in arrival order without replaying the final output. */
export function useLiveAudio() {
  const job = useRef<string>();
  const queue = useRef<string[]>([]);
  const audio = useRef<HTMLAudioElement>();
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const stop = useCallback(() => {
    job.current = undefined;
    queue.current = [];
    if (audio.current) {
      audio.current.onended = null;
      audio.current.onerror = null;
      audio.current.pause();
      audio.current.removeAttribute('src');
      audio.current.load();
      audio.current = undefined;
    }
    setPlaying(false);
    setBlocked(false);
  }, []);

  const playNext = useCallback(function next() {
    if (audio.current || !queue.current.length) return;
    const player = new Audio(toLocalTtsAudioUrl(queue.current[0]));
    audio.current = player;
    setPlaying(true);
    const finish = () => {
      if (audio.current !== player) return;
      queue.current.shift();
      audio.current = undefined;
      setPlaying(false);
      next();
    };
    player.onended = finish;
    player.onerror = finish;
    void player.play().catch(() => {
      if (audio.current !== player) return;
      audio.current = undefined;
      player.onended = null;
      player.onerror = null;
      setPlaying(false);
      setBlocked(true);
    });
  }, []);

  const begin = useCallback((jobId: string) => {
    stop();
    job.current = jobId;
  }, [stop]);
  const receive = useCallback((event: TtsProgressEvent) => {
    if (event.jobId !== job.current || !event.audioChunkPath) return;
    queue.current.push(event.audioChunkPath);
    if (!blocked) playNext();
  }, [blocked, playNext]);
  const resume = useCallback(() => { setBlocked(false); playNext(); }, [playNext]);
  useEffect(() => stop, [stop]);
  return { begin, receive, stop, playing, blocked, resume };
}
