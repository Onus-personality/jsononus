'use client';

import { UserContext } from '@/app/providers';
import React, { useContext, useEffect, useState } from 'react';

const CustomInput = ({ type, placeholder, value, onChange, isTouched }) => {
  return (
    <div className='relative w-full max-w-md mx-auto my-4'>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className={`w-full py-3 px-4 pl-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          ${isTouched ? 'border-red-500' : ' border-gray-300 '}`}
      />
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
        <svg
          className='h-5 w-5 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M5 12h14M12 5l7 7-7 7'
          />
        </svg>
      </div>
    </div>
  );
};

const Form = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const userContext = useContext(UserContext);
  //@ts-ignore
  const { setUser, touched, setTouched } = userContext;
  useEffect(() => {
    setUser({ name: '', email: '' });
  }, []);
  const handleNameChange = (e) => {
    setName(e.target.value);
    setUser({ name: e.target.value, email }); // Ensure the latest name is set
    setTouched({ name: false, email: touched.email });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setUser({ name, email: e.target.value }); // Ensure the latest email is set
    setTouched({ name: touched.name, email: false });
  };

  return (
    <div className='flex items-center justify-center'>
      <div className='bg-white p-10 rounded-lg shadow-lg w-full max-w-md text-center'>
        <h1 className='text-3xl font-bold mb-6'>Contact Information</h1>
        <CustomInput
          type='text'
          placeholder='Enter your name'
          value={name}
          onChange={handleNameChange}
          isTouched={touched.name}
        />
        <CustomInput
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={handleEmailChange}
          isTouched={touched.email}
        />
      </div>
    </div>
  );
};

export default Form;
