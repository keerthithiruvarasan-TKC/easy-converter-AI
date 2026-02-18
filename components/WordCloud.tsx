import React from 'react';
import { ProductInfo } from '../types';

interface ComparisonTableProps {
  competitor: ProductInfo | undefined;
  recommendation: ProductInfo | undefined;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ competitor, recommendation }) => {
  if (!competitor || !recommendation) {
    return (
        <div className="p-4 text-center text-gray-500 text-sm">
            Comparison data unavailable.
        </div>
    );
  }

  const specs = [
    { label: 'Brand', key: 'brand', isHeader: true },
    { label: 'Part Number', key: 'partNumber', isHeader: true }, 
    { label: 'Description', key: 'description' }, 
    { label: 'Grade', key: 'grade', path: 'specs' },
    { label: 'ISO Code', key: 'isoCode', path: 'specs' },
    { label: 'Substrate', key: 'material', path: 'specs' },
    { label: 'Coating', key: 'coating', path: 'specs' },
    { label: 'Geometry', key: 'geometry', path: 'specs' },
    { label: 'Vc (m/min)', key: 'cuttingSpeed', path: 'specs' },
    { label: 'Fn (mm/rev)', key: 'feedRate', path: 'specs' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Specification</th>
            <th className="p-4 text-xs font-bold text-red-500 uppercase tracking-wider w-1/3">Competitor</th>
            <th className="p-4 text-xs font-bold text-gray-800 uppercase tracking-wider w-1/3">{recommendation.brand || "Equivalent"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {specs.map((row, idx) => {
            const compVal = row.path 
                // @ts-ignore
                ? competitor.specs?.[row.key] 
                // @ts-ignore
                : competitor[row.key];

            const recVal = row.path 
                // @ts-ignore
                ? recommendation.specs?.[row.key] 
                // @ts-ignore
                : recommendation[row.key];

            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                <td className="p-4 text-sm font-medium text-gray-500 align-top">
                    {row.label}
                </td>
                <td className="p-4 text-sm font-mono text-gray-700 align-top break-words">
                    {compVal || <span className="text-gray-300">-</span>}
                </td>
                <td className={`p-4 text-sm font-mono align-top break-words ${row.isHeader ? 'text-red-600 font-bold' : 'text-gray-900 font-medium'}`}>
                    {recVal || <span className="text-gray-300">-</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;