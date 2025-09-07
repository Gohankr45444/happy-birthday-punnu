// src/components/BirthdayWish.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Gift, PartyPopper } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import html2canvas from "html2canvas";

/* -------------------------------------------------------------------------- */
/*  Helper random                                                               */
/* -------------------------------------------------------------------------- */
const rand = (a, b) => a + Math.random() * (b - a);

/* -------------------------------------------------------------------------- */
/*  Flame (visualized by Audio)                                                 */
/* -------------------------------------------------------------------------- */
function Flame({ intensity = 1, index = 0, frozen = false }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (frozen) return;
    const t = clock.elapsedTime + index * 0.2;
    const base = 0.7;
    const scale = base + Math.sin(t * 6) * 0.08 + intensity * 0.35;
    ref.current.scale.setScalar(Math.max(0.2, scale));
    ref.current.rotation.y = t * 0.6;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.07, 10, 10]} />
      <meshStandardMaterial emissive="#ffb84d" emissiveIntensity={2 * intensity} color="#ffd86b" />
    </mesh>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cake (uses Flame components)                                                */
/* -------------------------------------------------------------------------- */
function Cake3D({ candlesBlown, flameIntensities = [1, 1, 1, 1, 1], frozen = false }) {
  return (
    <group position={[0, -0.2, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.6, 32]} />
        <meshStandardMaterial color="#ffb6c1" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.5, 32]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.4, 32]} />
        <meshStandardMaterial color="#ff85c1" />
      </mesh>

      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        return (
          <group key={i} position={[x, 1.5, z]}>
            <mesh>
              <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
              <meshStandardMaterial color="#ffff99" />
            </mesh>
            {!candlesBlown && (
              <mesh position={[0, 0.25, 0]}>
                <Flame intensity={flameIntensities[i] || 1} index={i} frozen={frozen} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Balloon (interactive pop)                                                   */
/* -------------------------------------------------------------------------- */
function Balloon3D({ id, position, onPop, frozen = false }) {
  const ref = useRef();
  const color = useMemo(() => `hsl(${Math.random() * 360},75%,64%)`, []);
  const speed = useMemo(() => 0.0008 + Math.random() * 0.0016, []);
  const sway = useMemo(() => Math.random() * 1.2, []);
  useFrame(({ clock }) => {
    if (!ref.current || frozen) return;
    ref.current.position.y += speed;
    ref.current.position.x += Math.sin(clock.elapsedTime * 1.1 + sway) * 0.0025;
    if (ref.current.position.y > 5) ref.current.position.y = -2;
  });

  const handlePop = (e) => {
    e.stopPropagation();
    if (onPop) onPop(id, ref.current.position.clone());
  };

  return (
    <group ref={ref} position={position} onPointerDown={handlePop} onClick={handlePop} style={{ cursor: "pointer" }}>
      <mesh>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.9, 8]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Particle burst (mini confetti) used for balloon pops                       */
/* -------------------------------------------------------------------------- */
function ParticleBurst({ points = [], frozen = false }) {
  const groupRef = useRef();
  useFrame(() => {
    if (!groupRef.current || frozen) return;
    groupRef.current.children.forEach((child) => {
      child.position.add(child.userData.vel);
      child.userData.vel.multiplyScalar(0.95);
      child.material.opacity = Math.max(0, child.material.opacity - 0.02);
    });
  });
  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <mesh key={i} position={p.pos.toArray()}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color={p.color || "#ffd166"} transparent opacity={1} />
          <primitive object={new THREE.Object3D()} onUpdate={(o) => { if (o.parent) o.parent.userData.vel = p.vel; }} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Firework particles (bigger burst when candles blown)                       */
/* -------------------------------------------------------------------------- */
function FireworkParticle({ position = new THREE.Vector3(0, 2, 0), frozen = false }) {
  const groupRef = useRef();
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      child.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.25, Math.random() * 0.35 + 0.08, (Math.random() - 0.5) * 0.25);
    });
  }, []);
  useFrame(() => {
    if (!groupRef.current || frozen) return;
    groupRef.current.children.forEach((child) => {
      child.position.add(child.userData.vel);
      child.userData.vel.multiplyScalar(0.94);
      child.material.opacity = Math.max(0, child.material.opacity - 0.01);
    });
  });
  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={`hsl(${Math.random() * 360},80%,60%)`} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cupcake falling (after blow)                                               */
/* -------------------------------------------------------------------------- */
function Cupcake({ initial }) {
  const ref = useRef();
  const rot = useMemo(() => (Math.random() - 0.5) * 0.02, []);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.y -= 0.02 + Math.random() * 0.01;
    ref.current.rotation.z += rot;
    if (ref.current.position.y < -3) ref.current.position.y = 4 + Math.random();
  });
  return (
    <group ref={ref} position={initial}>
      <mesh>
        <boxGeometry args={[0.18, 0.12, 0.18]} />
        <meshStandardMaterial color="#f6b6d6" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
        <meshStandardMaterial color="#fff7b0" />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shooting stars                                                              */
/* -------------------------------------------------------------------------- */
function ShootingStars({ enabled = true, frozen = false }) {
  const groupRef = useRef();
  useEffect(() => {
    let timer;
    const spawn = () => {
      if (!groupRef.current) return;
      const geom = new THREE.SphereGeometry(0.03, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: "#fff" });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(rand(-4, -1), rand(1.8, 3.6), rand(-2, 2));
      mesh.userData.vel = new THREE.Vector3(rand(0.08, 0.14), rand(-0.02, -0.06), rand(-0.02, 0.02));
      groupRef.current.add(mesh);
      setTimeout(() => {
        if (groupRef.current) {
          groupRef.current.remove(mesh);
          geom.dispose();
          mat.dispose();
        }
      }, 2200);
      timer = setTimeout(spawn, rand(1500, 3800));
    };
    if (enabled && !frozen) spawn();
    return () => clearTimeout(timer);
  }, [enabled, frozen]);

  useFrame(() => {
    if (!groupRef.current || frozen) return;
    groupRef.current.children.forEach((m) => {
      m.position.add(m.userData.vel);
    });
  });
  return <group ref={groupRef} />;
}

