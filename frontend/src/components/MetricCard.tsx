import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  type?: 'default' | 'yield' | 'warning' | 'brand';
  isLive?: boolean;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  subValue, 
  type = 'default',
  isLive = false,
  className = ''
}) => {
  const getValueColor = () => {
    switch (type) {
      case 'yield': return 'text-emerald-400 yield-text';
      case 'warning': return 'text-amber-400';
      case 'brand': return 'text-violet-500 brand-text';
      default: return 'text-white';
    }
  };

  const getCardBackground = () => {
    if (type === 'yield' && isLive) {
      return 'bg-zinc-900 border-zinc-800/50 hover:border-emerald-500/30';
    }
    return 'bg-zinc-900 border-zinc-800/50 hover:border-violet-500/30';
  };

  return (
    <div className={`institutional-card hover-lift rounded-xl p-6 ${getCardBackground()} ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-ui text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {label}
        </h3>
        {isLive && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full live-dot"></div>
            <span className="font-ui text-xs text-emerald-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className={`font-mono text-3xl font-semibold ${getValueColor()} mb-1`}>
        {value}
      </div>

      {/* Sub Value */}
      {subValue && (
        <div className="font-ui text-sm text-zinc-500">
          {subValue}
        </div>
      )}
    </div>
  );
};

export default MetricCard;