
import React from 'react';
import { FractalType, type FractalParameters, type LightSettings } from '../types';
import { MAX_LEVELS } from '../constants';
import SliderInput from './SliderInput';

interface ControlsPanelProps {
  fractalParams: FractalParameters;
  setFractalParams: React.Dispatch<React.SetStateAction<FractalParameters>>;
  lightSettings: LightSettings;
  setLightSettings: React.Dispatch<React.SetStateAction<LightSettings>>;
  onGenerate: () => void;
  onExportObj: () => void;
  isGenerating: boolean;
  canExport: boolean;
  isPreviewDisabled: boolean;
  setIsPreviewDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  fractalParams,
  setFractalParams,
  lightSettings,
  setLightSettings,
  onGenerate,
  onExportObj,
  isGenerating,
  canExport,
  isPreviewDisabled,
  setIsPreviewDisabled,
}) => {
  const handleFractalTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FractalType;
    let newLevel = fractalParams.level;
    // Adjust level if current level is out of bounds for the new type
    if (newLevel > MAX_LEVELS[newType]) {
      // Reset to a sensible default like 2, or the max if it's lower
      newLevel = Math.min(2, MAX_LEVELS[newType]); 
    }
    if (newType === FractalType.MengerSponge && newLevel < 0) {
      newLevel = 0; // Menger Sponge min level is 0
    }


    setFractalParams(prev => ({ ...prev, type: newType, level: newLevel }));
  };

  const handleParamChange = <K extends keyof FractalParameters,>(param: K, value: FractalParameters[K]) => {
    setFractalParams(prev => ({ ...prev, [param]: value }));
  };
  
  const handleLightChange = <K extends keyof LightSettings,>(param: K, value: LightSettings[K]) => {
    setLightSettings(prev => ({ ...prev, [param]: value }));
  };

  const handleDirectionalLightPosChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setLightSettings(prev => ({
      ...prev,
      directionalPosition: {
        ...prev.directionalPosition,
        [axis]: value,
      }
    }));
  };
  
  const currentMaxLevel = MAX_LEVELS[fractalParams.type];
  const currentMinLevel = fractalParams.type === FractalType.MengerSponge ? 0 : 0;


  return (
    <div className="w-full md:w-96 bg-gray-800 p-4 md:p-6 space-y-4 overflow-y-auto shadow-lg md:rounded-r-lg h-full flex flex-col">
      <h1 className="text-2xl font-bold text-center text-blue-400 mb-4">3D フラクタル設定</h1>

      {/* Fractal Settings */}
      <div className="space-y-3 p-3 bg-gray-700 rounded-md">
        <h2 className="text-lg font-semibold text-center text-blue-300 mb-2">基本設定</h2>
        <div>
          <label htmlFor="fractalTypeSelector" className="block text-sm font-medium text-gray-300">フラクタルタイプ:</label>
          <select
            id="fractalTypeSelector"
            value={fractalParams.type}
            onChange={handleFractalTypeChange}
            className="w-full mt-1 block py-2 px-3 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value={FractalType.SierpinskiTetrahedron}>シェルピンスキー四面体</option>
            <option value={FractalType.MengerSponge}>メンガースポンジ (立方体)</option>
            <option value={FractalType.SierpinskiOctahedron}>シェルピンスキー八面体</option>
          </select>
        </div>

        <SliderInput
          id="levelSlider"
          label="再帰レベル"
          value={fractalParams.level}
          min={currentMinLevel}
          max={currentMaxLevel}
          step={1}
          onChange={(val) => handleParamChange('level', val)}
        />
        <SliderInput
          id="sizeSlider"
          label="基本サイズ"
          value={fractalParams.size}
          min={1}
          max={10}
          step={0.1}
          onChange={(val) => handleParamChange('size', val)}
        />
        <div>
          <label htmlFor="colorPicker" className="block text-sm font-medium text-gray-300">フラクタル色:</label>
          <input
            type="color"
            id="colorPicker"
            value={fractalParams.color}
            onChange={(e) => handleParamChange('color', e.target.value)}
            className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer mt-1"
            aria-label="フラクタル色選択"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between bg-gray-700 p-3 rounded-md my-3">
        <label htmlFor="previewToggle" className="text-sm font-medium text-gray-300">プレビュー表示:</label>
        <button
          id="previewToggle"
          onClick={() => setIsPreviewDisabled(prev => !prev)}
          aria-pressed={isPreviewDisabled}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
            isPreviewDisabled 
            ? 'bg-yellow-500 hover:bg-yellow-600 text-black focus:ring-yellow-400' 
            : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'
          }`}
        >
          {isPreviewDisabled ? 'オフ (計算のみ)' : 'オン'}
        </button>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        aria-live="polite"
      >
        {isGenerating ? '生成中...' : (isPreviewDisabled ? '計算実行' : '生成')}
      </button>
      <button
        onClick={onExportObj}
        disabled={!canExport || isGenerating}
        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
      >
        OBJエクスポート
      </button>

      {/* Lighting Settings */}
      {!isPreviewDisabled && (
        <div className="mt-6 pt-4 border-t border-gray-600 space-y-3 p-3 bg-gray-700 rounded-md">
          <h2 className="text-xl font-semibold text-center text-teal-400 mb-3">光源設定</h2>
          <SliderInput id="ambientIntensitySlider" label="環境光 強度" value={lightSettings.ambientIntensity} min={0} max={3} step={0.1} onChange={(v) => handleLightChange('ambientIntensity',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="directionalIntensitySlider" label="指向性光 強度" value={lightSettings.directionalIntensity} min={0} max={5} step={0.1} onChange={(v) => handleLightChange('directionalIntensity',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="directionalLightXSlider" label="指向性光 X位置" value={lightSettings.directionalPosition.x} min={-50} max={50} step={1} onChange={(v) => handleDirectionalLightPosChange('x',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="directionalLightYSlider" label="指向性光 Y位置" value={lightSettings.directionalPosition.y} min={-50} max={50} step={1} onChange={(v) => handleDirectionalLightPosChange('y',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="directionalLightZSlider" label="指向性光 Z位置" value={lightSettings.directionalPosition.z} min={-50} max={50} step={1} onChange={(v) => handleDirectionalLightPosChange('z',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="fillIntensitySlider" label="フィルライト 強度" value={lightSettings.fillIntensity} min={0} max={3} step={0.1} onChange={(v) => handleLightChange('fillIntensity',v)} accentColorClass="accent-teal-500" />
          <SliderInput id="hemisphereIntensitySlider" label="半球光 強度" value={lightSettings.hemisphereIntensity} min={0} max={3} step={0.1} onChange={(v) => handleLightChange('hemisphereIntensity',v)} accentColorClass="accent-teal-500" />
        </div>
      )}
      <div className="mt-auto pt-4">
        <p className="text-xs text-gray-400 text-center">マウスで視点操作: 左ドラッグで回転、右ドラッグで平行移動、ホイールでズーム。自動回転ボタンがオフの場合、3秒間操作がないと自動回転します。</p>
        <p className="text-xs text-gray-500 text-center mt-2">注意: 高い再帰レベル (特にメンガースポンジや八面体) は、ブラウザおちるかも</p>
      </div>
    </div>
  );
};

export default ControlsPanel;