/* -------------------------------------------------------------------------- */
/*  Floating 3D Banner (waving text)                                           */
/* -------------------------------------------------------------------------- */
function FloatingBanner({ text = "Happy Birthday!" , frozen = false}) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (frozen) {
      ref.current.position.y = 2.6;
      ref.current.rotation.y = 0;
      return;
    }
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

/* -------------------------------------------------------------------------- */
/*  Stars background                                                             */
/* -------------------------------------------------------------------------- */
function Stars({ frozen = false }) {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3 + 0] = rand(-6, 6);
      arr[i * 3 + 1] = rand(0, 5);
      arr[i * 3 + 2] = rand(-4, 4);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || frozen) return;
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

/* -------------------------------------------------------------------------- */
/*  Responsive Canvas Wrapper                                                    */
/* -------------------------------------------------------------------------- */
function ResponsiveCanvas({ children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
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

/* -------------------------------------------------------------------------- */
/*  Main Component                                                              */
/* -------------------------------------------------------------------------- */
export default function BirthdayWish() {
  const [opened, setOpened] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [balloons, setBalloons] = useState([]);
  const [burstPoints, setBurstPoints] = useState([]); // for pop bursts
  const [cupcakes, setCupcakes] = useState([]); // cupcake positions
  const [listening, setListening] = useState(false);
  const [flameIntensities, setFlameIntensities] = useState([1, 1, 1, 1, 1]);
  const [frozen, setFrozen] = useState(false); // freeze animation for screenshot/frame

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const micStreamRef = useRef(null);
  const rafRef = useRef(null);
  const screenshotRef = useRef();

  // initial balloons
  useEffect(() => {
    const init = Array.from({ length: 6 }).map((_, i) => ({
      id: `b-${i}-${Date.now()}-${Math.random()}`,
      pos: new THREE.Vector3(rand(-2.2, 2.2), rand(-1, 1.2), rand(-1.2, 1.2)),
    }));
    setBalloons(init);
  }, []);

  // play audio only on user gesture (gift click)
  // mic auto-enable + analyser for music visualizer & blow detection
  useEffect(() => {
    if (!opened) return;
    if (candlesBlown) return;

    // create audio context and analysers
    let localAudioCtx;
    let analyser;
    let dataArray;
    let sourceNode;

    const start = async () => {
      try {
        localAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = localAudioCtx;

        // analyser for music (connected to audio element)
        analyser = localAudioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        // connect audio element (music) to analyser
        if (audioRef.current) {
          try {
            const musicSource = localAudioCtx.createMediaElementSource(audioRef.current);
            musicSource.connect(analyser);
          } catch (e) {
            // sometimes crossOrigin or CORS issues prevent creation; ignore gracefully
          }
        }

        // try mic stream for blow detection as well (optional)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          sourceNode = localAudioCtx.createMediaStreamSource(stream);
          sourceNode.connect(analyser);
        } catch (err) {
          // mic denied or not available; still use music for visualizer
        }

        setListening(true);

        const analyze = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const arr = dataArrayRef.current;
          // average for blow detection
          let sum = 0;
          for (let i = 0; i < arr.length; i++) sum += arr[i];
          const avg = sum / arr.length;

          // update flame intensities by splitting arr into 5 chunks
          const chunk = Math.floor(arr.length / 5) || 1;
          const newInts = Array.from({ length: 5 }).map((_, i) => {
            let s = 0;
            for (let j = i * chunk; j < (i + 1) * chunk && j < arr.length; j++) s += arr[j];
            // normalize ~ 0.2 .. 2.2
            return Math.min(2.2, Math.max(0.2, s / (chunk * 28)));
          });
          setFlameIntensities(newInts);

          // blow detection threshold
          if (avg > 78) {
            setCandlesBlown(true);
            // stop mic and audio context
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

          rafRef.current = requestAnimationFrame(analyze);
        };
        analyze();
      } catch (err) {
        console.warn("Audio analyser init error", err);
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

  // when candles blow => spawn cupcakes, fireworks and freeze option + confetti already triggers
  useEffect(() => {
    if (!candlesBlown) return;
    // cupcakes
    const cupcakesArr = Array.from({ length: 12 }).map(() => new THREE.Vector3(rand(-2.5, 2.5), rand(2.2, 5.2), rand(-1.5, 1.5)));
    setCupcakes(cupcakesArr);

    // fireworks: they are rendered directly via FireworkParticle in canvas (we'll render 2-3)
    // burstParticles for little bursts
    const bursts = [];
    for (let i = 0; i < 10; i++) {
      bursts.push({
        pos: new THREE.Vector3(rand(-0.8, 0.8), rand(1.3, 2.2), rand(-0.4, 0.4)),
        color: Math.random() > 0.5 ? "#ffd166" : "#ffb4d6",
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.12, Math.random() * 0.18 + 0.02, (Math.random() - 0.5) * 0.12),
      });
    }
    setBurstPoints(bursts);

    // stop listening and analyser
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

  // balloon pop handler
  const handleBalloonPop = (id, worldPos) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    // spawn small burst points around worldPos
    const pts = Array.from({ length: 10 }).map(() => ({
      pos: worldPos.clone(),
      color: Math.random() > 0.5 ? "#ffd166" : "#ff9fce",
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.12, Math.random() * 0.18 + 0.02, (Math.random() - 0.5) * 0.12),
    }));
    setBurstPoints((p) => p.concat(pts));
    // also trigger confetti overlay briefly by toggling opened state? we'll use global Confetti which is always rendered when opened
  };

  // screenshot and freeze functionality
  const takeScreenshot = async () => {
    // freeze animations (stop useFrame updates by checking frozen)
    setFrozen(true);
    try {
      const node = screenshotRef.current || document.body;
      const canvas = await html2canvas(node, { useCORS: true, scale: 1.5 });
      const dataURL = canvas.toDataURL("image/png");
      const w = window.open();
      if (w) {
        w.document.body.style.margin = "0";
        const img = new Image();
        img.src = dataURL;
        img.style.maxWidth = "100%";
        w.document.body.appendChild(img);
      } else {
        const link = document.createElement("a");
        link.download = "birthday.png";
        link.href = dataURL;
        link.click();
      }
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      // unfreeze after a bit so UI continues; user will have opened image in new tab
      setTimeout(() => setFrozen(false), 800);
    }
  };

  // touch swipe detection for blowing (downward swipe)
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

  // screenshot container ref
  const containerRef = screenshotRef;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col items-center justify-center min-h-screen w-screen bg-gradient-to-tr from-pink-200 via-purple-200 to-blue-200 relative overflow-hidden"
    >
      {/* audio element: NO autoplay; play on user click when opening */}
      <audio ref={audioRef} src="/audio/happybirthday.mp3" autoPlay loop />

      {/* Confetti overlay when opened */}
      {opened && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={candlesBlown ? 250 : 120} />}

      {/* initial gift */}
      {!opened && (
        <motion.div
          className="flex flex-col items-center cursor-pointer"
          onClick={async () => {
            setOpened(true);
            // try to play audio immediately (user gesture)
            if (audioRef.current) {
              try {
                await audioRef.current.play();
              } catch (e) {
                console.log("Autoplay blocked:", e);
              }
            }
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Gift size={100} className="text-pink-600 drop-shadow-lg" />
          <p className="mt-4 text-lg sm:text-xl font-semibold text-pink-700 animate-bounce">Tap to open 🎁</p>
        </motion.div>
      )}

      {/* birthday modal / scene */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="absolute flex flex-col items-center text-center p-4 sm:p-6 bg-white/80 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto w-[95%] sm:w-[80%] md:w-[70%] lg:w-[60%] max-w-3xl"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PartyPopper size={50} className="text-yellow-500 animate-spin-slow" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-pink-600 mt-3">🎉 Happy Birthday Punnu 🎉</h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-700">Wishing you a day filled with love, laughter, and joy 💖</p>

            {/* canvas */}
            <div className="mt-4 w-full">
              <ResponsiveCanvas>
                {/* Stars / shooting stars */}
                <Stars frozen={frozen} />
                <ShootingStars enabled={!candlesBlown} frozen={frozen} />

                {/* banner */}
                <FloatingBanner text={"Happy Birthday Punnu!"} frozen={frozen} />

                {/* cake */}
                <Cake3D candlesBlown={candlesBlown} flameIntensities={flameIntensities} frozen={frozen} />

                {/* balloons (interactive) */}
                {!candlesBlown &&
                  balloons.map((b) => (
                    <Balloon3D key={b.id} id={b.id} position={b.pos} onPop={handleBalloonPop} frozen={frozen} />
                  ))}

                {/* burst particles from pops */}
                {burstPoints.length > 0 && <ParticleBurst points={burstPoints} frozen={frozen} />}

                {/* cupcakes */}
                {candlesBlown && cupcakes.map((c, i) => <Cupcake key={`cup-${i}`} initial={c} />)}

                {/* fireworks when blown */}
                {candlesBlown &&
                  Array.from({ length: 2 }).map((_, i) => (
                    <FireworkParticle key={`fw-${i}`} position={new THREE.Vector3(rand(-1.5, 1.5), 1.8 + i * 0.6, rand(-1.2, 1.2))} frozen={frozen} />
                  ))}
              </ResponsiveCanvas>
            </div>

            {/* instructions / controls */}
            {!candlesBlown ? (
              <>
                <motion.button
                  className="mt-4 flex items-center gap-2 bg-pink-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full shadow-lg hover:bg-pink-600 text-sm sm:text-base"
                  onClick={() => setCandlesBlown(true)}
                  whileTap={{ scale: 0.95 }}
                >
                  Blow the candles 🎂
                </motion.button>
                <p className="mt-2 text-xs sm:text-sm text-gray-600">🎤 Or blow into the mic / swipe down to extinguish the candles</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${listening ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} />
                  <span className="text-xs text-gray-600">{listening ? "Listening..." : "Mic may be off or blocked"}</span>
                </div>
              </>
            ) : (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg sm:text-xl md:text-2xl text-orange-600 font-bold mt-4">
                  ✨ Candles blown! May your wishes come true ✨
                </motion.div>

                <div className="mt-3 flex gap-3">
                  <motion.button onClick={takeScreenshot} whileTap={{ scale: 0.95 }} className="bg-blue-600 text-white px-3 py-2 rounded-full shadow hover:bg-blue-700 text-sm sm:text-base">
                    Take a screenshot 📸
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
