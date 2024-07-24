'use server';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import os from 'os';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { connectToDatabase } from '@/db';
import { ObjectId } from 'mongodb';
import { B5Error, DbResult, Feedback } from '@/types';
import calculateScore from '@bigfive-org/score';
import generateResult, {
  getInfo,
  Language,
  Domain
} from '@bigfive-org/results';
import nodemailer from 'nodemailer';
import { transporter } from '@/config/nodemailer';
import compressPDF from 'pdf-compressor';

const template = `...`;

const collectionName = process.env.DB_COLLECTION || 'results';
const resultLanguages = getInfo().languages;

export type Report = {
  id: string;
  timestamp: number;
  availableLanguages: Language[];
  language: string;
  results: Domain[];
  name: string;
  email: string;
};

export async function createPDF(id: string) {
  let browser;
  try {
    console.log('Preparing to launch browser...');

    // Remove the line that tries to add fonts from a non-existing path
    // await chromium.font('/var/task/web/.next/server/bin/chromium/fonts');

    const executablePath = await chromium.executablePath;
    console.log('Executable path:', executablePath);

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    });
    console.log('Browser launched successfully');

    const page = await browser.newPage();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/result/${id}`;
    console.log(`Navigating to ${url}`);

    await page.goto(url, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 90000
    });

    console.log('Page loaded, generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    console.log('PDF generated successfully');

    return pdf;
  } catch (error) {
    console.error('Error in createPDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

export async function sendEmail(pdfBuffer: Buffer, user) {
  console.log('Setting up email transporter...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: 'Your Results PDF',
    html: `
    <html>
      <body>
        <h2>User Name: ${user.name},</h2>
        <h2>Email: ${user.email}</h2>
      </body>
    </html>
    `,
    attachments: [
      {
        filename: 'results.pdf',
        content: pdfBuffer
      }
    ]
  };

  console.log('Sending email...');
  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully');
}

export async function sendPDF(id: string, user) {
  try {
    console.log(`Starting PDF creation for id: ${id}`);
    const pdfBuffer = await createPDF(id);
    console.log(`PDF created successfully for id: ${id}`);

    console.log(`Attempting to send email for user: ${user.email}`);
    await sendEmail(pdfBuffer, user);
    console.log(`Email sent successfully to: ${user.email}`);

    return { success: true };
  } catch (error) {
    console.error('Error in sendPDF:', error);
    return { success: false, error: error.message };
  }
}

export async function getTestResult(
  id: string,
  language?: string
): Promise<Report | undefined> {
  try {
    const query = { _id: new ObjectId(id) };
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    const report = await collection.findOne(query);
    console.log('report123', report);
    if (!report) {
      console.error(`The test results with id ${id} are not found!`);
      throw new B5Error({
        name: 'NotFoundError',
        message: `The test results with id ${id} is not found in the database!`
      });
    }
    const selectedLanguage =
      language ||
      (resultLanguages.find((l) => l.id == report.lang) ? report.lang : 'en');
    const scores = calculateScore({ answers: report.answers });
    const results = generateResult({ lang: selectedLanguage, scores });
    return {
      id: report._id.toString(),
      timestamp: report.dateStamp,
      availableLanguages: resultLanguages,
      language: selectedLanguage,
      results,
      name: report.name,
      email: report.email
    };
  } catch (error) {
    if (error instanceof B5Error) {
      throw error;
    }
    throw new Error('Something wrong happened. Failed to get test result!');
  }
}

export async function saveTest(testResult: DbResult) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(testResult);
    return { id: result.insertedId.toString() };
  } catch (error) {
    console.error(error);
    throw new B5Error({
      name: 'SavingError',
      message: 'Failed to save test result!'
    });
  }
}

export type FeebackState = {
  message: string;
  type: 'error' | 'success';
};

export async function saveFeedback(
  prevState: FeebackState,
  formData: FormData
): Promise<FeebackState> {
  const feedback: Feedback = {
    name: String(formData.get('name')),
    email: String(formData.get('email')),
    message: String(formData.get('message'))
  };
  try {
    const db = await connectToDatabase();
    const collection = db.collection('feedback');
    await collection.insertOne({ feedback });
    return {
      message: 'Sent successfully!',
      type: 'success'
    };
  } catch (error) {
    return {
      message: 'Error sending feedback!',
      type: 'error'
    };
  }
}
