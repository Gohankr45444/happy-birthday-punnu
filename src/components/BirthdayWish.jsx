import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text3D, Center } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import * as THREE from "three";
import { Gift, PartyPopper } from "lucide-react";

// 🎂 Cake Component
function Cake({ candlesBlown, audioRef }) {
  const candleRefs = useRef([]);

  useFrame(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const volume = audio.currentTime % 1;
      candleRefs.current.forEach((mesh, idx) => {
        if (mesh) mesh.scale.y = 1 + 0.2 * Math.sin(volume * 20 + idx);
      });
    }
  });

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
          <mesh ref={(el) => (candleRefs.current[i] = el)}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 16]} />
            <meshStandardMaterial color="#ffff99" />
          </mesh>
          {!candlesBlown && (
            <mesh position={[0, 0.25, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial emissive="orange" color="yellow" />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

// 🎈 Balloon Component
function Balloon({ position, onPop }) {
  const ref = useRef();
  const speed = 0.002 + Math.random() * 0.003;
  const sway = Math.random() * 0.5;
  const [popped, setPopped] = useState(false);

  useFrame(({ clock }) => {
    if (ref.current && !popped) {
      ref.current.position.y += speed;
      ref.current.position.x += Math.sin(clock.elapsedTime + sway) * 0.002;
      if (ref.current.position.y > 5) ref.current.position.y = -2;
    }
  });

  return !popped ? (
    <group
      ref={ref}
      position={position}
      onClick={() => {
        setPopped(true);
        onPop && onPop(position);
      }}
    >
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={`hsl(${Math.random() * 360}, 70%, 60%)`} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1, 8]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </group>
  ) : null;
}

// 🌠 Shooting Star
function ShootingStar() {
  const ref = useRef();
  const [active, setActive] = useState(true);
  const pos = useRef([Math.random() * 6 - 3, 5, Math.random() * 6 - 3]);
  const speed = 0.05 + Math.random() * 0.03;

  useFrame(() => {
    if (ref.current && active) {
      ref.current.position.x += speed;
      ref.current.position.y -= speed / 2;
      if (ref.current.position.x > 6 || ref.current.position.y < -2) {
        ref.current.position.x = Math.random() * 6 - 3;
        ref.current.position.y = 5;
      }
    }
  });

  return (
    <mesh ref={ref} position={pos.current}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial emissive="white" color="yellow" />
    </mesh>
  );
}

// 🧁 Cupcake
function Cupcake({ start }) {
  const ref = useRef();
  const [y, setY] = useState(start[1]);

  useFrame(() => {
    if (ref.current) {
      setY((prev) => {
        const next = prev - 0.02;
        ref.current.position.y = next;
        return next < -2 ? 6 : next;
      });
    }
  });

  return (
    <mesh ref={ref} position={start}>
      <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
}

// 🏷️ Banner
function Banner() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = 0.1 * Math.sin(clock.elapsedTime);
  });

  return (
    <Center position={[0, 3.5, 0]}>
      <Text3D font="/fonts/helvetiker_regular.typeface.json" size={0.4} height={0.05} ref={ref}>
        Happy Birthday Punnu
        <meshStandardMaterial emissive="pink" color="#ff69b4" />
      </Text3D>
    </Center>
  );
}

// 📐 Responsive Canvas
function ResponsiveCanvas({ children }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (containerRef.current)
        setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fov = size.width < 640 ? 65 : size.width < 1024 ? 55 : 50;

  return (
    <div ref={containerRef} className="w-full h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[80vh] pointer-events-auto">
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
  const [showMessage, setShowMessage] = useState(false);
  const [balloons, setBalloons] = useState(Array.from({ length: 6 }).map((_, i) => ({ id: i })));
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
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          if (avg > 60) {
            setCandlesBlown(true);
            stream.getTracks().forEach((track) => track.stop());
            audioContext.close();
          } else requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (err) {
        console.warn("Mic access denied:", err);
      }
    }

    enableMic();
  }, [opened, candlesBlown]);

  useEffect(() => {
    let timer;
    if (candlesBlown) timer = setTimeout(() => setShowMessage(true), 3000);
    return () => clearTimeout(timer);
  }, [candlesBlown]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-tr from-black via-blue-900 to-purple-900 relative overflow-hidden">
      <audio ref={audioRef} src="/audio/happybirthday.mp3" loop />
      {opened && <Confetti width={window.innerWidth} height={window.innerHeight} />}

      {!opened && (
        <motion.div
          className="flex flex-col items-center cursor-pointer"
          onClick={() => setOpened(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Gift size={100} className="text-pink-600 drop-shadow-lg" />
          <p className="mt-4 text-lg sm:text-xl font-semibold text-pink-700 animate-bounce">Tap to open 🎁</p>
        </motion.div>
      )}

      <AnimatePresence>
        {opened && (
          <motion.div
            className="absolute flex flex-col items-center text-center p-4 sm:p-6 pointer-events-auto max-w-[95%] sm:max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <PartyPopper size={50} className="text-yellow-500 animate-spin-slow" />

            <ResponsiveCanvas>
              <Cake candlesBlown={candlesBlown} audioRef={audioRef} />
              <Banner />
              {balloons.map((b) => (
                <Balloon
                  key={b.id}
                  position={[Math.random() * 4 - 2, Math.random() * 2, Math.random() * 4 - 2]}
                />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <ShootingStar key={i} />
              ))}
              {candlesBlown &&
                Array.from({ length: 10 }).map((_, i) => (
                  <Cupcake key={i} start={[Math.random() * 4 - 2, 6, Math.random() * 4 - 2]} />
                ))}
            </ResponsiveCanvas>

            {!candlesBlown && (
              <>
                <motion.button
                  className="mt-4 flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-pink-600"
                  onClick={() => setCandlesBlown(true)}
                  whileTap={{ scale: 0.9 }}
                >
                  Blow the candles 🎂
                </motion.button>
                <p className="mt-2 text-xs sm:text-sm sm:font-semibold text-gray-300">🎤 Mic mein phoonk maro 😉</p>
              </>
            )}

            {candlesBlown && showMessage && (
              <motion.div
                className="absolute top-1/4 bg-black/70 text-center p-6 rounded-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 mb-4 animate-pulse">
                  ✨ Wishes Come True! ✨
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white">
                  Hope all your dreams and wishes come true, Punnu! 🎂
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
