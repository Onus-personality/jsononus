import { Report, getTestResult, sendPDF } from '@/actions';
import { Snippet } from '@nextui-org/snippet';
import { useTranslations } from 'next-intl';
import { title } from '@/components/primitives';
import { DomainPage } from './domain';
import { Domain } from '@bigfive-org/results';
import { getTranslations } from 'next-intl/server';
import { BarChart } from '@/components/bar-chart';
import { Link } from '@/navigation';
import { ReportLanguageSwitch } from './report-language-switch';
import { Alert } from '@/components/alert';
import { supportEmail } from '@/config/site';
import ShareBar from '@/components/share-bar';
import { DomainTabs } from './domain-tabs';
import { Chip } from '@nextui-org/react';
let sent = false;
export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'results' });

  return {
    title: t('seo.title'),
    description: t('seo.description')
  };
}

interface ResultPageParams {
  params: { id: string };
  searchParams: { lang: string; showExpanded?: boolean };
}

export default async function ResultPage({
  params,
  searchParams
}: ResultPageParams) {
  let report;

  try {
    report = await getTestResult(params.id.substring(0, 24), searchParams.lang);
    console.log('result123',report)
    // Start the sendPDF call without waiting for it to finish
    // setTimeout(() => {
      // if (!sent) {
        await sendPDF(params.id.substring(0, 24), { name: report.name, email: report.email }).catch(
          (error) => {
            console.error('Failed to send PDF:', error);
          }
        );
        // sent = true;
      // }
    // }, 2000);
  } catch (error) {
    throw new Error('Could not retrieve report');
  }

  if (!report)
    return (
      <Alert title='Could not retrive report'>
        <>
          <p>We could not retrive the following id {params.id}.</p>
          <p>Please check that it is correct or contact us at {supportEmail}</p>
        </>
      </Alert>
    );

  return (
    <Results
      id={params.id.substring(0, 24)}
      report={report}
      showExpanded={searchParams.showExpanded}
    />
  );
}

interface ResultsProps {
  id: string;
  report: Report;
  showExpanded?: boolean;
}

const Results = ({ report, showExpanded, id }: ResultsProps) => {
  const t = useTranslations('results');

  return (
    <div className='overflow-y-hidden'>
      <div className=' flex items-center justify-center print:hidden h-screen pb-[30vh] '>
        <div className='bg-white p-10 rounded-lg shadow-lg text-center w-full max-w-md'>
          <h1 className='text-3xl font-bold mb-6 text-gray-800'>Thank You!</h1>
          <p className='text-gray-600 mb-8'>
            Thank you for completing the personality test. We hope you found it
            insightful and helpful.
          </p>
          <button className='bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-700 transition duration-300'>
            Download Your Results
          </button>
          <div className='flex mt-5 justify-end w-full gap-x-1'>
            <ShareBar report={report} id={id} />
          </div>
        </div>
      </div>
      {/* show the bottom code only in the print, and the above code in only in normal view */}

      <div id='pdf-content' className=''>
        <div className='flex'>
          <div className='flex-grow'>
            <ReportLanguageSwitch
              language={report.language}
              availableLanguages={report.availableLanguages}
            />
          </div>
          <Chip>{new Date(report.timestamp).toLocaleDateString()}</Chip>
        </div>
        <div className='text-center mt-4'>
          <span className='font-bold'>{t('important')}</span> &nbsp;
          {t('saveResults')} &nbsp;
          <Link href={`/compare/?id=${report.id}`} className='underline'>
            {t('compare')}
          </Link>{' '}
          &nbsp;
          {t('toOthers')}
        </div>
        <div className='flex mt-4'>
          <Snippet
            hideSymbol
            color='danger'
            className='w-full justify-center'
            size='lg'
          >
            {report.id}
          </Snippet>
        </div>
        <div className='flex mt-5 justify-end w-full gap-x-1'>
          <ShareBar report={report} id={id} />
        </div>
        <div className='flex mt-10'>
          <h1 className={title()}>{t('theBigFive')}</h1>
        </div>
        <BarChart max={120} results={report.results} />
        <DomainTabs
          results={report.results}
          showExpanded={!!showExpanded}
          scoreText={t('score')}
        />
      </div>
    </div>
  );
};
