import React from 'react';
import { ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, ArrowDown } from 'lucide-react';

interface FormIconProps {
  form: '⬆️' | '↗️' | '➡️' | '↘️' | '⬇️' | string;
  className?: string;
}

export default function FormIcon({ form, className = "w-5 h-5" }: FormIconProps) {
  switch (form) {
    case '⬆️':
      return <ArrowUp className={`${className} text-emerald-500`} />;
    case '↗️':
      return <ArrowUpRight className={`${className} text-green-400`} />;
    case '➡️':
      return <ArrowRight className={`${className} text-yellow-500`} />;
    case '↘️':
      return <ArrowDownRight className={`${className} text-orange-500`} />;
    case '⬇️':
      return <ArrowDown className={`${className} text-red-500`} />;
    default:
      return null;
  }
}
