
import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'guide' | 'faq' | 'glossary' | 'whats-new';

// Memoized inline icons for performance
const IconPin = React.memo(() => <Icons.Pin className="inline h-4 w-4"/>);
const IconSmile = React.memo(() => <Icons.SmilePlus className="inline h-4 w-4"/>);
const IconSave = React.memo(() => <Icons.Save className="inline h-4 w-4"/>);
const IconBlog = React.memo(() => <Icons.BookCopy className="inline h-4 w-4"/>);
const IconMeeting = React.memo(() => <Icons.GanttChartSquare className="inline h-4 w-4"/>);
const IconSettings = React.memo(() => <Icons.Settings className="inline h-4 w-4"/>);
const IconLink = React.memo(() => <Icons.Link className="inline h-4 w-4"/>);


const HelpCenter: React.FC<HelpCenterProps> = ({ isOpen, onClose }) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const modalRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsEntering(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first focusable element
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'guide', label: t('help.tabs.guide'), icon: <Icons.BookText className="h-4 w-4" /> },
    { id: 'faq', label: t('help.tabs.faq'), icon: <Icons.CircleHelp className="h-4 w-4" /> },
    { id: 'glossary', label: t('help.tabs.glossary'), icon: <Icons.NotebookPen className="h-4 w-4" /> },
    { id: 'whats-new', label: t('help.tabs.whatsNew'), icon: <Icons.Megaphone className="h-4 w-4" /> },
  ];

  return (
    <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" 
        aria-modal="true"
        role="dialog"
    >
      <div ref={modalRef} className={`bg-slate-50 dark:bg-slate-900 w-full sm:max-w-4xl sm:m-4 h-full sm:h-auto sm:max-h-[90vh] sm:rounded-lg flex flex-col transition-all duration-300 ease-out ${isEntering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
             <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icons.HelpCircle className="h-6 w-6 md:h-7 md:w-7" />
                {t('help.title')}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800" aria-label={t('help.close')}>
                <Icons.X className="h-5 w-5" />
            </button>
        </div>
        
        <div className="flex p-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex-grow flex justify-between sm:justify-center bg-slate-200 dark:bg-slate-800 rounded-lg p-1 min-w-max sm:min-w-0">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-2 transition-colors ${
                    activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-300'
                    }`}
                >
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                </button>
            ))}
            </div>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto prose prose-slate dark:prose-invert max-w-none pb-20 sm:pb-6">
            {activeTab === 'guide' && <Guide />}
            {activeTab === 'faq' && <FAQ />}
            {activeTab === 'glossary' && <Glossary />}
            {activeTab === 'whats-new' && <WhatsNew />}
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode}> = ({title, icon, children}) => (
    <div className="mb-8 p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-100/50 dark:bg-slate-950/50 not-prose">
        <h3 className="flex items-center gap-2 font-bold text-xl mb-3 text-slate-800 dark:text-slate-200">
            <span className="text-primary-500">{icon}</span>
            {title}
        </h3>
        <div className="space-y-2 text-slate-700 dark:text-slate-300 text-base">{children}</div>
    </div>
)

