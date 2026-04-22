import React from 'react';
import { useTranslation } from 'react-i18next';
import { RwandaCaseMap } from '../../components/shared/RwandaCaseMap';
import {
  useSurveillanceI18nNs,
  useSurveillanceProvinceScope,
} from './useSurveillanceBasePath';

export function RichMapPage() {
  const { i18n } = useTranslation();
  const language = i18n.language.startsWith('rw') ? 'rw' : 'en';
  const ns = useSurveillanceI18nNs();
  const provinceScope = useSurveillanceProvinceScope();

  const subtitle =
    language === 'en'
      ? ns === 'pfth'
        ? 'PFTH — Northern Province'
        : ns === 'sfr'
          ? 'SFR — Kigali City'
          : 'RICH surveillance'
      : ns === 'pfth'
        ? 'PFTH — Intara y’Amajyaruguru'
        : ns === 'sfr'
          ? 'SFR — Umujyi wa Kigali'
          : 'Gukurikirana RICH';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Case map' : 'Ikarita y’ibibazo'}
        </h1>
        <p className="text-sm text-gray-500">
          {language === 'en'
            ? 'District filter, case dots (by district), and optional density heatmap for your province.'
            : 'Akarere, imanza z’ibibazo, n’ubushyuhe ku karere wawe.'}
        </p>
      </div>
      <RwandaCaseMap
        accent="rich"
        provinceScope={provinceScope}
        subtitle={subtitle}
        title={language === 'en' ? 'Severe malaria & case density' : 'Malariya ikomeye n\'ubwinshi bw\'ibibazo'}
      />
    </div>
  );
}
