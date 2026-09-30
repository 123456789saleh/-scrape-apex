import React, { useState, useEffect } from 'react';
import { Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept?: () => void;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
  lang?: 'ar' | 'en';
}

export default function DisclaimerModal({ 
  onAccept, 
  isOpenControlled, 
  onCloseControlled, 
  lang = 'ar' 
}: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAr = lang === 'ar';

  useEffect(() => {
    // If externally controlled, respect that prop
    if (isOpenControlled !== undefined) {
      setIsOpen(isOpenControlled);
      return;
    }

    // Otherwise check local storage
    try {
      const isAccepted = localStorage.getItem('scrape_apex_terms_accepted');
      if (!isAccepted) {
        setIsOpen(true);
      }
    } catch {
      // In case localStorage is restricted
      setIsOpen(true);
    }
  }, [isOpenControlled]);

  const handleAccept = () => {
    try {
      localStorage.setItem('scrape_apex_terms_accepted', 'true');
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false);
    if (onCloseControlled) onCloseControlled();
    if (onAccept) onAccept();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div 
        className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl ${
          isAr ? 'text-right dir-rtl' : 'text-left dir-ltr'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 mb-4 text-amber-400">
          <span className="text-2xl p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            ⚖️
          </span>
          <div>
            <h3 id="disclaimer-title" className="text-xl font-bold text-white">
              {isAr ? 'إشعار إبراء الذمة وشروط الاستخدام' : 'Disclaimer & Terms of Use'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAr ? 'اتفاقية الاستخدام المسؤول وأخلاقيات استخراج البيانات' : 'Responsible Use & Ethical Data Extraction Agreement'}
            </p>
          </div>
        </div>

        <div className="text-gray-300 text-sm space-y-3 mb-6 max-h-64 overflow-y-auto pl-2 pr-1 leading-relaxed scrollbar-thin">
          <p>
            {isAr ? (
              <>أهلاً بك في منصة <strong>Scrape Apex</strong>. يرجى قراءة الشروط القانونية التالية بعناية قبل البدء:</>
            ) : (
              <>Welcome to <strong>Scrape Apex</strong>. Please read the following legal terms carefully before proceeding:</>
            )}
          </p>
          <ul className={`list-disc list-inside space-y-2 text-gray-400 ${isAr ? 'pr-2' : 'pl-2'}`}>
            <li>
              {isAr 
                ? 'التطبيق أداة تقنية مخصصة لأغراض البحث والأكاديمية واستخراج البيانات المتاحة للعامة فقط.' 
                : 'The tool is strictly intended for research, academic purposes, and publicly accessible data extraction.'}
            </li>
            <li>
              {isAr 
                ? 'يتحمل المستخدم كاملاً المسؤولية القانونية والأخلاقية عن نوعية البيانات المسحوبة وطريقة استخدامها أو إعادة نشرها تجارياً.' 
                : 'The user assumes full legal and ethical liability for the extracted data type and how it is utilized or republished.'}
            </li>
            <li>
              {isAr 
                ? 'يُحظر تماماً استخدام الأداة لسحب البيانات الشخصية للأفراد، أو إغراق السيرفرات بطلبات كثيفة تسبب تعطيل الخدمات (DDoS).' 
                : 'It is strictly forbidden to scrape private personal information or flood servers with abusive requests (DDoS).'}
            </li>
            <li>
              {isAr 
                ? 'المنصة والمطور غير مسؤولين عن أي انتهاك لحقوق الملكية الفكرية أو شروط الخدمة الخاصة بالمواقع المستهدفة.' 
                : 'The platform and developers are not liable for any infringement of intellectual property or third-party Terms of Service.'}
            </li>
          </ul>
        </div>

        <button
          onClick={handleAccept}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>
            {isAr ? 'أوافق على الشروط والأحكام وابدأ الاستخدام' : 'I Agree to Terms & Start Using'}
          </span>
        </button>
      </div>
    </div>
  );
}

export { DisclaimerModal };
