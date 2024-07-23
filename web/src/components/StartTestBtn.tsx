'use client';
import { UserContext } from '@/app/providers';
import clsx from 'clsx';
import { Link } from '@nextui-org/link';
import { useContext } from 'react';
import { button as buttonStyles } from '@nextui-org/theme';

const StartTestBtn = ({ children }) => {
  const { user, touched, setTouched } = useContext(UserContext);
  const isDisabled =
    (user.name === '' || user.email === '') && (touched.name || touched.email);

  function clickHandler(e: React.MouseEvent) {
    if (isDisabled) {
      e.preventDefault();
      return; // Prevent further actions if disabled
    }

    // Update touched state based on user input
    if (user.name) {
      setTouched({ name: false, email: touched.email });
    }
    if (user.email) {
      setTouched({ name: touched.name, email: false });
    }
    if (!user.name && !user.email) {
      setTouched({ name: true, email: true });
    }
  }

  return (
    <Link
      href={!isDisabled ? '/test' : undefined} // Set href to undefined if disabled
      className={clsx(
        buttonStyles({
          color: isDisabled ? 'default' : 'primary',
          radius: 'full',
          variant: 'shadow',
          size: 'lg',
          fullWidth: true
        }),
        'md:w-auto',
        {
          'opacity-50 cursor-not-allowed': isDisabled,
          'hover:opacity-50': isDisabled
        }
      )}
      onClick={clickHandler}
      aria-disabled={isDisabled}
    >
      {children}
    </Link>
  );
};

export default StartTestBtn;
