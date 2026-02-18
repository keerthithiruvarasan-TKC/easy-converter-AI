export type InputType = 'text' | 'image' | 'pdf';

export type TargetBrand = 'Tungaloy' | 'Toolflo' | 'NTK' | 'Morse';

export const BRAND_SPECIALTIES: Record<TargetBrand, string> = {
  'Tungaloy': 'General Purpose (Turning, Milling, Drilling)',
  'Toolflo': 'Threading & Grooving Specialists',
  'NTK': 'Ceramics & Miniature Machining',
  'Morse': 'Solid Carbide Endmills & Drills'
};

export type OperationType = 'Turning' | 'Milling' | 'Holemaking' | 'Threading' | 'Grooving';

export type SubOperationType = 
  // Turning
  | 'External Turning' | 'Internal Turning'
  // Milling
  | 'SC Milling' | 'SC Ball Nose' | 'SC Bull Nose' | 'Hi-Feed (Insert)' | 'Shoulder (Insert)' | 'Face (Insert)'
  // Holemaking
  | 'SC Drill' | 'U-Drill' | 'Modular Drill' | 'BTA Drill' | 'Gun Drill'
  // Threading
  | 'Thread Turning (Ext)' | 'Thread Turning (Int)' | 'Thread Mill (Ext - SC)' | 'Thread Mill (Int - SC)' | 'Thread Mill (Ext - Insert)' | 'Thread Mill (Int - Insert)'
  // Grooving
  | 'External Grooving' | 'Internal Grooving' | 'Parting';

export type IsoMaterial = 'P (Steel)' | 'M (Stainless)' | 'K (Cast Iron)' | 'N (Non-Ferrous)' | 'S (Superalloys)' | 'H (Hardened)';

export interface OperationParams {
  // 1. Cutting Parameters
  vc?: string; // Cutting Speed
  fn?: string; // Feed
  ap?: string; // Depth of Cut
  ae?: string; // Radial width (Milling)
  pitch?: string; // Threading
  overhang?: string; // Stickout

  // 1.5 Dimensional Data (New)
  workpieceDiameter?: string; // OD or ID
  partingDiameter?: string; // For Parting off (Bar dia)
  grooveWidth?: string; // W
  grooveDepth?: string; // Ar

  // 2. Application Parameters
  materialHardness?: string; // HB / HRC
  workpieceStability?: string; // Dynamic string based on operation
  
  // 3. Machine Details
  coolant?: 'Wet' | 'Dry' | 'MQL' | 'High Pressure';
  machinePower?: string; // BT40/50, HSK, Swiss
  
  // 4. Failure Mode
  failureMode?: string; // Dynamic string based on operation

  // 5. Expectations
  expectation?: 'Cycle Time Reduction' | 'Cost Reduction' | 'Tool Life Improvement' | 'Surface Finish' | 'Process Security';
}

export interface ApplicationContext {
  operationType: OperationType | null;
  subOperationType: SubOperationType | null;
  material: IsoMaterial | null;
  params: OperationParams;
}

export interface ToolSpecs {
  isoCode?: string;
  grade?: string;
  coating?: string;
  material?: string;
  geometry?: string;
  application?: string; 
  cuttingSpeed?: string;
  feedRate?: string;
}

export interface ProductInfo {
  brand: string;
  name: string;
  partNumber: string;
  description: string;
  specs: ToolSpecs;
}

export interface EquivalencyResult {
  competitor: ProductInfo;
  recommendation: ProductInfo;
  alternatives?: ProductInfo[]; 
  reasoning: string;
  confidenceScore: number; // 0-100
  sources?: { uri: string; title: string }[];
  missingParams?: string[]; 
  educationalTip?: string; 
  // New Field for ISO Logic
  replacementStrategy?: 'INSERT_ONLY' | 'FULL_ASSEMBLY'; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface SearchRequest {
  content: string;
  type: InputType;
  targetBrand: TargetBrand;
  context: ApplicationContext;
  mimeType?: string;
}

export enum AppState {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}