// src/components/BirthdayWish.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Gift, PartyPopper } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import html2canvas from "html2canvas";

/**
 * Full-featured BirthdayWish component
 *
 * - Responsive Canvas that adapts to device size (camera FOV adjusts)
 * - Auto-enable mic and analyze audio (for candle blow + music visualizer)
 * - Candle flames flicker to music (visualizer)
 * - Starry sky + shooting stars
 * - Interactive balloons (tap to pop -> particle burst)
 * - Cupcake rain after candles blown
 * - Floating 3D banner (waving)
 * - Screenshot "photo frame" moment using html2canvas
 *
 * Notes:
 * - Ensure dependencies installed: three, @react-three/fiber, @react-three/drei, framer-motion, lucide-react, react-confetti, html2canvas
 * - Keep audio file at /audio/happybirthday.mp3 or change src.
 */

// ---------------------- Helpers & small components ----------------------

// tiny random utility
const rand = (a, b) => a + Math.random() * (b - a);

// small sprite texture loader (optional) - we will create basic geometries instead of external images

// ---------------------- Candle flame mesh (flickers with audio) ----------------------
function Flame({ intensity = 1, index = 0 }) {
  // The flame is a small emissive sphere that scales with intensity
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      // slight breathe
      const t = performance.now() / 1000 + index * 0.2;
      const scale = 0.7 + Math.sin(t * 6) * 0.12 + intensity * 0.5;
      ref.current.scale.setScalar(scale);
      ref.current.rotation.y = t * 0.6;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial emissive={"#ffb84d"} emissiveIntensity={2 * intensity} color="#ffd86b" />
    </mesh>
  );
}

// ---------------------- 3D Cake ----------------------
function Cake3D({ candlesBlown, flameIntensities = [1,1,1,1,1] }) {
  return (
    <group position={[0, -0.2, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.5, 32]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1, 1, 0.45, 32]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.35, 32]} />
        <meshStandardMaterial color="#ff85c1" />
      </mesh>

      {/* Candles around top */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        return (
          <group key={i} position={[x, 1.25, z]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.28, 12]} />
              <meshStandardMaterial color="#fff4b3" />
            </mesh>
            {!candlesBlown && <Flame intensity={flameIntensities[i] || 1} index={i} />}
          </group>
        );
      })}
    </group>
  );
}

// ---------------------- Balloons (interactive pop) ----------------------
function Balloon3D({ id, position, onPop }) {
  const ref = useRef();
  const color = useMemo(() => `hsl(${Math.random() * 360}, 75%, 60%)`, []);
  const speed = useMemo(() => 0.0009 + Math.random() * 0.0016, []);
  const sway = useMemo(() => Math.random() * 0.9, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y += speed;
    ref.current.position.x += Math.sin(clock.elapsedTime * 1.2 + sway) * 0.0025;
    if (ref.current.position.y > 5) ref.current.position.y = -2;
  });

  // handle click/tap
  const handlePointerDown = (e) => {
    e.stopPropagation();
    onPop(id, ref.current.position.clone());
  };

  return (
    <group ref={ref} position={position} onPointerDown={handlePointerDown} onClick={handlePointerDown} >
      <mesh>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.9, 8]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}

