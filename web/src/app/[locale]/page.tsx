import { useTranslations } from 'next-intl';
import { Link } from '@nextui-org/link';
import { button as buttonStyles } from '@nextui-org/theme';
import { title, subtitle } from '@/components/primitives';
import clsx from 'clsx';
import { FeaturesGrid } from '@/components/features-grid';
import {
  ExperimentIcon,
  GithubIcon,
  LanguageIcon,
  LogosOpensource,
  MoneyIcon,
  PlusLinearIcon
} from '@/components/icons';
import { ArrowRightIcon } from '@/components/icons';
import { siteConfig } from '@/config/site';
import { compareDesc } from 'date-fns';
import { allPosts } from 'contentlayer/generated';
import { PostCard } from '@/components/post-card';
import { SonarPulse } from '@/components/sonar-pulse';
import { Button } from '@nextui-org/button';
import { unstable_setRequestLocale } from 'next-intl/server';
import { Chip, Tooltip } from '@nextui-org/react';
import NextLink from 'next/link';
import { Translated } from '@/components/translated';
import Form from '@/components/Form';
import { useContext, useState } from 'react';
import { UserContext } from '../providers';
import StartTestBtn from '@/components/StartTestBtn';
interface Props {
  params: { locale: string };
}

export default function Home({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('frontpage');
  const f = useTranslations('facets');
 

  const posts = allPosts
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 3);

  const features = [
    {
      title: t('cards.open.title'),
      description: t('cards.open.text'),
      icon: LogosOpensource({})
    },
    {
      title: t('cards.free.title'),
      description: t('cards.free.text'),
      icon: MoneyIcon({})
    },
    {
      title: t('cards.scientific.title'),
      description: t('cards.scientific.text'),
      icon: ExperimentIcon({})
    },
    {
      title: t('cards.translated.title'),
      description: t.raw('cards.translated.text'),
      icon: LanguageIcon({}),
      href: 'https://b5.translations.alheimsins.net/'
    }
  ];

  const titleDescription = t.rich('description.top', {
    violet: (chunks) => (
      <span className={title({ color: 'violet' })}>{chunks}</span>
    )
  });

  const testsTaken = t.rich('tests_taken', {
    green: (chunks) => (
      <span className={title({ color: 'green' })}>{chunks}</span>
    ),
    n: '4.000.000'
  });

  return (
    <section className='flex flex-col items-center justify-center h-screen pb-[40vh] '>
      <div className='flex relative z-20 flex-col gap-12 w-[75%]  xl:mt-10'>
        <div className='text-center justify-center mt-10'>
          <h1 className={`${title()} leading-tight`} style={{fontSize:35, lineHeight:1.3}}>{titleDescription}</h1>
          <br />
          <h2 className={subtitle({ class: 'mt-4' })}>
            {t('description.info')}
          </h2>
        </div>
        <Form />
        <div className='flex flex-col md:flex-row items-center gap-4 justify-center'>
          <StartTestBtn>
            {t('call_to_action')} <ArrowRightIcon />
          </StartTestBtn>
        </div>
      </div>

      {/* <div className='font-normal text-default-500 block max-w-full text-center underline'>
        {t('no_registration')}
      </div> */}
    </section>
  );
}
const buildCircle = (list: { name: string; href: string }[]) => {
  const num = list.length; // Number of Avatars
  const radius = 180; // Distance from center
  const start = -90; // Shift start from 0
  const slice = 360 / num;

  return list.map((item, idx) => {
    const rotate = slice * idx + start;
    return {
      name: item.name,
      href: item.href,
      style: {
        transform: `rotate(${rotate}deg) translate(${radius - 20}px) rotate(${-rotate}deg)`,
        width: '195px'
      },
      smallStyle: {
        transform: `rotate(${rotate}deg) translate(${radius - 60}px) rotate(${-rotate}deg)`
      }
    };
  });
};
