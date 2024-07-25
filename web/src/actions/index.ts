'use server';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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



export async function sendEmail(
  dataArray: Domain[],
  user: { name: string; email: string }
) {
  console.log('Setting up email transporter...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Function to safely stringify object values
  const safeStringify = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  };

  // Convert the array of objects to a formatted HTML string
  const dataHtml = dataArray
    .map(
      (item) => `
    <tr>
      ${Object.entries(item)
        .map(([key, value]) => `<td>${safeStringify(value)}</td>`)
        .join('')}
    </tr>
  `
    )
    .join('');
  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: 'Results',
    html: `
    <html>
      <body>
        <h2>User Name: ${user.name}</h2>
        <h2>Email: ${user.email}</h2>
        <h3>Data Table:</h3>
        <table border="1">
          <thead>
            <tr>
              ${Object.keys(dataArray[0])
                .map((key) => `<th>${key}</th>`)
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${dataHtml}
          </tbody>
        </table>
        <p>The data is also attached as a JSON file.</p>
      </body>
    </html>
    `,
    attachments: [
      {
        filename: 'data.json',
        content: JSON.stringify(dataArray, null, 2),
        contentType: 'application/json'
      }
    ]
  };

  console.log('Sending email...');
  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully');
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
