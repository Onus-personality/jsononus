'use server';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { compress } from 'compress-pdf'; 
import puppeteer from 'puppeteer';

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
import compressPDF from 'pdf-compressor'
import { PDFDocument } from 'pdf-lib'; 
// Function to read and replace placeholders in the email template
// const getEmailTemplate = (userName: string, userEmail: string): string => {
// const templatePath = path.join(__dirname, '../lib/emailTemplate.html');
//   const template = fs.readFileSync(templatePath, 'utf8');

//   // Replace placeholders
//   return template
//     .replace('{{userName}}', userName)
//     .replace('{{userEmail}}', userEmail);
// };
const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Results</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
    }
    p {
      color: #555;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 0.9em;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello, {{userName}}!</h1>
    <p>We have attached your test results in the PDF document below.</p>
    <p>If you have any questions or need further assistance, feel free to reply to this email.</p>
    <p>Best regards,<br>Your Company Team</p>
    <div class="footer">
      <p>This email was sent to {{userEmail}}</p>
    </div>
  </div>
</body>
</html>
`;
const collectionName = process.env.DB_COLLECTION || 'results';
const resultLanguages = getInfo().languages;

export type Report = {
  id: string;
  timestamp: number;
  availableLanguages: Language[];
  language: string;
  results: Domain[];
  name: string,
  email: string
};

// ==========================================


export async function createPDF(id: string) {
  let browser;

  try {
    browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Use an environment variable for the base URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Navigate to the current page
    await page.goto(`${baseUrl}/result/${id}`, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 90000
    });

    // Get the current URL
    const url = await page.url();

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });

    return pdf;
  } catch (error) {
    console.error('Error creating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function sendEmail(pdfBuffer: Buffer, user) {
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

  await transporter.sendMail(mailOptions);
}
export async function sendPDF(id:string, user) {
  try {
    const pdfBuffer = await createPDF(id);
    await sendEmail(pdfBuffer, user);
    return { success: true };
  } catch (error) {
    console.error('Error sending PDF:', error);
    return { success: false, error: 'Failed to send PDF' };
  }
}
// ========================


export async function getTestResult(
  id: string,
  language?: string
): Promise<Report | undefined> {
  'use server';
  try {
    const query = { _id: new ObjectId(id) };
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);
    const report = await collection.findOne(query);
    console.log('report123',report)
    if (!report) {
      console.error(`The test results with id ${id} are not found!`);
      throw new B5Error({
        name: 'NotFoundError',
        message: `The test results with id ${id} is not found in the database!`
      });
    }
    const selectedLanguage =
      language ||
      (!!resultLanguages.find((l) => l.id == report.lang) ? report.lang : 'en');
    const scores = calculateScore({ answers: report.answers });
    const results = generateResult({ lang: selectedLanguage, scores });
    return {
      id: report._id.toString(),
      timestamp: report.dateStamp,
      availableLanguages: resultLanguages,
      language: selectedLanguage,
      results,
      name: report.name,
      email: report.email,
    };
  } catch (error) {
    if (error instanceof B5Error) {
      throw error;
    }
    throw new Error('Something wrong happend. Failed to get test result!');
  }
}

export async function saveTest(testResult: DbResult) {
  'use server';
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
  'use server';
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
