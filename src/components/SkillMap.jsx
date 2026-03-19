import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Float, Environment, Billboard } from '@react-three/drei';

const COLORS = ['#00e5ff','#3fe0c5','#7c6fff','#ff6b6b','#ffd166','#06d6a0','#ef476f','#118ab2'];

function seedPos(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  const r = (n) => (((h * (n + 7)) & 0xffff) / 0xffff) * 2 - 1;
  return [r(1) * 2.6, r(2) * 2.2, r(3) * 1.8];
}

function SkillNode({ skill, position, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Float speed={1.6 + ((skill.charCodeAt(0) % 5) * 0.2)} rotationIntensity={0.4} floatIntensity={0.9} position={position}>
      <mesh
        onClick={onClick}
        onPointerOver={() => { setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerOut={() =>  { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[hovered ? 0.44 : 0.34, 48, 48]} />
        <meshPhysicalMaterial
          color={hovered ? '#ffffff' : color}
          roughness={0.15} metalness={0.6} clearcoat={1} clearcoatRoughness={0.1}
          emissive={hovered ? color : '#000000'} emissiveIntensity={hovered ? 0.6 : 0}
        />
      </mesh>
      <Billboard position={[0, -0.65, 0]}>
        <Text fontSize={hovered ? 0.21 : 0.17} color={hovered ? '#ffffff' : 'rgba(238,244,255,0.85)'}
          anchorX="center" anchorY="middle" maxWidth={2.6}>
          {skill}
        </Text>
      </Billboard>
    </Float>
  );
}

// skills: string[] — only live/listed skills passed in from Firestore
export default function SkillMap({ skills = [], onSkillSelect }) {
  const nodes = skills.map((name, i) => ({
    name, pos: seedPos(name), color: COLORS[i % COLORS.length],
  }));

  return (
    <div style={{ width:'100%', height:360, borderRadius:16, overflow:'hidden', touchAction:'none', background:'rgba(0,0,0,0.25)' }}
      aria-label="3D interactive skill map">
      {skills.length === 0 ? (
        <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'rgba(255,255,255,0.3)', fontSize:14 }}>
          <span style={{ fontSize:32 }}>🌐</span>
          <span>No active skills to display yet</span>
        </div>
      ) : (
        <Canvas camera={{ position:[0,0,5.8], fov:48 }} dpr={[1,1.5]} style={{ touchAction:'none' }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[6,6,4]} intensity={1.2} color="#00e5ff" />
          <pointLight position={[-4,-4,-4]} intensity={0.6} color="#7c6fff" />
          <Suspense fallback={null}>
            <Environment preset="city" />
            {nodes.map(n => (
              <SkillNode key={n.name} skill={n.name} position={n.pos} color={n.color}
                onClick={() => onSkillSelect?.(n.name)} />
            ))}
          </Suspense>
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.6}
            maxPolarAngle={Math.PI * 0.85} minPolarAngle={Math.PI * 0.15} />
        </Canvas>
      )}
    </div>
  );
}