// ---------------------- Simple particle burst (used for pops / mini confetti) ----------------------
function ParticleBurst({ points }) {
  // points is array of {pos: Vector3, color}
  // We'll render small spheres and animate them outward one-off
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.add(child.userData.vel);
      child.userData.vel.multiplyScalar(0.96);
      child.material.opacity = Math.max(0, child.material.opacity - 0.01);
    });
  });
  return (
    <group ref={groupRef}>
      {points.map((p, i) => {
        const color = p.color || "#ffcc00";
        // random velocity
        const vel = new THREE.Vector3((Math.random() - 0.5) * 0.15, Math.random() * 0.18 + 0.05, (Math.random() - 0.5) * 0.15);
        return (
          <mesh key={i} position={p.pos.toArray()}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={color} transparent opacity={1} />
            {/* store vel on the mesh's userData in a ref once mounted */}
            <primitive
              object={new THREE.Object3D()}
              onUpdate={(obj) => {
                // attach velocity to parent mesh (the mesh is the parent of the primitive),
                // but easiest approach: set userData on parent
                if (obj.parent) obj.parent.userData.vel = vel;
              }}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------------------- Cupcake rain ----------------------
function Cupcake({ initialPos }) {
  const ref = useRef();
  const rotSpeed = useMemo(() => (Math.random() - 0.5) * 0.02, []);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y -= 0.02 + Math.random() * 0.02;
    ref.current.rotation.x += rotSpeed;
    if (ref.current.position.y < -3) ref.current.position.y = 3 + Math.random() * 1.5;
  });
  return (
    <group ref={ref} position={initialPos}>
      <mesh>
        <boxGeometry args={[0.18, 0.12, 0.18]} />
        <meshStandardMaterial color="#f5c6e7" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
        <meshStandardMaterial color="#fff1a8" />
      </mesh>
    </group>
  );
}

// ---------------------- Shooting star system ----------------------
function ShootingStars({ enabled }) {
  const groupRef = useRef();
  useEffect(() => {
    let timer;
    const spawn = () => {
      if (!groupRef.current) return;
      const geom = new THREE.SphereGeometry(0.03, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: "#fff" });
      const mesh = new THREE.Mesh(geom, mat);
      // start at a random top-left-ish and move to bottom-right-ish
      mesh.position.set(rand(-3, -1), rand(2.5, 4), rand(-2, 2));
      mesh.userData.vel = new THREE.Vector3(rand(0.06, 0.12), rand(-0.02, -0.06), rand(-0.02, 0.02));
      groupRef.current.add(mesh);
      // remove after some time
      setTimeout(() => {
        groupRef.current.remove(mesh);
        geom.dispose();
        mat.dispose();
      }, 2200);

      // schedule next
      timer = setTimeout(spawn, rand(1500, 4000));
    };
    if (enabled) spawn();
    return () => clearTimeout(timer);
  }, [enabled]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((m) => {
      m.position.add(m.userData.vel);
    });
  });

  return <group ref={groupRef} />;
}

// ---------------------- Floating 3D banner (waving text) ----------------------
function FloatingBanner({ text }) {
  // uses drei/Text - keep it simple and waving via y-position offset
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 2.6 + Math.sin(clock.elapsedTime * 1.2) * 0.12;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.06;
  });
  return (
    <group ref={ref} position={[0, 2.6, -0.6]}>
      <Text fontSize={0.25} anchorX="center" anchorY="middle" color="#fff" strokeWidth={0.02} strokeColor="#ff4d79">
        {text}
      </Text>
    </group>
  );
}

// ---------------------- Responsive Canvas wrapper (with FOV based on width) ----------------------
function ResponsiveCanvas({ children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      setSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fov = size.width < 420 ? 70 : size.width < 768 ? 60 : 50;

  return (
    <div ref={containerRef} className="w-full h-[45vh] sm:h-[55vh] md:h-[65vh] lg:h-[70vh]">
      {size.width > 0 && (
        <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, 3.2, 6], fov }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          {children}
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      )}
    </div>
  );
}

