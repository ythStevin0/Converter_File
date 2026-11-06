import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeOrbitBackgroundProps {
  className?: string;
  particleCount?: number;
}

export const ThreeOrbitBackground: React.FC<ThreeOrbitBackgroundProps> = ({
  className = '',
  particleCount = 220,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 35;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 1. Orbital Ring Particle System (Scaled to fit tightly behind radial hub)
    const ringRadius1 = 5.5;
    const ringRadius2 = 8.5;
    const ringRadius3 = 11.5;

    const positions: number[] = [];
    const colors: number[] = [];

    const emeraldColor = new THREE.Color(0x22c55e);
    const cyanColor = new THREE.Color(0x10b981);
    const slateColor = new THREE.Color(0x334155);

    for (let i = 0; i < particleCount; i++) {
      let r = ringRadius1;
      let clr = emeraldColor;
      if (i % 3 === 1) {
        r = ringRadius2;
        clr = cyanColor;
      } else if (i % 3 === 2) {
        r = ringRadius3;
        clr = slateColor;
      }

      // Add angular jitter and slight spherical thickness
      const angle = (i / (particleCount / 3)) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.8;
      const y = Math.sin(angle) * r + (Math.random() - 0.5) * 0.8;
      const z = (Math.random() - 0.5) * 3;

      positions.push(x, y, z);
      colors.push(clr.r, clr.g, clr.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 2. Center Wireframe Torus (Subtle and compact)
    const torusGeometry = new THREE.TorusGeometry(6, 0.025, 6, 60);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // Outer faint ring
    const outerTorusGeom = new THREE.TorusGeometry(9.2, 0.02, 6, 70);
    const outerTorusMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const outerTorus = new THREE.Mesh(outerTorusGeom, outerTorusMat);
    scene.add(outerTorus);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 2;
      targetY = -(y / rect.height) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 4;
      camera.position.y = mouseY * 4;
      camera.lookAt(scene.position);

      // Orbital rotation
      particles.rotation.z = elapsedTime * 0.04;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.2;
      torus.rotation.z = -elapsedTime * 0.03;
      outerTorus.rotation.z = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      material.dispose();
      torusGeometry.dispose();
      torusMaterial.dispose();
      outerTorusGeom.dispose();
      outerTorusMat.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [particleCount]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};

