/**
 * AutopilotFlowViz Component
 * 
 * Horizontal visualization showing the daily pipeline steps:
 * Pick Topic > AI Generate > SEO Check > Telegram > Publish > Distribute
 */

import React from 'react';
import { Calendar, Bot, BarChart2, MessageCircle, Globe, Send, ChevronRight } from 'lucide-react';

const AutopilotFlowViz = () => {
  const steps = [
    { icon: Calendar, label: 'Pick Topic', time: '10:00 AM' },
    { icon: Bot, label: 'AI Generate', time: '10:01 AM' },
    { icon: BarChart2, label: 'SEO Check', time: '10:02 AM' },
    { icon: MessageCircle, label: 'Telegram', time: 'You approve' },
    { icon: Globe, label: 'Publish', time: 'Auto' },
    { icon: Send, label: 'Distribute', time: '4 platforms' }
  ];

  return (
    <div className="mb-6" data-testid="autopilot-flow-viz">
      <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
        DAILY AUTOPILOT FLOW
      </h3>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.label}>
              {/* Step Box */}
              <div 
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-center min-w-[90px] flex-shrink-0"
                data-testid={`flow-step-${index}`}
              >
                <Icon className="w-[18px] h-[18px] mx-auto mb-2 text-teal-400" />
                <p className="text-xs font-semibold text-slate-300">{step.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{step.time}</p>
              </div>
              
              {/* Arrow (except for last item) */}
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default AutopilotFlowViz;
