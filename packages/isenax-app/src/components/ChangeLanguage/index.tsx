import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLanguage } from '@tabler/icons-react';
import './styles.css';
import { supportedLanguages } from '../../i18n';

const ChangeLanguage = () => {
  const { t, i18n } = useTranslation('app');
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en-US');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);
    localStorage.setItem('i18nextLng', lang);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <div
        className="language-display"
        onMouseEnter={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={t('nav.language')}
        data-tooltip={t('nav.language')}
      >
        <IconLanguage size={18} />
      </div>
      {isOpen && (
        <div className="language-dropdown">
          {supportedLanguages.map(item => (
            <div
              key={item.value}
              className={`language-option ${currentLang === item.value ? 'active' : ''}`}
              onClick={() => changeLanguage(item.value)}
            >
              {item.label}
            </div>
          ))
          }
        </div>
      )}
    </div>
  );
};

export default ChangeLanguage;
