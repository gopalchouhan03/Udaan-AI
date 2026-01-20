import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { publish } from '../utils/eventBus';

const MODEL_URL = '/models'; // put models in public/models

const expressionToMood = (expression) => {
  switch (expression) {
    case 'happy': return 5;
    case 'surprised': return 4;
    case 'neutral': return 3;
    case 'sad': return 2;
    case 'angry':
    case 'disgusted':
    case 'fearful':
    default: return 1;
  }
};

const FaceMoodDetector = ({ enabled = false, autoSave = false, onSave, mode = 'fast' }) => {
  const videoRef = useRef(null);
  const windowRef = useRef([]);
  const rafRef = useRef(null);
  const lastRunRef = useRef(0);
  const perfRef = useRef({ deltas: [], lastTime: null });

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      } catch (err) {
        console.error('Error loading face-api models', err);
      }
    };

    const start = async () => {
      try {
        // enable WebGL backend for tfjs to accelerate inference
        try {
          await tf.setBackend('webgl');
          await tf.ready();
        } catch (be) {
          // fallback silently
        }

        await loadModels();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!mounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // detection settings by mode
        const cfg = {
          ultra: { inputSize: 64, scoreThreshold: 0.35, sampleMs: 250, smoothWindow: 2, canvasScale: 0.5 },
          fast: { inputSize: 128, scoreThreshold: 0.4, sampleMs: 600, smoothWindow: 3, canvasScale: 0.6 },
          balanced: { inputSize: 160, scoreThreshold: 0.5, sampleMs: 1200, smoothWindow: 5, canvasScale: 0.75 }
        };
        const { inputSize, scoreThreshold, sampleMs } = cfg[mode] || cfg.fast;

        const options = new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });

        // create a small offscreen canvas so detections run on a small bitmap (faster)
        const canvas = document.createElement('canvas');
        // shrink canvas aggressively for ultra mode to speed up detection
        const scale = cfg[mode]?.canvasScale || 0.6;
        canvas.width = Math.max(64, Math.floor(inputSize * scale));
        canvas.height = Math.max(48, Math.floor(inputSize * 0.75 * scale));
        const ctx = canvas.getContext('2d');

        const loop = async (time) => {
          if (!mounted) return;
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
          // throttle based on sampleMs
          if (time - lastRunRef.current >= sampleMs) {
            lastRunRef.current = time;
            try {
              // draw scaled frame to canvas
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const detections = await faceapi.detectSingleFace(canvas, options).withFaceExpressions();
              if (detections && detections.expressions) {
                const exps = detections.expressions;
                const entries = Object.entries(exps).sort((a, b) => b[1] - a[1]);
                const [dominant, confidence] = entries[0];
                const mood = expressionToMood(dominant);
                windowRef.current.push({ value: mood, confidence });
                const win = cfg[mode]?.smoothWindow || 3;
                if (windowRef.current.length > win) windowRef.current.shift();

                const weightSum = windowRef.current.reduce((s, it) => s + it.confidence, 0) || 0.0001;
                const avg = windowRef.current.reduce((s, it) => s + it.value * it.confidence, 0) / weightSum;
                const avgConfidence = windowRef.current.reduce((s, it) => s + it.confidence, 0) / windowRef.current.length;
                const detected = { value: Math.round(avg), confidence: avgConfidence, source: 'camera', timestamp: new Date().toISOString() };
                publish('moods:detected', detected);
                if (autoSave && avgConfidence > 0.75) {
                  onSave && onSave(detected);
                }

                // performance tracking: compute delta between frames and keep a running average
                const last = perfRef.current.lastTime || time;
                const delta = time - last;
                perfRef.current.lastTime = time;
                perfRef.current.deltas.push(delta);
                if (perfRef.current.deltas.length > 10) perfRef.current.deltas.shift();
                const sum = perfRef.current.deltas.reduce((s, v) => s + v, 0);
                const avgMs = sum / perfRef.current.deltas.length;
                const fps = avgMs > 0 ? Math.round(1000 / avgMs) : 0;
                publish('camera:perf', { fps, avgMs: Math.round(avgMs) });
              }
            } catch (err) {
              // detection error for this frame — ignore
            }
          }
          rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error('Face detector start error', err);
      }
    };

    if (enabled) start();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [enabled, autoSave, onSave]);

  return (
    <div className="face-mood-detector">
      <video ref={videoRef} width={240} height={180} className="rounded border" muted playsInline style={{ display: enabled ? 'block' : 'none', objectFit: 'cover' }} />
      {!enabled && <div className="text-xs text-gray-500">Camera disabled</div>}
      {enabled && <div className="text-xs text-green-600">Camera active — detection running</div>}
    </div>
  );
};

export default FaceMoodDetector;
