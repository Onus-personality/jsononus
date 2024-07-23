'use client';

import React, { createContext, useState } from 'react';
import { NextUIProvider } from '@nextui-org/react'; // Make sure this import is correct
import { useRouter } from 'next/navigation'; // Update this import
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';

// Define the user context type
type UserContextType = {
  user: { name: string; email: string };
  touched: { name: boolean; email: boolean };
  setUser: React.Dispatch<
    React.SetStateAction<{ name: string; email: string }>
  >;
  setTouched: React.Dispatch<
    React.SetStateAction<{ name: boolean; email: boolean }>
  >;
};

// Create the context
//@ts-ignore
export const UserContext = createContext();

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const [user, setUser] = useState({ name: '', email: '' });
  const [touched, setTouched] = useState({ name: true, email: true });

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <UserContext.Provider value={{ user, setUser, touched, setTouched }}>
          {children}
        </UserContext.Provider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
