import React, { useState, useEffect } from 'react';
import { adToBS, bsToAD, isValidBSDate } from '../../utils/nepaliDate';

/**
 * NepaliDateInput
 *
 * A dual-date input that keeps BS and AD in sync.
 * The value passed in/out is always an AD date string (yyyy-MM-dd),
 * matching the existing form behaviour.
 *
 * Props:
 *   name        – field name (for the hidden AD input)
 *   value       – AD date string (yyyy-MM-dd)
 *   onChange    – called with a synthetic-like event: { target: { name, value } }
 *                 where value is the AD date string
 *   disabled    – boolean
 *   hasError    – boolean (red border)
 *   required    – boolean
 */
const NepaliDateInput = ({ name, value, onChange, disabled, hasError, required }) => {
  const [bsValue, setBsValue] = useState(() => adToBS(value) || '');
  const [adValue, setAdValue] = useState(() => value || '');
  const [bsError, setBsError] = useState('');

  // Sync when parent value changes (e.g. edit mode load)
  useEffect(() => {
    if (value !== adValue) {
      setAdValue(value || '');
      setBsValue(adToBS(value) || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitChange = (adDate) => {
    onChange({ target: { name, value: adDate } });
  };

  // User typed in BS field
  const handleBSChange = (e) => {
    const raw = e.target.value;
    setBsValue(raw);
    setBsError('');

    if (!raw) {
      setAdValue('');
      emitChange('');
      return;
    }

    // Only convert when we have a full yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      if (isValidBSDate(raw)) {
        const ad = bsToAD(raw);
        setAdValue(ad);
        emitChange(ad);
        setBsError('');
      } else {
        setBsError('Invalid B.S. date');
        setAdValue('');
        emitChange('');
      }
    }
  };

  // User typed in AD field
  const handleADChange = (e) => {
    const raw = e.target.value;
    setAdValue(raw);
    setBsError('');

    if (!raw) {
      setBsValue('');
      emitChange('');
      return;
    }

    const bs = adToBS(raw);
    setBsValue(bs);
    emitChange(raw);
  };

  const baseInput = `
    block w-full rounded-lg border px-3 py-2 text-sm text-gray-900
    focus:outline-none focus:ring-2 transition-colors
    ${hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-primary-400 focus:border-primary-400'}
    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white'}
  `;

  return (
    <div className="space-y-1.5">
      {/* BS input */}
      <div className="relative">
        <input
          type="text"
          value={bsValue}
          onChange={handleBSChange}
          disabled={disabled}
          placeholder="YYYY-MM-DD (B.S.)"
          className={baseInput}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-600 pointer-events-none">
          B.S.
        </span>
      </div>
      {bsError && <p className="text-xs text-red-500">{bsError}</p>}

      {/* AD input */}
      <div className="relative">
        <input
          type="date"
          value={adValue}
          onChange={handleADChange}
          disabled={disabled}
          className={baseInput}
        />
        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
          A.D.
        </span>
      </div>
    </div>
  );
};

export default NepaliDateInput;
