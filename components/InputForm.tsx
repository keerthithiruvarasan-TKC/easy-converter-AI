import React, { useState, useRef, useEffect } from 'react';
import { TargetBrand, BRAND_SPECIALTIES, ApplicationContext, OperationType, SubOperationType, IsoMaterial, SearchRequest, OperationParams } from '../types';

interface InputFormProps {
  onSubmit: (content: string, type: 'text' | 'image' | 'pdf', targetBrand: TargetBrand, context: ApplicationContext, mimeType?: string) => void;
  isLoading: boolean;
  initialValues?: SearchRequest | null;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialValues }) => {
  const [step, setStep] = useState<number>(1);
  
  // Step 1: Brand
  const [targetBrand, setTargetBrand] = useState<TargetBrand>('Tungaloy');

  // Step 2: Material
  const [material, setMaterial] = useState<IsoMaterial | null>(null);

  // Step 3: Operation & Detailed Params
  const [operation, setOperation] = useState<OperationType | null>(null);
  const [subOperation, setSubOperation] = useState<SubOperationType | null>(null);
  
  const [params, setParams] = useState<OperationParams>({});
  
  // Step 4: Input
  const [activeTab, setActiveTab] = useState<'text' | 'upload'>('upload');
  const [textInput, setTextInput] = useState('');
  const [existingFileContent, setExistingFileContent] = useState<string | null>(null);
  const [existingMimeType, setExistingMimeType] = useState<string | undefined>(undefined);
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from props if editing
  useEffect(() => {
    if (initialValues) {
        setTargetBrand(initialValues.targetBrand);
        setOperation(initialValues.context.operationType);
        setSubOperation(initialValues.context.subOperationType);
        setMaterial(initialValues.context.material);
        setParams(initialValues.context.params || {});
        
        if (initialValues.type === 'text') {
            setActiveTab('text');
            setTextInput(initialValues.content);
        } else {
            setActiveTab('upload');
            setExistingFileContent(initialValues.content);
            setExistingMimeType(initialValues.mimeType);
        }
    }
  }, [initialValues]);

  // --- Configuration & Assets ---

  // Custom Technical Line Drawings (Grind Icon Style)
  const OPERATION_SVGS: Record<OperationType, React.ReactNode> = {
    'Turning': (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         {/* Holder Shank */}
         <path d="M25 90 L25 40 L65 40 L65 90" className="text-gray-400" />
         {/* Insert Clamp */}
         <path d="M65 40 L75 30 L55 30 L45 40" className="text-gray-500" />
         {/* Diamond Insert */}
         <path d="M75 30 L90 15 L65 15 L50 30 Z" className="text-gray-700" fill="currentColor" fillOpacity="0.1" />
         {/* Screw */}
         <circle cx="70" cy="22" r="3" className="text-gray-600" />
      </svg>
    ),
    'Milling': (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Shank */}
          <path d="M35 10 L65 10 L65 35 L35 35 Z" className="text-gray-400" />
          {/* Cutter Body */}
          <path d="M35 35 L65 35 L65 90 L35 90 Z" className="text-gray-500" />
          {/* Helical Flutes */}
          <path d="M35 35 Q50 50 35 65" className="text-gray-600" />
          <path d="M65 35 Q50 50 65 65" className="text-gray-600" />
          <path d="M35 60 Q50 75 35 90" className="text-gray-600" />
          <path d="M65 60 Q50 75 65 90" className="text-gray-600" />
      </svg>
    ),
    'Holemaking': (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Drill Body */}
          <path d="M40 10 L60 10 L60 70 L50 90 L40 70 Z" className="text-gray-400" />
          {/* Flutes */}
          <path d="M40 20 L60 30" className="text-gray-600" />
          <path d="M40 40 L60 50" className="text-gray-600" />
          <path d="M40 60 L60 70" className="text-gray-600" />
          {/* Tip */}
          <path d="M40 70 L50 90 L60 70" className="text-gray-800" fill="currentColor" fillOpacity="0.1"/>
      </svg>
    ),
    'Threading': (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Holder */}
          <path d="M15 90 L15 40 L55 40 L55 90 Z" className="text-gray-400" />
          {/* Neck */}
          <path d="M55 40 L65 45 L55 50" className="text-gray-500" />
          {/* Thread Insert */}
          <path d="M65 45 L85 45 L75 60 Z" className="text-gray-800" fill="currentColor" fillOpacity="0.1" />
          {/* Thread Profile Teeth */}
          <path d="M85 45 L88 42 M85 45 L88 48" className="text-gray-600" />
      </svg>
    ),
    'Grooving': (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
           {/* Block Holder */}
           <path d="M15 90 L15 30 L50 30 L50 90" className="text-gray-400" />
           {/* Blade */}
           <path d="M50 35 L80 35 L80 50 L50 50" className="text-gray-500" fill="currentColor" fillOpacity="0.05" />
           {/* Insert Tip */}
           <rect x="80" y="35" width="8" height="15" className="text-gray-800" fill="currentColor" fillOpacity="0.2" />
      </svg>
    )
  };

  const SUB_OP_ICONS: Record<string, string> = {
    'External Turning': 'fa-arrow-right-from-bracket',
    'Internal Turning': 'fa-arrow-right-to-bracket',
    'SC Milling': 'fa-shapes',
    'SC Ball Nose': 'fa-circle',
    'SC Bull Nose': 'fa-vector-square',
    'Hi-Feed (Insert)': 'fa-forward',
    'Shoulder (Insert)': 'fa-l',
    'Face (Insert)': 'fa-layer-group',
    'SC Drill': 'fa-pencil',
    'U-Drill': 'fa-eraser',
    'Modular Drill': 'fa-puzzle-piece',
    'BTA Drill': 'fa-gun',
    'Gun Drill': 'fa-crosshairs',
    'External Grooving': 'fa-grip-lines',
    'Internal Grooving': 'fa-grip-lines-vertical',
    'Parting': 'fa-scissors',
    'Thread Turning (Ext)': 'fa-bolt',
    'Thread Turning (Int)': 'fa-nut',
    'Thread Mill (Ext - SC)': 'fa-tornado',
    'Thread Mill (Int - SC)': 'fa-hurricane',
    // Fallbacks
    'default': 'fa-check'
  };

  const OPERATION_MAP: Record<OperationType, SubOperationType[]> = {
    'Turning': ['External Turning', 'Internal Turning'],
    'Milling': ['SC Milling', 'SC Ball Nose', 'SC Bull Nose', 'Hi-Feed (Insert)', 'Shoulder (Insert)', 'Face (Insert)'],
    'Holemaking': ['SC Drill', 'U-Drill', 'Modular Drill', 'BTA Drill', 'Gun Drill'],
    'Threading': ['Thread Turning (Ext)', 'Thread Turning (Int)', 'Thread Mill (Ext - SC)', 'Thread Mill (Int - SC)', 'Thread Mill (Ext - Insert)', 'Thread Mill (Int - Insert)'],
    'Grooving': ['External Grooving', 'Internal Grooving', 'Parting']
  };

  const CONDITIONS_MAP: Record<OperationType, string[]> = {
    'Turning': ['Continuous / Smooth', 'Light Interruption', 'Heavy Interruption (Scale)', 'Hardened Skin / Case', 'Thin Wall / Unstable'],
    'Milling': ['Solid Block', 'Casting / Forging Skin', 'Weldment', 'Long Overhang', 'Unstable Fixturing'],
    'Holemaking': ['Solid Material', 'Stacked Plates', 'Cross Holes / Interrupted', 'Angled Entry / Exit', 'Pre-cast Hole'],
    'Threading': ['Uniform Stock', 'Hardened Surface', 'Interrupted Thread', 'Thin Walled Pipe'],
    'Grooving': ['Solid Bar', 'Tube / Pipe', 'Interrupted Cut', 'Deep Groove']
  };

  const FAILURES_MAP: Record<OperationType, string[]> = {
    'Turning': ['Flank Wear (Normal)', 'Crater Wear', 'Notch Wear (Depth of Cut)', 'Plastic Deformation', 'Chip Control / Bird Nesting', 'Vibration / Chatter', 'Catastrophic Breakage'],
    'Milling': ['Flank Wear', 'Thermal Cracking', 'Chipping (Cutting Edge)', 'Built-up Edge (Sticky)', 'Vibration / Chatter', 'Insert Breakage'],
    'Holemaking': ['Chipping at Center', 'Outer Corner Wear', 'Margin Wear', 'Chip Packing', 'Drill Breakage', 'Oversized Hole'],
    'Threading': ['Burrs', 'Torn Thread Surface', 'Chipping on Trailing Edge', 'Incorrect Pitch / Profile', 'Vibration'],
    'Grooving': ['Chip Jamming', 'Insert Pull-out', 'Concave / Convex Wall', 'Pip at Center (Parting)', 'Blade Breakage']
  };

  const MACHINE_CONFIG: Record<OperationType, { label: string; placeholder: string }> = {
    'Turning': { label: 'Machine Interface / Shank', placeholder: 'e.g. 25mm Sq Shank, VDI 40, BMT 55, Swiss' },
    'Milling': { label: 'Spindle Taper / Power', placeholder: 'e.g. BT40 15kW, CAT50 High Torque, HSK-A63' },
    'Holemaking': { label: 'Tool Holding Method', placeholder: 'e.g. ER32, Hydraulic Chuck, Side Lock, Lathe Turret' },
    'Threading': { label: 'Holder Size / Type', placeholder: 'e.g. 16x16 Shank, 20mm Boring Bar, Capto C4' },
    'Grooving': { label: 'Machine Interface', placeholder: 'e.g. 20x20 Shank, 32mm Block, Swiss' }
  };

  const MATERIALS: { id: IsoMaterial, color: string, name: string }[] = [
    { id: 'P (Steel)', color: 'bg-blue-600', name: 'Steel' },
    { id: 'M (Stainless)', color: 'bg-yellow-500', name: 'Stainless' },
    { id: 'K (Cast Iron)', color: 'bg-red-600', name: 'Cast Iron' },
    { id: 'N (Non-Ferrous)', color: 'bg-gray-400', name: 'Aluminum/Non-Ferrous' },
    { id: 'S (Superalloys)', color: 'bg-orange-500', name: 'Heat Resistant Alloys' },
    { id: 'H (Hardened)', color: 'bg-green-600', name: 'Hardened Materials' },
  ];

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      const type = file.type.includes('pdf') ? 'pdf' : 'image';
      onSubmit(base64String, type, targetBrand, {
          operationType: operation,
          subOperationType: subOperation,
          material: material,
          params: params
      }, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
        onSubmit(textInput, 'text', targetBrand, {
          operationType: operation,
          subOperationType: subOperation,
          material: material,
          params: params
      });
    }
  };

  const handleExistingFileSubmit = () => {
      if (existingFileContent) {
          const type = existingMimeType?.includes('pdf') ? 'pdf' : 'image';
          onSubmit(existingFileContent, type, targetBrand, {
            operationType: operation,
            subOperationType: subOperation,
            material: material,
            params: params
        }, existingMimeType);
      }
  };

  const updateParam = (key: keyof OperationParams, value: string) => {
      setParams(prev => ({ ...prev, [key]: value }));
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // --- Styles ---
  const labelStyle = "text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1";
  const inputStyle = "w-full bg-white border border-gray-300 rounded-md p-2 text-gray-900 text-sm font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder-gray-400 transition-all";
  const selectStyle = "w-full bg-white border border-gray-300 rounded-md p-2 text-gray-900 text-sm font-medium outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all";

  // --- Sub-Component: History Ribbon ---
  const HistoryRibbon = () => (
    <div className="flex items-center space-x-2 text-xs mb-6 bg-gray-50 p-2 rounded-lg border border-gray-200 overflow-x-auto whitespace-nowrap">
        <span className="font-bold text-red-600 flex items-center">
            <i className="fa-solid fa-building mr-1"></i> {targetBrand}
        </span>
        {step > 1 && material && (
            <>
                <i className="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                <span className="font-bold text-gray-700 flex items-center">
                    <i className="fa-solid fa-layer-group mr-1"></i> {material}
                </span>
            </>
        )}
        {step > 2 && operation && (
            <>
                <i className="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                <span className="font-bold text-gray-700 flex items-center">
                    <i className="fa-solid fa-gears mr-1"></i> {operation}
                </span>
            </>
        )}
        {step > 2 && subOperation && (
            <>
                <i className="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                <span className="font-bold text-gray-700 flex items-center">
                     {subOperation}
                </span>
            </>
        )}
    </div>
  );

  // --- Render Steps ---

  const renderStep1_Brand = () => (
    <div className="space-y-6 animate-fade-in">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Select Target Manufacturer</h2>
        <div className="grid grid-cols-2 gap-4">
            {(Object.keys(BRAND_SPECIALTIES) as TargetBrand[]).map((brand) => (
                <button
                    key={brand}
                    onClick={() => { setTargetBrand(brand); setStep(2); }}
                    className={`p-5 rounded-xl border text-left transition-all hover:shadow-lg ${
                        targetBrand === brand 
                        ? 'bg-red-600 border-red-600 text-white shadow-red-200' 
                        : 'bg-white border-gray-200 hover:border-red-300 text-gray-800'
                    }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{brand}</span>
                        <i className={`fa-solid fa-chevron-right ${targetBrand === brand ? 'text-white' : 'text-gray-300'}`}></i>
                    </div>
                    <p className={`text-xs font-medium ${targetBrand === brand ? 'text-white/80' : 'text-gray-400'}`}>{BRAND_SPECIALTIES[brand]}</p>
                </button>
            ))}
        </div>
    </div>
  );

  const renderStep2_Material = () => (
    <div className="space-y-6 animate-fade-in">
        <HistoryRibbon />
        <h2 className="text-xl font-bold text-gray-800 text-center mb-6">Select Workpiece Material</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MATERIALS.map((mat) => (
                <button
                    key={mat.id}
                    onClick={() => { setMaterial(mat.id); setStep(3); }}
                    className={`relative p-4 h-32 rounded-xl border transition-all overflow-hidden group hover:shadow-lg hover:-translate-y-1 ${
                        material === mat.id 
                        ? 'border-gray-300 ring-2 ring-red-500 bg-white shadow-xl' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className={`absolute top-0 left-0 w-full h-3 ${mat.color}`}></div>
                    <div className="flex flex-col h-full justify-center items-center text-center mt-2">
                        <span className={`text-3xl font-black mb-1 opacity-90 ${mat.color.replace('bg-', 'text-')}`}>
                            {mat.id.split(' ')[0]}
                        </span>
                        <span className="text-sm font-bold text-gray-800">{mat.name}</span>
                        <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{mat.id.split(' ')[1].replace(/[()]/g, '')}</span>
                    </div>
                </button>
            ))}
        </div>
        <div className="flex justify-start">
             <button onClick={() => setStep(1)} className="text-gray-500 hover:text-red-600 font-medium px-4 py-2 transition-colors">
                <i className="fa-solid fa-arrow-left mr-2"></i> Back
             </button>
        </div>
    </div>
  );

  const renderStep3_DetailedData = () => (
    <div className="space-y-6 animate-fade-in">
        <HistoryRibbon />
        <h2 className="text-xl font-bold text-gray-800 mb-4">Application Data Sheet</h2>

        {/* 1. Operation Type (VISUAL LINE DRAWINGS - GRID LAYOUT) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pb-2">
            {(Object.keys(OPERATION_MAP) as OperationType[]).map((op) => (
                <button
                    key={op}
                    onClick={() => { setOperation(op); setSubOperation(null); setParams({}); }}
                    className={`relative w-full h-32 md:h-40 rounded-xl overflow-hidden transition-all duration-300 group border-2 flex flex-col items-center justify-between p-2 ${
                        operation === op 
                        ? 'border-red-600 bg-red-50 scale-105 z-10 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                    }`}
                >
                    {/* SVG Graphic */}
                    <div className={`w-full h-20 ${operation === op ? 'text-red-700' : 'text-gray-600 group-hover:text-red-500'}`}>
                        {OPERATION_SVGS[op]}
                    </div>
                    
                    {/* Label */}
                    <div className="w-full text-center">
                        <span className={`block text-xs font-bold uppercase tracking-wider ${operation === op ? 'text-red-700' : 'text-gray-600'}`}>
                            {op}
                        </span>
                    </div>
                    {/* Indicator */}
                    {operation === op && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600"></div>}
                </button>
            ))}
        </div>

        {/* 2. Sub-Operation Selection (GRID WITH ICONS) */}
        {operation && (
             <div className="bg-white rounded-xl p-4 border border-gray-200 animate-fade-in shadow-sm">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                    <i className="fa-solid fa-filter mr-2"></i> Select {operation} Type:
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {OPERATION_MAP[operation].map((subOp) => (
                         <button
                            key={subOp}
                            onClick={() => setSubOperation(subOp)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-center h-24 ${
                                subOperation === subOp
                                ? 'bg-red-50 border-red-500 text-red-700 shadow-md transform scale-105'
                                : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-red-200 hover:bg-white hover:shadow-sm'
                            }`}
                         >
                            <i className={`fa-solid ${SUB_OP_ICONS[subOp] || SUB_OP_ICONS['default']} text-2xl mb-2 ${subOperation === subOp ? 'text-red-600' : 'text-gray-400'}`}></i>
                            <span className="text-[10px] font-bold leading-tight uppercase">{subOp.replace(/\(.*\)/, '')}</span>
                            {subOp.includes('(') && <span className="text-[8px] text-gray-400 mt-0.5">{subOp.match(/\((.*)\)/)?.[1]}</span>}
                         </button>
                    ))}
                 </div>
             </div>
        )}

        {/* 3. Comprehensive Data Collection */}
        {subOperation && operation && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-fade-in mt-4">
                <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center text-white">
                     <h3 className="text-sm font-bold uppercase tracking-widest flex items-center">
                        <i className="fa-solid fa-sliders mr-2"></i> Parameters
                     </h3>
                     <span className="text-xs bg-gray-700 px-2 py-1 rounded border border-gray-600">{subOperation}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    
                    {/* Pillar 1: Cutting Params */}
                    <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        <label className="text-xs font-extrabold text-gray-800 uppercase border-b border-gray-200 pb-1 block mb-2">1. Cutting Parameters</label>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <span className={labelStyle}>Vc (m/min)</span>
                                <input type="text" className={inputStyle}
                                    value={params.vc || ''} onChange={(e) => updateParam('vc', e.target.value)} placeholder="120"/>
                             </div>
                             <div>
                                <span className={labelStyle}>Feed (mm/rev)</span>
                                <input type="text" className={inputStyle}
                                    value={params.fn || ''} onChange={(e) => updateParam('fn', e.target.value)} placeholder="0.15"/>
                             </div>
                             <div>
                                <span className={labelStyle}>Ap (Depth)</span>
                                <input type="text" className={inputStyle}
                                    value={params.ap || ''} onChange={(e) => updateParam('ap', e.target.value)} placeholder="2.0"/>
                             </div>
                             {(operation === 'Milling' || operation === 'Threading') && (
                                 <div>
                                    <span className={labelStyle}>{operation === 'Threading' ? 'Pitch' : 'Ae (Width)'}</span>
                                    <input type="text" className={inputStyle}
                                        value={params.ae || params.pitch || ''} onChange={(e) => updateParam(operation === 'Threading' ? 'pitch' : 'ae', e.target.value)} placeholder="0.5" />
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Pillar 1.5: Dimensional Data (Conditional) */}
                    {(operation === 'Turning' || operation === 'Grooving') && (
                        <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                            <label className="text-xs font-extrabold text-gray-800 uppercase border-b border-gray-200 pb-1 block mb-2">
                                Job Dimensions
                            </label>
                            
                            {/* Parting Specific */}
                            {subOperation === 'Parting' ? (
                                <div>
                                    <span className={labelStyle}>Bar Diameter (Ø)</span>
                                    <input type="text" className={inputStyle}
                                        value={params.partingDiameter || ''} onChange={(e) => updateParam('partingDiameter', e.target.value)} placeholder="50.0" />
                                </div>
                            ) : (
                                <div>
                                    <span className={labelStyle}>Workpiece Dia (Ø)</span>
                                    <input type="text" className={inputStyle}
                                        value={params.workpieceDiameter || ''} onChange={(e) => updateParam('workpieceDiameter', e.target.value)} placeholder="OD or ID" />
                                </div>
                            )}

                            {/* Grooving Specific */}
                            {operation === 'Grooving' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className={labelStyle}>Groove Width (W)</span>
                                        <input type="text" className={inputStyle}
                                            value={params.grooveWidth || ''} onChange={(e) => updateParam('grooveWidth', e.target.value)} placeholder="3.0" />
                                    </div>
                                    {subOperation !== 'Parting' && (
                                        <div>
                                            <span className={labelStyle}>Groove Depth (Ar)</span>
                                            <input type="text" className={inputStyle}
                                                value={params.grooveDepth || ''} onChange={(e) => updateParam('grooveDepth', e.target.value)} placeholder="5.0" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pillar 2: App Params */}
                    <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        <label className="text-xs font-extrabold text-gray-800 uppercase border-b border-gray-200 pb-1 block mb-2">2. Application Params</label>
                        <div>
                            <span className={labelStyle}>Hardness (HB/HRC)</span>
                            <input type="text" className={inputStyle}
                                value={params.materialHardness || ''} onChange={(e) => updateParam('materialHardness', e.target.value)} placeholder="e.g. 45 HRC" />
                        </div>
                        <div>
                            <span className={labelStyle}>Workpiece Condition</span>
                            <select className={selectStyle}
                                value={params.workpieceStability || ''} onChange={(e) => updateParam('workpieceStability', e.target.value)}>
                                <option value="">Select Condition...</option>
                                {CONDITIONS_MAP[operation]?.map((cond) => (
                                    <option key={cond} value={cond}>{cond}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                        </div>
                         <div>
                            <span className={labelStyle}>Overhang (L/D)</span>
                            <input type="text" placeholder="e.g. 3xD" className={inputStyle}
                                value={params.overhang || ''} onChange={(e) => updateParam('overhang', e.target.value)} />
                        </div>
                    </div>

                    {/* Pillar 3: Machine Details */}
                    <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        <label className="text-xs font-extrabold text-gray-800 uppercase border-b border-gray-200 pb-1 block mb-2">3. Machine Environment</label>
                        <div>
                            <span className={labelStyle}>{MACHINE_CONFIG[operation]?.label || 'Machine / Taper'}</span>
                            <input type="text" 
                                placeholder={MACHINE_CONFIG[operation]?.placeholder || 'e.g. BT40, Swiss'} 
                                className={inputStyle}
                                value={params.machinePower || ''} onChange={(e) => updateParam('machinePower', e.target.value)} />
                        </div>
                         <div>
                            <span className={labelStyle}>Coolant</span>
                            <select className={selectStyle}
                                value={params.coolant || ''} onChange={(e) => updateParam('coolant', e.target.value as any)}>
                                <option value="Wet">Wet (Flood)</option>
                                <option value="Dry">Dry</option>
                                <option value="MQL">MQL</option>
                                <option value="High Pressure">High Pressure</option>
                            </select>
                        </div>
                    </div>

                     {/* Pillar 4: Failure Mode */}
                     <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        <label className="text-xs font-extrabold text-red-600 uppercase border-b border-gray-200 pb-1 block mb-2">4. Current Failure Mode</label>
                        <select className={`${selectStyle} border-red-200 focus:border-red-500 bg-red-50/30 text-gray-900`}
                            value={params.failureMode || ''} onChange={(e) => updateParam('failureMode', e.target.value)}>
                            <option value="">Select Failure...</option>
                            <option value="Good/New App">None (New Application)</option>
                            {FAILURES_MAP[operation]?.map((fail) => (
                                <option key={fail} value={fail}>{fail}</option>
                            ))}
                        </select>
                    </div>

                    {/* Pillar 5: Expectations */}
                     <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                        <label className="text-xs font-extrabold text-green-600 uppercase border-b border-gray-200 pb-1 block mb-2">5. Requirement / Expectation</label>
                         <select className={`${selectStyle} border-green-200 focus:border-green-500 bg-green-50/30 text-gray-900`}
                            value={params.expectation || ''} onChange={(e) => updateParam('expectation', e.target.value as any)}>
                            <option value="">Select Goal...</option>
                            <option value="Cost Reduction">Cost Reduction</option>
                            <option value="Cycle Time Reduction">Cycle Time Reduction (Speed Up)</option>
                            <option value="Tool Life Improvement">Tool Life Improvement</option>
                            <option value="Surface Finish">Better Surface Finish</option>
                            <option value="Process Security">Process Security / Reliability</option>
                        </select>
                    </div>

                </div>
            </div>
        )}

        <div className="flex justify-between mt-6">
             <button onClick={() => setStep(2)} className="text-gray-500 hover:text-red-600 font-medium px-4 py-2 transition-colors">
                <i className="fa-solid fa-arrow-left mr-2"></i> Back
             </button>
             <button 
                onClick={() => setStep(4)} 
                disabled={!subOperation}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-red-600/20"
             >
                Next Step <i className="fa-solid fa-arrow-right ml-2"></i>
             </button>
        </div>
    </div>
  );

  const renderStep4_CompetitorInput = () => (
    <div className="space-y-4 animate-fade-in">
        <HistoryRibbon />
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Identify Competitor Tool</h2>
        <div className="text-center mb-4">
            <span className="text-xs bg-gray-100 text-gray-600 font-bold px-3 py-1 rounded-full border border-gray-200">
                Analysis for: <b>{subOperation}</b> in <b>{material}</b>
            </span>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 border-b border-gray-200 rounded-t-lg">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-tl-lg ${
              activeTab === 'upload' ? 'bg-white text-red-600 border-t-2 border-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className="fa-solid fa-camera mr-2"></i> Photo / Label
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors rounded-tr-lg ${
              activeTab === 'text' ? 'bg-white text-red-600 border-t-2 border-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
             <i className="fa-solid fa-keyboard mr-2"></i> Part Number
          </button>
        </div>

        <div className="p-4 bg-white rounded-b-lg border border-gray-200 min-h-[220px] flex items-center justify-center shadow-sm">
            {activeTab === 'upload' ? (
                // Upload View
                existingFileContent ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                             <i className={`fa-solid ${existingMimeType?.includes('pdf') ? 'fa-file-pdf' : 'fa-image'} text-4xl text-red-500`}></i>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-800 font-medium">Image Loaded</p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => { setExistingFileContent(null); setExistingMimeType(undefined); }}
                                className="text-sm text-red-500 hover:text-red-700 underline"
                            >
                                Replace
                            </button>
                            <button
                                onClick={handleExistingFileSubmit}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg"
                            >
                                Analyze Now
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                      className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                      onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-3"></i>
                      <p className="text-sm text-gray-500">Drag & Drop Image of Insert Box or Tool</p>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                    </div>
                )
            ) : (
                // Text View
                <form onSubmit={handleTextSubmit} className="w-full">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter competitor Part Number (e.g. CNMG 12 04 08-WM)"
                    className="w-full h-32 bg-gray-50 border border-gray-300 rounded-lg p-3 text-gray-900 focus:border-red-500 outline-none resize-none font-mono text-sm"
                  />
                  <button type="submit" disabled={!textInput.trim()} className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 shadow-md">
                    Analyze Competitor Part
                  </button>
                </form>
            )}
        </div>
        
        <div className="flex justify-start mt-2">
            <button onClick={() => setStep(3)} className="text-gray-500 hover:text-red-600 font-medium px-4">Back</button>
        </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 bg-gray-50">
      <div className="w-full max-w-3xl bg-white p-1 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Progress Header */}
        <div className="bg-white p-6 border-b border-gray-200">
           <div className="flex items-center justify-between mb-2">
               <h1 className="text-2xl font-bold text-gray-900 tracking-tight">EquiTool <span className="text-red-600">Pro</span></h1>
               <div className="text-xs font-mono text-gray-400">Step {step} of 4</div>
           </div>
           {/* Progress Bar */}
           <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-red-600 transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }}></div>
           </div>
        </div>

        {/* Step Content */}
        <div className="p-8 min-h-[450px]">
          {isLoading ? (
             <div className="text-center flex flex-col items-center justify-center h-full pt-10">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mb-6"></div>
                    <i className="fa-solid fa-microchip absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[150%] text-gray-400"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 animate-pulse">Engineering Analysis...</h3>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
                    Cross-referencing {targetBrand} grades for {subOperation} in {material}.
                </p>
             </div>
          ) : (
            <>
                {step === 1 && renderStep1_Brand()}
                {step === 2 && renderStep2_Material()}
                {step === 3 && renderStep3_DetailedData()}
                {step === 4 && renderStep4_CompetitorInput()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputForm;