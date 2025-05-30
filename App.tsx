import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FractalType, type FractalParameters, type LightSettings, type Face } from './types';
// Vector3D is not directly used for THREE objects here, THREE.Vector3 is preferred.
import { DEFAULT_FRACTAL_PARAMS, DEFAULT_LIGHT_SETTINGS, AUTO_ROTATE_DELAY, AUTO_ROTATE_SPEED } from './constants';
import ControlsPanel from './components/ControlsPanel';
import Modal from './components/Modal';
import { IconOpenPanel, IconClosePanel, IconRotateOn, IconRotateOff } from './components/Icons';
import { generateSierpinskiTetrahedron, generateMengerSponge, generateSierpinskiOctahedron } from './utils/fractalGeneration';
import { exportToObjFile } from './utils/objExporter';
import { debounce } from './utils/helpers';

// Explicitly type THREE from window due to CDN loading; types.ts provides global THREE namespace
const THREE = window.THREE;
type ThreeVector3 = THREE.Vector3; // Alias for convenience if needed, or use THREE.Vector3 directly

const App: React.FC = () => {
  const [fractalParams, setFractalParams] = useState<FractalParameters>(DEFAULT_FRACTAL_PARAMS);
  const [lightSettings, setLightSettings] = useState<LightSettings>(DEFAULT_LIGHT_SETTINGS);
  
  const [isControlsPanelVisible, setIsControlsPanelVisible] = useState(true);
  const [isContinuousAutoRotateOn, setIsContinuousAutoRotateOn] = useState(false);
  const [isAutoRotatingByInactivity, setIsAutoRotatingByInactivity] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewDisabled, setIsPreviewDisabled] = useState<boolean>(false);

  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<THREE.OrbitControls | null>(null);
  const fractalMeshRef = useRef<THREE.Mesh | null>(null);
  
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemisphereLightRef = useRef<THREE.HemisphereLight | null>(null);

  const generatedVerticesRef = useRef<ThreeVector3[]>([]);
  const generatedFacesRef = useRef<Face[]>([]);

  const inactivityTimeoutIdRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);


  const showMessage = (message: string) => setModalMessage(message);

  // Debounced fractal generation (currently not directly used for triggering, see useEffect)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const regenerateFractalDebounced = useCallback(debounce(() => {
    setFractalParams(prev => ({...prev})); 
  }, 500), []);

  useEffect(() => {
    // This useEffect is mainly for observation or could be used for debounced regeneration if needed.
    // The primary generation is triggered by generateFractalLogic in its own useEffect.
  }, [fractalParams.type, fractalParams.level, fractalParams.size, fractalParams.color, regenerateFractalDebounced]);


  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0x111827);

    cameraRef.current = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    cameraRef.current.position.set(0, fractalParams.size * 0.8, fractalParams.size * 2.5);


    rendererRef.current = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: false });
    rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    ambientLightRef.current = new THREE.AmbientLight(0xffffff, lightSettings.ambientIntensity);
    sceneRef.current.add(ambientLightRef.current);

    directionalLightRef.current = new THREE.DirectionalLight(0xffffff, lightSettings.directionalIntensity);
    directionalLightRef.current.position.set(lightSettings.directionalPosition.x, lightSettings.directionalPosition.y, lightSettings.directionalPosition.z);
    directionalLightRef.current.castShadow = true;
    directionalLightRef.current.shadow.mapSize.width = 2048;
    directionalLightRef.current.shadow.mapSize.height = 2048;
    directionalLightRef.current.shadow.camera.near = 0.5;
    directionalLightRef.current.shadow.camera.far = Math.max(100, fractalParams.size * 10);
    directionalLightRef.current.shadow.camera.left = -fractalParams.size * 3;
    directionalLightRef.current.shadow.camera.right = fractalParams.size * 3;
    directionalLightRef.current.shadow.camera.top = fractalParams.size * 3;
    directionalLightRef.current.shadow.camera.bottom = -fractalParams.size * 3;
    sceneRef.current.add(directionalLightRef.current);

    fillLightRef.current = new THREE.DirectionalLight(0xffffff, lightSettings.fillIntensity);
    fillLightRef.current.position.set(-15, 10, -20); 
    sceneRef.current.add(fillLightRef.current);
    
    hemisphereLightRef.current = new THREE.HemisphereLight(0x606080, 0x404040, lightSettings.hemisphereIntensity);
    hemisphereLightRef.current.position.set(0, 20, 0);
    sceneRef.current.add(hemisphereLightRef.current);

    // Controls
    controlsRef.current = new THREE.OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.target.set(0,0,0);

    const handleInteractionStart = () => setIsUserInteracting(true);
    const handleInteractionEnd = () => setIsUserInteracting(false);
    controlsRef.current.addEventListener('start', handleInteractionStart);
    controlsRef.current.addEventListener('end', handleInteractionEnd);

    // Resize listener
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && container) {
        cameraRef.current.aspect = container.clientWidth / container.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    
    // Initial fractal generation call done via generateFractalLogic useEffect
    // No direct call here as generateFractalLogic's dependencies will trigger it.

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      if(controlsRef.current) controlsRef.current.update();

      if (fractalMeshRef.current && sceneRef.current?.getObjectByName("fractalMesh")) {
        const shouldRotate = isContinuousAutoRotateOn || (isAutoRotatingByInactivity && !isUserInteracting);
        if (shouldRotate) {
          fractalMeshRef.current.rotation.y += AUTO_ROTATE_SPEED;
          fractalMeshRef.current.rotation.x += AUTO_ROTATE_SPEED * 0.3;
        }
      }
      if(rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('start', handleInteractionStart);
        controlsRef.current.removeEventListener('end', handleInteractionEnd);
        controlsRef.current.dispose();
      }
      if(rendererRef.current) rendererRef.current.dispose();
      if(animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if(inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize once

  // Update lights
   useEffect(() => {
    if (ambientLightRef.current) ambientLightRef.current.intensity = lightSettings.ambientIntensity;
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = lightSettings.directionalIntensity;
      directionalLightRef.current.position.set(lightSettings.directionalPosition.x, lightSettings.directionalPosition.y, lightSettings.directionalPosition.z);
    }
    if (fillLightRef.current) fillLightRef.current.intensity = lightSettings.fillIntensity;
    if (hemisphereLightRef.current) hemisphereLightRef.current.intensity = lightSettings.hemisphereIntensity;
  }, [lightSettings]);


  // Fractal Generation Logic
  const generateFractalLogic = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 20)); // Allow UI to update for loading indicator


    if (fractalMeshRef.current && sceneRef.current) {
        sceneRef.current.remove(fractalMeshRef.current);
        fractalMeshRef.current.geometry.dispose();
        if (Array.isArray(fractalMeshRef.current.material)) {
            fractalMeshRef.current.material.forEach(m => m.dispose());
        } else {
            fractalMeshRef.current.material.dispose();
        }
        fractalMeshRef.current = null;
    }
    
    generatedVerticesRef.current = [];
    generatedFacesRef.current = [];

    try {
      let output;
      if (fractalParams.type === FractalType.SierpinskiTetrahedron) {
        output = generateSierpinskiTetrahedron(fractalParams.level, fractalParams.size);
      } else if (fractalParams.type === FractalType.MengerSponge) {
        output = generateMengerSponge(fractalParams.level, fractalParams.size);
      } else { 
        output = generateSierpinskiOctahedron(fractalParams.level, fractalParams.size);
      }

      generatedVerticesRef.current = output.exportVertices;
      generatedFacesRef.current = output.exportFaces;

      if (output.exportVertices.length === 0 && fractalParams.level > (fractalParams.type === FractalType.MengerSponge ? -1 : 0)) {
         showMessage("生成されたジオメトリがありません。レベルや設定を確認してください。");
      } else if (output.exportVertices.length > 0) {
        if (!isPreviewDisabled && sceneRef.current && cameraRef.current && controlsRef.current) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(output.bufferVertices, 3));
            geometry.setIndex(output.bufferIndices);
            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(fractalParams.color),
              metalness: 0.15,
              roughness: 0.8,
              flatShading: false, 
              side: (fractalParams.type === FractalType.MengerSponge || fractalParams.type === FractalType.SierpinskiOctahedron) ? THREE.DoubleSide : THREE.FrontSide,
            });
            
            fractalMeshRef.current = new THREE.Mesh(geometry, material);
            fractalMeshRef.current.name = "fractalMesh";
            fractalMeshRef.current.castShadow = true;
            fractalMeshRef.current.receiveShadow = true;
            sceneRef.current.add(fractalMeshRef.current);

            if (geometry.boundingSphere === null) { 
                geometry.computeBoundingSphere();
            }

            if (geometry.boundingSphere && cameraRef.current && controlsRef.current) { // Ensure camera and controls are defined
                const boundingSphere = geometry.boundingSphere;
                const objectSize = boundingSphere.radius;
                const fov = cameraRef.current.fov * (Math.PI / 180);
                const distance = Math.abs(objectSize / Math.sin(fov / 2)) * 1.2; 
                cameraRef.current.position.z = Math.max(distance, fractalParams.size * 1.5); 
                cameraRef.current.position.y = objectSize * 0.5; 
                cameraRef.current.lookAt(boundingSphere.center);
                controlsRef.current.target.copy(boundingSphere.center);
                controlsRef.current.update(); 
            }
        } else if (isPreviewDisabled) {
            // Removed showMessage call for "計算完了。プレビューは無効です。OBJエクスポートが可能です。"
        }
      }


    } catch (error: any) {
      console.error("Fractal generation error:", error);
      showMessage(`エラー: ${error.message || '不明な生成エラー'}`);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fractalParams.type, fractalParams.level, fractalParams.size, fractalParams.color, isPreviewDisabled]); 

  // Trigger fractal generation when relevant params change
  useEffect(() => {
    generateFractalLogic();
  }, [generateFractalLogic]);


  // Inactivity timer logic
  useEffect(() => {
    if (isUserInteracting) {
      setIsAutoRotatingByInactivity(false);
      if (inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
    } else if (!isContinuousAutoRotateOn) {
      if (inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
      inactivityTimeoutIdRef.current = window.setTimeout(() => {
        setIsAutoRotatingByInactivity(true);
      }, AUTO_ROTATE_DELAY);
    } else { 
        setIsAutoRotatingByInactivity(false);
        if (inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
    }
    return () => {
      if (inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
    };
  }, [isUserInteracting, isContinuousAutoRotateOn]);

  const handleExportObj = () => {
    if (generatedVerticesRef.current.length > 0 && generatedFacesRef.current.length > 0) {
      exportToObjFile(fractalParams.type, fractalParams.level, fractalParams.size, generatedVerticesRef.current, generatedFacesRef.current);
      showMessage("OBJファイルがエクスポートされました。");
    } else {
      showMessage("エクスポートするデータがありません。まずフラクタルを生成してください。");
    }
  };
  
  const handleToggleControlsPanel = () => {
    setIsControlsPanelVisible(prev => !prev);
    // Ensure canvas resizes after panel animation (if any) or visibility change
    setTimeout(() => {
        if (canvasContainerRef.current && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = canvasContainerRef.current.clientWidth / canvasContainerRef.current.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight);
        }
    }, 50); // Adjust timeout if needed
  };

  const handleToggleAutoRotate = () => {
    setIsContinuousAutoRotateOn(prev => !prev);
    if (!isContinuousAutoRotateOn) { // This means it's about to be turned ON
        setIsAutoRotatingByInactivity(false); // Stop inactivity rotation if continuous is ON
        if (inactivityTimeoutIdRef.current) clearTimeout(inactivityTimeoutIdRef.current);
    }
    // If it's turned OFF, the inactivity timer logic in useEffect will handle restarting it.
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <button
          title="コントロールパネル表示切替"
          onClick={handleToggleControlsPanel}
          aria-label={isControlsPanelVisible ? "コントロールパネルを隠す" : "コントロールパネルを表示"}
          aria-expanded={isControlsPanelVisible}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isControlsPanelVisible ? <IconClosePanel /> : <IconOpenPanel />}
        </button>
        <button
          title="自動回転切替"
          onClick={handleToggleAutoRotate}
          aria-label={isContinuousAutoRotateOn ? "自動回転をオフ" : "自動回転をオン"}
          aria-pressed={isContinuousAutoRotateOn}
          className="bg-teal-500 hover:bg-teal-600 text-white font-bold p-2 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-50"
        >
          {isContinuousAutoRotateOn ? <IconRotateOff /> : <IconRotateOn />}
        </button>
      </div>

      {isControlsPanelVisible && (
        <ControlsPanel
          fractalParams={fractalParams}
          setFractalParams={setFractalParams}
          lightSettings={lightSettings}
          setLightSettings={setLightSettings}
          onGenerate={generateFractalLogic}
          onExportObj={handleExportObj}
          isGenerating={isLoading}
          canExport={generatedVerticesRef.current.length > 0 && generatedFacesRef.current.length > 0}
          isPreviewDisabled={isPreviewDisabled}
          setIsPreviewDisabled={setIsPreviewDisabled}
        />
      )}

      <div ref={canvasContainerRef} className="flex-grow relative rounded-lg overflow-hidden m-0 md:m-2 md:ml-0 h-full">
        <canvas ref={canvasRef} id="fractalCanvas" className="w-full h-full block" aria-label="3D Fractal Visualization"/>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center text-white text-xl z-20" role="status" aria-live="polite">
            <div className="animate-pulse">生成中...</div>
          </div>
        )}
        {isPreviewDisabled && !isLoading && !fractalMeshRef.current && (
             <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center text-white text-lg z-10 p-4 text-center" role="status">
                プレビュー無効モード。設定を変更して「生成」を押すと計算のみ行います。
            </div>
        )}
      </div>

      <Modal isOpen={!!modalMessage} message={modalMessage || ''} onClose={() => setModalMessage(null)} />
    </div>
  );
};

export default App;
