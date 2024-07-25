'use client';

import { Button, Tooltip } from '@nextui-org/react';
import { CopyIcon, FacebookIcon, PDFIcon, TwitterIcon } from './icons';
import { Link as NextUiLink } from '@nextui-org/link';
import { Report } from '@/actions/index';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
//@ts-ignore
import html2pdf from 'html2pdf.js';
import { useContext, useEffect, useRef, useState } from 'react';

interface ShareBarProps {
  report: Report;
  id: string;
} // components/GeneratePdf.tsx

import { jsPDF } from 'jspdf';

export default function ShareBar({ report, id }: ShareBarProps) {
  // const [emailSent, setEmailSent] = useState(false);
  const pdfSent = useRef(false);

  const [_, copy] = useCopyToClipboard();

  const handleCopy = (text: string) => async () => await copy(text);
  // const waitForImages = () => {
  //   const images = document.querySelectorAll('img');
  //   return Promise.all(
  //     Array.from(images)
  //       .filter((img) => !img.complete)
  //       .map(
  //         (img) =>
  //           new Promise((resolve) => {
  //             img.onload = img.onerror = resolve;
  //           })
  //       )
  //   );
  // };

 
  return (
    <>
      <Tooltip color='secondary' content='Share on facebook'>
        <Button
          isIconOnly
          aria-label='Share on facebook'
          radius='full'
          size='md'
          variant='light'
          as={NextUiLink}
          isExternal
          href={`https://www.facebook.com/sharer/sharer.php?u=https://bigfive-test.com/result/${report.id}`}
        >
          <FacebookIcon size={48} />
        </Button>
      </Tooltip>
      <Tooltip color='secondary' content='Share on X'>
        <Button
          isIconOnly
          aria-label='Share on X'
          radius='full'
          size='md'
          variant='light'
          target='_blank'
          as={NextUiLink}
          href={`https://twitter.com/intent/tweet?text=See my personality traits!&url=https://bigfive-test.com/result/${report.id}`}
        >
          <TwitterIcon size={42} />
        </Button>
      </Tooltip>
      <Tooltip color='secondary' content='Download PDF'>
        <Button
          isIconOnly
          aria-label='Download pdf'
          radius='full'
          size='md'
          variant='light'
          onPress={() => window.print()}
        >
          <PDFIcon size={32} />
        </Button>
      </Tooltip>
      <Tooltip color='secondary' content='Copy link'>
        <Button
          isIconOnly
          aria-label='Copy link'
          radius='full'
          size='md'
          variant='light'
          onPress={handleCopy(`https://bigfive-test.com/result/${report.id}`)}
        >
          <CopyIcon size={42} />
        </Button>
      </Tooltip>
    </>
  );
}