// ---------------------- Main Component ----------------------
export default function BirthdayWish() {
  // primary states
  const [opened, setOpened] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [balloons, setBalloons] = useState([]); // array of {id, pos}
  const [burstParticles, setBurstParticles] = useState([]); // points for particle bursts
  const [cupcakes, setCupcakes] = useState([]); // positions for cupcake rain
  const [listening, setListening] = useState(false); // mic listening indicator
  const [flameIntensities, setFlameIntensities] = useState([1, 1, 1, 1, 1]); // audio-driven

  // audio refs
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rafRef = useRef(null);

  // initial balloons
  useEffect(() => {
    const init = Array.from({ length: 6 }).map((_, i) => ({
      id: `b-${i}-${Date.now()}-${Math.random()}`,
      pos: new THREE.Vector3(rand(-2.4, 2.4), rand(-0.6, 1.2), rand(-1.5, 1.5)),
    }));
    setBalloons(init);
  }, []);

  // play background music once opened
  useEffect(() => {
    if (opened && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [opened]);

  // --------- auto-enable mic and connect analyser for both music visualizer and blow detection
  useEffect(() => {
    if (!opened) return;
    // if already blew candles, don't enable mic
    if (candlesBlown) return;

    let localAudioCtx;
    let analyser;
    let dataArray;
    let micStream;
    let sourceNode;
    let musicSourceNode;

    const start = async () => {
      try {
        // create audio context
        localAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = localAudioCtx;

        // hook background music into analyser too (so flame flicker follows music)
        if (audioRef.current) {
          try {
            // ensure the audio element can connect - create media element source
            musicSourceNode = localAudioCtx.createMediaElementSource(audioRef.current);
          } catch (e) {
            musicSourceNode = null;
          }
        }

        // create analyser
        analyser = localAudioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        // combine mic + music into analyser via a merger approach
        // get mic
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
          sourceNode = localAudioCtx.createMediaStreamSource(micStream);
        } catch (err) {
          // mic denied or unavailable — still hook music for visualizer if possible
          sourceNode = null;
        }

        // create gain + merger nodes if both exist
        const merger = localAudioCtx.createGain();
        if (musicSourceNode) {
          musicSourceNode.connect(merger);
        }
        if (sourceNode) {
          sourceNode.connect(merger);
        }
        merger.connect(analyser);
        // also connect analyser to destination so music plays
        if (localAudioCtx.state !== "closed") {
          const dest = localAudioCtx.destination;
          // do not connect merger directly to destination to avoid double playing — music element handles playback
        }

        // mic listening indicator
        setListening(true);

        // detect and animate
        const detect = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          // compute an average level to detect blow
          const arr = dataArrayRef.current;
          let sum = 0;
          for (let i = 0; i < arr.length; i++) sum += arr[i];
          const avg = sum / arr.length;

          // Update flame intensities for 5 candles using low/high bands
          // simple mapping: split array into 5 chunks
          const chunk = Math.floor(arr.length / 5) || 1;
          const newInts = Array.from({ length: 5 }).map((_, i) => {
            let s = 0;
            for (let j = i * chunk; j < (i + 1) * chunk && j < arr.length; j++) s += arr[j];
            return Math.min(2.5, Math.max(0.2, s / (chunk * 30))); // normalized
          });
          setFlameIntensities(newInts);

          // blow detection threshold (when user blows)
          if (avg > 60) {
            // trigger blow
            setCandlesBlown(true);
            // stop mic
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach((t) => t.stop());
              micStreamRef.current = null;
            }
            if (audioCtxRef.current) {
              audioCtxRef.current.close().catch(() => {});
              audioCtxRef.current = null;
            }
            setListening(false);
            return;
          }

          rafRef.current = requestAnimationFrame(detect);
        };
        detect();
      } catch (err) {
        console.warn("Audio init error", err);
        setListening(false);
      }
    };

    start();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      setListening(false);
    };
  }, [opened, candlesBlown]);

  // when candles blow: spawn cupcake rain + fireworks + confetti & freeze banner / show screenshot
  useEffect(() => {
    if (!candlesBlown) return;

    // spawn cupcake positions
    const cupcakesArr = Array.from({ length: 16 }).map(() => new THREE.Vector3(rand(-2.5, 2.5), rand(1.2, 4.2), rand(-1.5, 1.5)));
    setCupcakes(cupcakesArr);

    // minor confetti (we already have big confetti overlay)
    // spawn burstParticles for fun near cake
    const bursts = [];
    for (let i = 0; i < 12; i++) {
      bursts.push({
        pos: new THREE.Vector3(rand(-0.6, 0.6), rand(1.4, 2.2), rand(-0.3, 0.3)),
        color: Math.random() > 0.5 ? "#ffcc66" : "#ffd1f0",
      });
    }
    setBurstParticles(bursts);

    // stop flame intensities
    setFlameIntensities([0, 0, 0, 0, 0]);

    // ensure audio context is closed if still open
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setListening(false);
  }, [candlesBlown]);

  // when a balloon pops -> remove it and spawn burst particles near that world position
  const handleBalloonPop = (id, worldPos) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    // create particle burst positions derived from worldPos
    const pts = Array.from({ length: 12 }).map(() => ({ pos: worldPos.clone(), color: Math.random() > 0.5 ? "#ffcc66" : "#fff3f3" }));
    setBurstParticles((p) => p.concat(pts));
    // small ephemeral confetti overlay could be triggered here (we keep global confetti already)
  };

  // screenshot function using html2canvas
  const screenshotRef = useRef();
  const takeScreenshot = async () => {
    const node = screenshotRef.current || document.body;
    try {
      const canvas = await html2canvas(node, { useCORS: true, scale: 1.5 });
      const dataURL = canvas.toDataURL("image/png");
      // open in new tab
      const w = window.open();
      if (w) {
        w.document.body.style.margin = "0";
        const img = new Image();
        img.src = dataURL;
        img.style.maxWidth = "100%";
        w.document.body.appendChild(img);
      } else {
        // fallback: download
        const link = document.createElement("a");
        link.download = "birthday.png";
        link.href = dataURL;
        link.click();
      }
    } catch (err) {
      console.error("Screenshot failed", err);
    }
  };

  // swipe detection fallback (simple) for mobile to blow candles
  const touchStartY = useRef(null);
  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    if (t) touchStartY.current = t.clientY;
  };
  const handleTouchEnd = (e) => {
    const t = e.changedTouches?.[0];
    if (!t || !touchStartY.current) return;
    if (touchStartY.current - t.clientY > 60) {
      setCandlesBlown(true);
    }
    touchStartY.current = null;
  };

  // render
  return (
    <div
      ref={screenshotRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col items-center justify-center min-h-screen w-screen bg-gradient-to-tr from-pink-200 via-purple-200 to-blue-200 relative overflow-hidden"
    >
      {/* audio element (background music) */}
      <audio ref={audioRef} src="/audio/happybirthday.mp3" autoPlay loop />

      {/* big confetti overlay after open */}
      {opened && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      {/* Gift (initial) */}
      {!opened && (
        <motion.div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => setOpened(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.9 }}
        >
          <Gift size={100} className="text-pink-600 drop-shadow-lg" />
          <p className="mt-4 text-lg sm:text-xl font-semibold text-pink-700 animate-bounce">Tap to open 🎁</p>
        </motion.div>
      )}

      {/* Main modal */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center p-4 sm:p-6 bg-white/80 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto w-[95%] sm:w-[80%] md:w-[70%] lg:w-[60%] max-w-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PartyPopper size={48} className="text-yellow-500 animate-spin-slow" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-600 mt-2">🎉 Happy Birthday Punnu 🎉</h1>
            <p className="mt-1 text-sm sm:text-base md:text-lg text-gray-700">Wishing you a day filled with love, laughter, and joy 💖</p>

            {/* responsive 3D area */}
            <div className="w-full mt-4">
              <ResponsiveCanvas>
                {/* star field as background (simple points) */}
                <Stars />

                {/* floating banner */}
                <FloatingBanner text={"Happy Birthday Punnu!"} />

                {/* cake - flames use flameIntensities */}
                <Cake3D candlesBlown={candlesBlown} flameIntensities={flameIntensities} />

                {/* balloons */}
                {balloons.map((b) => (
                  <Balloon3D key={b.id} id={b.id} position={b.pos} onPop={handleBalloonPop} />
                ))}

                {/* particle bursts */}
                {burstParticles.length > 0 && <ParticleBurst points={burstParticles} />}

                {/* cupcake rain */}
                {cupcakes.map((cPos, i) => <Cupcake key={`cup-${i}`} initialPos={cPos} />)}

                {/* fireworks after candles blown */}
                {candlesBlown && Array.from({ length: 3 }).map((_, i) => (
                  <FireworkParticle key={`fw-${i}`} position={new THREE.Vector3(rand(-1.8, 1.8), 2 + i * 0.4, rand(-1.2, 1.2))} />
                ))}

                {/* shooting stars */}
                <ShootingStars enabled={!candlesBlown} />
              </ResponsiveCanvas>
            </div>

            {/* mic instruction + listening indicator */}
            {!candlesBlown && (
              <div className="mt-3 flex flex-col items-center">
                <p className="text-sm sm:text-base text-purple-700 font-semibold animate-pulse">
                  🎤 Blow into your mic, swipe down, or tap the button to put out the candles
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${listening ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} />
                  <span className="text-xs sm:text-sm text-gray-600">{listening ? "Listening..." : "Mic off / unavailable"}</span>
                </div>
              </div>
            )}

            {/* controls */}
            <div className="mt-3 flex gap-3 items-center">
              {!candlesBlown ? (
                <>
                  <motion.button
                    onClick={() => setCandlesBlown(true)}
                    whileTap={{ scale: 0.95 }}
                    className="bg-pink-500 text-white px-3 py-2 rounded-full shadow hover:bg-pink-600 text-sm sm:text-base"
                  >
                    Blow the candles 🎂 (Fallback)
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div className="text-base sm:text-lg text-orange-600 font-bold">✨ Candles blown — wishes granted ✨</motion.div>
                  <motion.button
                    onClick={() => takeScreenshot()}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-full shadow hover:bg-blue-700 text-sm sm:text-base"
                  >
                    Take a screenshot 📸
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------- Small star field component (points) ----------------------
function Stars() {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3 + 0] = rand(-6, 6);
      arr[i * 3 + 1] = rand(0, 5);
      arr[i * 3 + 2] = rand(-4, 4);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.elapsedTime * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={positions.length / 3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#fff" />
    </points>
  );
}
