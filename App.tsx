import React, { useState } from 'react';
import { AppState, EquivalencyResult, TargetBrand, ApplicationContext, SearchRequest } from './types';
import { findEquivalent } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultsView from './components/Dashboard';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.INPUT);
  const [data, setData] = useState<EquivalencyResult | null>(null);
  const [lastRequest, setLastRequest] = useState<SearchRequest | null>(null);

  const handleSearch = async (content: string, type: 'text' | 'image' | 'pdf', targetBrand: TargetBrand, context: ApplicationContext, mimeType?: string) => {
    // Save request for "Edit" functionality
    setLastRequest({
        content,
        type,
        targetBrand,
        context,
        mimeType
    });

    setState(AppState.ANALYZING);
    try {
        const result = await findEquivalent(content, type, targetBrand, context, mimeType);
        setData(result);
        setState(AppState.RESULTS);
    } catch (error) {
        console.error("Search failed", error);
        setState(AppState.INPUT);
        alert("We couldn't identify the product in your input. Please try a clearer photo or a more specific part number.");
    }
  };

  const handleRefinement = async (params: Record<string, string>) => {
    if (!lastRequest) return;
    
    // We stay in RESULTS state but maybe show a loading indicator overlay in Dashboard 
    // (though simple state switch to ANALYZING is easier for now)
    setState(AppState.ANALYZING);

    try {
        const result = await findEquivalent(
            lastRequest.content, 
            lastRequest.type, 
            lastRequest.targetBrand, 
            lastRequest.context, 
            lastRequest.mimeType,
            params // Pass the new engineering params
        );
        setData(result);
        setState(AppState.RESULTS);
    } catch (error) {
        console.error("Refinement failed", error);
        setState(AppState.RESULTS); // Go back to results (likely the previous state)
        alert("Failed to refine results. Please try again.");
    }
  };

  const handleReset = () => {
    setData(null);
    setLastRequest(null); // Clear history on new search
    setState(AppState.INPUT);
  };

  const handleEdit = () => {
      // Go back to INPUT state, but do not clear lastRequest.
      // InputForm will see lastRequest and pre-fill.
      setState(AppState.INPUT);
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
      {state === AppState.INPUT && (
        <InputForm 
            onSubmit={handleSearch} 
            isLoading={false} 
            initialValues={lastRequest}
        />
      )}

      {state === AppState.ANALYZING && (
        <InputForm onSubmit={() => {}} isLoading={true} initialValues={lastRequest} />
      )}

      {state === AppState.RESULTS && data && (
        <>
            <ResultsView 
                data={data} 
                requestParams={lastRequest}
                onReset={handleReset} 
                onEdit={handleEdit}
                onRefine={handleRefinement}
            />
            <ChatBot contextData={data} />
        </>
      )}
    </div>
  );
};

export default App;