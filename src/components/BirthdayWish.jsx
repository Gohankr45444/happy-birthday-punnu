import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Gift, PartyPopper } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// 🍰 Cake Component
function Cake3D({ candlesBlown }) {
  return (
    <>
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

      {/* Candles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <group
          key={i}
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.6,
            1.5,
            Math.sin((i / 5) * Math.PI * 2) * 0.6,
          ]}
        >
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
            <meshStandardMaterial color="#ffff99" />
          </mesh>
          {!candlesBlown && (
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial
                emissive="orange"
                emissiveIntensity={2}
                color="yellow"
              />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

// 🌌 Falling Stars
function FallingStars() {
  const groupRef = useRef();
  const stars = React.useMemo(
    () =>
      Array.from({ length: 100 }).map(() => ({
        position: [
          (Math.random() - 0.5) * 30,
          Math.random() * 15 + 5,
          (Math.random() - 0.5) * 30,
        ],
        speed: Math.random() * 0.02 + 0.005,
        size: Math.random() * 0.15 + 0.05,
      })),
    []
  );

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((star, i) => {
        star.position.y -= stars[i].speed;
        if (star.position.y < 0) star.position.y = 15;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map((s, i) => (
        <mesh key={i} position={s.position}>
          <sphereGeometry args={[s.size, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
}

// 🌠 Shooting Stars
function ShootingStar() {
  const ref = useRef();
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState([Math.random() * 20 - 10, 15, Math.random() * 20 - 10]);

  useFrame(() => {
    if (active) {
      ref.current.position[0] -= 0.6;
      ref.current.position[1] -= 0.3;
      if (ref.current.position[1] < 0) setActive(false);
    } else {
      if (Math.random() < 0.004) {
        setPos([Math.random() * 20 - 10, 15, Math.random() * 20 - 10]);
        setActive(true);
      }
    }
  });

  return active ? (
    <mesh ref={ref} position={pos}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshBasicMaterial color="yellow" />
    </mesh>
  ) : null;
}

// 🎈 Floating Balloon
function Balloon({ position, onPop }) {
  const ref = useRef();
  const speed = 0.002 + Math.random() * 0.003;
  const sway = Math.random() * 0.5;

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y += speed;
      ref.current.position.x += Math.sin(clock.elapsedTime + sway) * 0.002;
      if (ref.current.position.y > 5) ref.current.position.y = -2;
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={onPop}
      onPointerDown={onPop}
      style={{ cursor: "pointer" }}
    >
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={`hsl(${Math.random() * 360},70%,60%)`} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  );
}

// 🎆 Firework Particles
function FireworkParticle({ position }) {
  const ref = useRef();
  const velocity = useRef(
    Array.from({ length: 20 }).map(
      () =>
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        )
    )
  );

  useFrame(() => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        child.position.add(velocity.current[i]);
        velocity.current[i].multiplyScalar(0.95);
      });
    }
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial emissive="yellow" emissiveIntensity={2} color="orange" />
        </mesh>
      ))}
    </group>
  );
}

// 📐 Responsive Canvas
function ResponsiveCanvas({ children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fov = size.width < 640 ? 65 : size.width < 1024 ? 55 : 50;

  return (
    <div ref={containerRef} className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[75vh] pointer-events-auto">
      {size.width && size.height && (
        <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, 3, 6], fov }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          {children}
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      )}
    </div>
  );
}

// 🎉 Main Component
export default function BirthdayWish() {
  const [opened, setOpened] = useState(false);
  const [candlesBlown, setCandlesBlown] = useState(false);
  const [balloons, setBalloons] = useState(
    Array.from({ length: 6 }).map((_, i) => ({ id: i, popped: false }))
  );
  const audioRef = useRef(null);

  useEffect(() => {
    if (opened && audioRef.current) audioRef.current.play().catch(() => {});
  }, [opened]);

  // 🎤 Microphone detection
  useEffect(() => {
    if (!opened || candlesBlown) return;
    let audioContext, analyser, dataArray, source;

    async function enableMic() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          if (avg > 60) {
            setCandlesBlown(true);
            stream.getTracks().forEach((track) => track.stop());
            audioContext.close();
          } else {
            requestAnimationFrame(checkVolume);
          }
        };
        checkVolume();
      } catch (err) {
        console.warn("Mic access denied:", err);
      }
    }

    enableMic();
  }, [opened, candlesBlown]);

  const handlePop = (id) => {
    setBalloons((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-tr from-black via-blue-900 to-purple-900 relative overflow-hidden">
      {/* 🎵 Music */}
      <audio ref={audioRef} src="/audio/happybirthday.mp3" loop autoPlay />

      {/* 🎊 Confetti */}
      {opened && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      {/* 🎁 Gift */}
      {!opened && (
        <motion.div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => setOpened(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Gift size={100} className="text-pink-600 drop-shadow-lg" />
          <p className="mt-4 text-lg sm:text-xl font-semibold text-pink-300 animate-bounce">
            Tap to open 🎁
          </p>
        </motion.div>
      )}

      {/* 🎂 Cake Scene */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="absolute flex flex-col items-center text-center p-4 sm:p-6 bg-black/60 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto max-w-[95%] sm:max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <PartyPopper size={50} className="text-yellow-500 animate-spin-slow" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-300 mt-3">
              🎉 Happy Birthday Punnu 🎉
            </h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-300">
              Wishing you a dreamy night full of stars ✨
            </p>

            {/* 3D Scene */}
            <ResponsiveCanvas>
              <FallingStars />
              <ShootingStar />
              <Cake3D candlesBlown={candlesBlown} />
              {balloons.map(
                (b) =>
                  !b.popped && (
                    <Balloon
                      key={b.id}
                      position={[Math.random() * 4 - 2, Math.random() * 2, Math.random() * 4 - 2]}
                      onPop={() => handlePop(b.id)}
                    />
                  )
              )}
              {candlesBlown &&
                Array.from({ length: 3 }).map((_, i) => (
                  <FireworkParticle
                    key={i}
                    position={[Math.random() * 4 - 2, 2 + i, Math.random() * 4 - 2]}
                  />
                ))}
            </ResponsiveCanvas>

            {/* Candle Blow Button */}
            {!candlesBlown ? (
              <>
                <motion.button
                  className="mt-4 flex items-center gap-2 bg-pink-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full shadow-lg hover:bg-pink-700 text-sm sm:text-base"
                  onClick={() => setCandlesBlown(true)}
                  whileTap={{ scale: 0.9 }}
                >
                  Blow the candles 🎂
                </motion.button>
                <p className="mt-2 text-xs sm:text-sm sm:font-semibold text-gray-400">
                  🎤 Mic mein phoonk maro 😉
                </p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg sm:text-xl md:text-2xl text-orange-400 font-bold mt-4"
              >
                ✨ Candles blown! Make a wish ✨
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
