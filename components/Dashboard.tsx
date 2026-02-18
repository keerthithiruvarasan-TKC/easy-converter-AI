import React, { useRef, useState, useEffect } from 'react';
import { EquivalencyResult, ProductInfo, SearchRequest } from '../types';
import ComparisonTable from './WordCloud';
import html2canvas from 'html2canvas';

interface ResultsViewProps {
  data: EquivalencyResult;
  requestParams: SearchRequest | null;
  onReset: () => void;
  onEdit: () => void;
  // Callback for when user fills in missing params to refine search
  onRefine?: (params: Record<string, string>) => void; 
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, requestParams, onReset, onEdit, onRefine }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Local state to manage data display (allows us to update UI after refinement)
  const [activeData, setActiveData] = useState<EquivalencyResult>(data);
  const [activeRec, setActiveRec] = useState<ProductInfo>(data?.recommendation);
  
  // State for missing parameters form
  const [paramInputs, setParamInputs] = useState<Record<string, string>>({});
  const [isRefining, setIsRefining] = useState(false);

  const isDenied = activeData?.confidenceScore === 0;
  const needsParams = activeData?.missingParams && activeData.missingParams.length > 0;

  // Sync props to state if props change (e.g. parent does a full reset)
  useEffect(() => {
    if (data) {
        setActiveData(data);
        setActiveRec(data.recommendation);
    }
  }, [data]);

  const handleSaveImage = async () => {
    if (dashboardRef.current) {
      try {
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: '#f9fafb', // Gray 50
          scale: 2, 
        });
        const link = document.createElement('a');
        link.download = `EquiTool-Report-${activeRec?.partNumber || 'result'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("Failed to capture image", err);
      }
    }
  };

  const submitRefinement = () => {
    if (onRefine) {
        setIsRefining(true);
        onRefine(paramInputs);
    }
  };

  const renderBreadcrumb = () => {
    if (!requestParams) return null;
    const { targetBrand, context } = requestParams;
    const steps = [
        { icon: 'fa-building', label: targetBrand, color: 'text-red-600 font-bold' },
        { icon: 'fa-layer-group', label: context.material?.split(' ')[0] || 'Material', color: 'text-gray-700' },
        { icon: 'fa-gears', label: context.operationType || 'Op', color: 'text-gray-700' },
        { icon: 'fa-microchip', label: context.subOperationType || 'Sub-Op', color: 'text-gray-700' },
        { icon: 'fa-magnifying-glass', label: activeData.competitor?.partNumber || 'Competitor', color: 'text-gray-600' },
        { icon: 'fa-check-circle', label: activeRec.partNumber || 'Solution', color: 'text-green-600 font-bold' },
    ];

    return (
        <div className="w-full bg-white border-b border-gray-200 px-6 py-3 mb-6 flex flex-wrap items-center gap-2 shadow-sm rounded-lg mx-auto max-w-7xl mt-4">
            <span className="text-xs text-gray-400 uppercase font-bold mr-2">Process Flow:</span>
            {steps.map((step, idx) => (
                <div key={idx} className="flex items-center">
                    <div className={`flex items-center space-x-2 text-xs ${step.color} bg-gray-50 px-2 py-1 rounded border border-gray-100`}>
                        <i className={`fa-solid ${step.icon}`}></i>
                        <span>{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <i className="fa-solid fa-chevron-right text-gray-300 text-[10px] mx-2"></i>
                    )}
                </div>
            ))}
        </div>
    );
  };

  if (!activeData || !activeRec) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32">
      {/* Navbar */}
      <nav className="flex flex-col md:flex-row justify-between items-center mb-4 max-w-7xl mx-auto gap-4">
        <div className="flex items-center space-x-3">
           <i className="fa-solid fa-industry text-red-600 text-2xl"></i>
           <span className="text-xl font-bold text-gray-900 tracking-tight">EquiTool</span>
        </div>
        
        <div className="flex items-center space-x-3">
             <button 
              onClick={handleSaveImage}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 shadow-sm flex items-center"
            >
              <i className="fa-solid fa-camera mr-2 text-red-500"></i>
              Save Report
            </button>
            <button 
              onClick={onEdit}
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-300 shadow-sm flex items-center"
            >
              <i className="fa-solid fa-pen-to-square mr-2 text-red-500"></i>
              Edit Params
            </button>
            <button 
              onClick={onReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-md shadow-red-200"
            >
              <i className="fa-solid fa-magnifying-glass mr-2"></i>
              New Search
            </button>
        </div>
      </nav>

      {/* Breadcrumb History */}
      {renderBreadcrumb()}

      {/* Capture Area */}
      <div ref={dashboardRef} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 p-4 rounded-xl">
        
        {/* Left Col: Recommendation */}
        <div className="space-y-6">
           {/* Refinement Needed Alert */}
           {needsParams && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                        <i className="fa-solid fa-ruler-combined text-xl"></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">Technical Refinement Required</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {activeData.competitor?.brand || 'The competitor part'} {activeData.competitor?.partNumber} does not have a direct geometric match. 
                            To provide a functional replacement, we need specific parameters.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {activeData.missingParams?.map((param) => (
                                <div key={param}>
                                    <label className="block text-xs text-yellow-600 font-bold mb-1 uppercase">{param}</label>
                                    <input 
                                        type="text"
                                        placeholder={`Enter ${param}...`}
                                        className="w-full bg-white border border-yellow-300 rounded p-2 text-gray-900 text-sm focus:border-yellow-500 outline-none"
                                        onChange={(e) => setParamInputs(prev => ({ ...prev, [param]: e.target.value }))}
                                    />
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={submitRefinement}
                            disabled={isRefining}
                            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center shadow-sm"
                        >
                            {isRefining ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Find Functional Equivalent"}
                        </button>
                    </div>
                </div>
             </div>
           )}

           {/* Hero Recommendation Card */}
           {!needsParams && (
            <div className={`bg-white border ${isDenied ? 'border-red-200' : 'border-gray-200'} rounded-2xl overflow-hidden shadow-xl relative transition-all duration-300`}>
              <div className={`absolute top-0 left-0 w-full h-1.5 ${isDenied ? 'bg-red-500' : 'bg-red-600'}`}></div>
              <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex gap-2 mb-2">
                             {isDenied ? (
                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-red-200">
                                    <i className="fa-solid fa-ban mr-1"></i> No Match Found
                                </span>
                            ) : (
                                <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-red-100">
                                    {activeRec === activeData.recommendation ? "Best Match" : "Selected Option"}
                                </span>
                            )}
                            
                            {/* Strategy Badge */}
                            {activeData.replacementStrategy === 'INSERT_ONLY' && (
                                <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-green-100">
                                    <i className="fa-solid fa-shapes mr-1"></i> Use Existing Holder
                                </span>
                            )}
                             {activeData.replacementStrategy === 'FULL_ASSEMBLY' && (
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide border border-blue-100">
                                    <i className="fa-solid fa-tools mr-1"></i> New Assembly Reqd.
                                </span>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mt-2">{activeRec.name || 'Unknown'}</h2>
                        <p className={`font-mono text-lg mt-1 font-bold ${isDenied ? 'text-red-500' : 'text-gray-700'}`}>
                            {activeRec.partNumber || 'N/A'}
                        </p>
                         <p className="text-gray-500 text-sm mt-2 border-l-2 border-red-200 pl-3">
                            {activeRec.description || 'No description available'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${activeData.confidenceScore > 85 ? 'text-green-600' : isDenied ? 'text-red-600' : 'text-yellow-500'}`}>{activeData.confidenceScore}%</div>
                        <div className="text-xs text-gray-400 uppercase font-medium">Confidence</div>
                      </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                     <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 border-b border-gray-200 pb-2 tracking-wider">Technical Specs</h3>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold">Grade</span>
                            <span className="text-gray-900 font-mono font-bold">{activeRec.specs?.grade || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold">Geometry</span>
                            <span className="text-gray-900 font-mono font-bold">{activeRec.specs?.geometry || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold">Coating</span>
                            <span className="text-gray-900 font-mono font-bold">{activeRec.specs?.coating || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold">Application</span>
                            <span className="text-gray-900 font-mono font-bold">{activeRec.specs?.application || 'General'}</span>
                        </div>
                     </div>
                  </div>

                  <p className={`italic leading-relaxed ${isDenied ? 'text-red-600' : 'text-gray-600'}`}>
                    "{activeData.reasoning}"
                  </p>

                  {/* Sources Section */}
                  {activeData.sources && activeData.sources.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-2 flex items-center">
                            <i className="fa-brands fa-google text-gray-400 mr-2"></i> Verified Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {activeData.sources.map((source, idx) => (
                               <a 
                                 key={idx} 
                                 href={source.uri} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-[10px] bg-white hover:bg-gray-50 text-red-600 border border-gray-200 rounded px-2 py-1 truncate max-w-[200px] transition-colors shadow-sm"
                               >
                                 {source.title}
                               </a>
                           ))}
                        </div>
                     </div>
                  )}
              </div>
           </div>
           )}

           {/* Knowledge / Educational Card (Goal 4) */}
           {activeData.educationalTip && !needsParams && (
             <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -mr-8 -mt-8"></div>
                <h3 className="text-sm font-bold text-blue-600 uppercase mb-2 flex items-center relative z-10">
                    <i className="fa-solid fa-lightbulb mr-2"></i> Engineering Pro Tip
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                    {activeData.educationalTip}
                </p>
             </div>
           )}
        </div>

        {/* Right Col: Detailed Comparison & Alternatives */}
        <div className="flex flex-col space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <i className="fa-solid fa-scale-balanced mr-3 text-red-500"></i>
                    Technical Comparison
                </h3>
                <ComparisonTable 
                    competitor={activeData.competitor} 
                    recommendation={activeRec} 
                />
            </div>

            {/* Alternatives / Fine Tuning Section */}
            {!isDenied && !needsParams && activeData.alternatives && activeData.alternatives.length > 0 && (
                 <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <i className="fa-solid fa-sliders mr-2 text-gray-400"></i>
                        Fine-tune Selection
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Select an alternative (e.g., High Productivity option):</p>
                    <div className="space-y-3">
                        {/* Original Rec Option */}
                        <button 
                            onClick={() => setActiveRec(activeData.recommendation)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                activeRec === activeData.recommendation 
                                ? 'bg-red-50 border-red-500 ring-1 ring-red-500 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-900">{activeData.recommendation.name}</span>
                                {activeRec === activeData.recommendation && <i className="fa-solid fa-check text-red-600"></i>}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-1 truncate">{activeData.recommendation.partNumber}</div>
                        </button>

                        {/* Alternatives */}
                        {activeData.alternatives.map((alt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveRec(alt)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    activeRec === alt 
                                    ? 'bg-red-50 border-red-500 ring-1 ring-red-500 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">{alt.name || 'Alternative'}</span>
                                    {activeRec === alt && <i className="fa-solid fa-check text-red-600"></i>}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-1 truncate">{alt.partNumber || 'N/A'}</div>
                                <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">{alt.description || ''}</div>
                            </button>
                        ))}
                    </div>
                 </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default ResultsView;