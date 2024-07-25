import { Report, getTestResult } from '@/actions';
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
          <h1 className='text-2xl font-bold mb-6 text-gray-800'>
            {' '}
            Thank you for your time and consideration. Your results have been
            submitted to the Administrator.
          </h1>
        </div>
      </div>
    </div>
  );
};
