const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OFFICIAL_EMAIL = "pearl0930.be23@chitkara.edu.in";

app.use(helmet());
app.use(cors());
app.use(express.json());

function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

function filterPrimes(arr) {
  return arr.filter(isPrime);
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function computeHCF(arr) {
  return arr.reduce((acc, val) => gcd(acc, val));
}

function computeLCM(arr) {
  return arr.reduce((acc, val) => lcm(acc, val));
}
async function askAI(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Answer the following question in exactly ONE word. Do not add any punctuation, explanation, or extra text. Just one word.\n\nQuestion: ${question}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  return text;
}

function isPositiveInteger(val) {
  return Number.isInteger(val) && val > 0;
}

function isIntegerArray(val) {
  return Array.isArray(val) && val.length > 0 && val.every((v) => Number.isInteger(v));
}

function isPositiveIntegerArray(val) {
  return Array.isArray(val) && val.length > 0 && val.every((v) => Number.isInteger(v) && v > 0);
}

app.get("/health", (_req, res) => {
  return res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        is_success: false,
        error: "Request body must be a valid JSON object",
      });
    }

    const VALID_KEYS = ["fibonacci", "prime", "lcm", "hcf", "AI"];
    const presentKeys = Object.keys(body).filter((k) => VALID_KEYS.includes(k));

    if (presentKeys.length === 0) {
      return res.status(400).json({
        is_success: false,
        error: "Request must contain exactly one key: fibonacci, prime, lcm, hcf, or AI",
      });
    }

    if (presentKeys.length > 1) {
      return res.status(400).json({
        is_success: false,
        error: "Request must contain exactly one key: fibonacci, prime, lcm, hcf, or AI",
      });
    }

    const key = presentKeys[0];
    const value = body[key];
    let data;

    switch (key) {
      case "fibonacci": {
        if (!isPositiveInteger(value)) {
          return res.status(400).json({
            is_success: false,
            error: "fibonacci value must be a positive integer",
          });
        }
        data = fibonacci(value);
        break;
      }

      case "prime": {
        if (!isIntegerArray(value)) {
          return res.status(400).json({
            is_success: false,
            error: "prime value must be a non-empty array of integers",
          });
        }
        data = filterPrimes(value);
        break;
      }

      case "lcm": {
        if (!isPositiveIntegerArray(value)) {
          return res.status(400).json({
            is_success: false,
            error: "lcm value must be a non-empty array of positive integers",
          });
        }
        data = computeLCM(value);
        break;
      }

      case "hcf": {
        if (!isPositiveIntegerArray(value)) {
          return res.status(400).json({
            is_success: false,
            error: "hcf value must be a non-empty array of positive integers",
          });
        }
        data = computeHCF(value);
        break;
      }

      case "AI": {
        if (typeof value !== "string" || value.trim().length === 0) {
          return res.status(400).json({
            is_success: false,
            error: "AI value must be a non-empty string",
          });
        }
        data = await askAI(value);
        break;
      }
    }

    return res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (err) {
    console.error("POST /bfhl error:", err.message);
    return res.status(500).json({
      is_success: false,
      error: "Internal server error",
    });
  }
});

app.use((_req, res) => {
  return res.status(404).json({
    is_success: false,
    error: "Route not found",
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BFHL API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
