import { GoogleGenerativeAI } from '@google/generative-ai';
try {
  const genAI = new GoogleGenerativeAI('');
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