const Guide = () => {
    const { t } = useLocale();
    return (
        <div>
            <h2 className="font-bold text-2xl mb-4">{t('help.guide.title')}</h2>
            <p>{t('help.guide.intro')}</p>
            
            <Section title={t('help.guide.basics.title')} icon={<Icons.Notebook />}>
                <p><strong>{t('help.guide.basics.create.title')}:</strong> {t('help.guide.basics.create.description')}</p>
                <p><strong>{t('help.guide.basics.edit.title')}:</strong> {t('help.guide.basics.edit.description')}</p>
                <p><strong>{t('help.guide.basics.pin.title')}:</strong> {t('help.guide.basics.pin.description')} <IconPin /></p>
                <p><strong>{t('help.guide.basics.personalize.title')}:</strong> {t('help.guide.basics.personalize.description')} <IconSmile /></p>
            </Section>

            <Section title={t('help.guide.linking.title')} icon={<IconLink/>}>
                 <p>{t('help.guide.linking.description1')}</p>
                 <p><code>[[{t('help.guide.linking.example')}]]</code></p>
                 <p>{t('help.guide.linking.description2')}</p>
            </Section>
            
            <Section title={t('help.guide.tasks.title')} icon={<Icons.CheckSquare />}>
                <p>{t('help.guide.tasks.intro')}:</p>
                <ul className="list-disc pl-5">
                    <li><code>- [ ] {t('help.guide.tasks.open')}</code></li>
                    <li><code>- [x] {t('help.guide.tasks.completed')}</code></li>
                </ul>
                <p><strong>{t('help.guide.tasks.dueDate.title')}:</strong> {t('help.guide.tasks.dueDate.description')}</p>
                <p><strong>{t('help.guide.tasks.view.title')}:</strong> {t('help.guide.tasks.view.description')}</p>
            </Section>

            <Section title={t('help.guide.templates.title')} icon={<Icons.LayoutTemplate />}>
                <p><strong>{t('help.guide.templates.use.title')}:</strong> {t('help.guide.templates.use.description')}</p>
                <p><strong>{t('help.guide.templates.save.title')}:</strong> {t('help.guide.templates.save.description')} <IconSave /> "{t('editor.saveAsTemplate')}"</p>
                <p><strong>{t('help.guide.templates.manage.title')}:</strong> {t('help.guide.templates.manage.description')}</p>
            </Section>
            
            <Section title={t('help.guide.ai.title')} icon={<Icons.BrainCircuit />}>
                <p>{t('help.guide.ai.intro')}</p>
                <ul className="list-disc pl-5">
                    <li><strong>{t('help.guide.ai.recipes.title')}:</strong> {t('help.guide.ai.recipes.description')} (<IconBlog />) {t('help.guide.ai.recipes.or')} (<IconMeeting />).</li>
                    <li><strong>{t('aiPanel.analysis.title')}:</strong> {t('help.guide.ai.analysis')}</li>
                    <li><strong>{t('aiPanel.creative.title')}:</strong> {t('help.guide.ai.creative')}</li>
                    <li><strong>{t('aiPanel.image.title')}:</strong> {t('help.guide.ai.image')}</li>
                    <li><strong>{t('aiPanel.plan.title')}:</strong> {t('help.guide.ai.plan')}</li>
                    <li>... {t('help.guide.ai.more')}</li>
                </ul>
            </Section>
            
            <Section title={t('help.guide.graph.title')} icon={<Icons.Share2 />}>
                <p>{t('help.guide.graph.description1')}</p>
                <p>{t('help.guide.graph.description2')}</p>
            </Section>
            
            <Section title={t('help.guide.history.title')} icon={<Icons.History />}>
                <p>{t('help.guide.history.description')}</p>
            </Section>
        </div>
    );
}

const FAQ = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.faq.title')}</h2>
        
        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q1.question')}</h4>
            <p>{t('help.faq.q1.answer')}</p>
        </div>

        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q2.question')}</h4>
            <p>{t('help.faq.q2.answer')}</p>
        </div>

        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q3.question')}</h4>
            <p>{t('help.faq.q3.answer')} <IconSettings /></p>
        </div>
        
        <div className="mb-6">
            <h4 className="font-semibold text-lg">{t('help.faq.q4.question')}</h4>
            <p>{t('help.faq.q4.answer')}</p>
        </div>
    </div>
    );
};

const Glossary = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.glossary.title')}</h2>
        <dl>
            <dt className="font-semibold">{t('help.glossary.term1.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term1.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term2.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term2.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term3.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term3.definition')}</dd>

            <dt className="font-semibold">{t('help.glossary.term4.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term4.definition')}</dd>
            
            <dt className="font-semibold">{t('help.glossary.term5.term')}</dt>
            <dd className="mb-4 ml-4">{t('help.glossary.term5.definition')}</dd>
        </dl>
    </div>
    );
};

const WhatsNew = () => {
    const { t } = useLocale();
    return (
    <div>
        <h2 className="font-bold text-2xl mb-4">{t('help.whatsNew.title')}</h2>
        <p>{t('help.whatsNew.intro')}</p>

        <Section title={t('help.whatsNew.feature1.title')} icon={<Icons.Megaphone />}>
            <p>{t('help.whatsNew.feature1.description1')}</p>
            <p>{t('help.whatsNew.feature1.description2')}</p>
        </Section>
        
        <Section title={t('help.whatsNew.feature2.title')} icon={<Icons.CheckCircle2 />}>
            <p>{t('help.whatsNew.feature2.description1')}</p>
            <p>{t('help.whatsNew.feature2.description2')}</p>
        </Section>

        <Section title={t('help.whatsNew.feature3.title')} icon={<Icons.HelpCircle />}>
            <p>{t('help.whatsNew.feature3.description')}</p>
        </Section>
    </div>
    );
};


export default HelpCenter;
