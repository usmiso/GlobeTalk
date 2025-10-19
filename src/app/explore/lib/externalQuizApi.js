// Simple utility for Language Quiz API integration (evidence of attempted implementation)
const BASE_URL = "https://language-quiz-api.onrender.com/api/v1";

// Fetch quiz categories
export async function fetchQuizCategories() {
  const res = await fetch(`${BASE_URL}/quizzes/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// Fetch all quizzes
export async function fetchAllQuizzes() {
  const res = await fetch(`${BASE_URL}/quizzes`);
  if (!res.ok) throw new Error("Failed to fetch quizzes");
  return res.json();
}

// Preview a quiz session
export async function previewQuizSession(id) {
  const res = await fetch(`${BASE_URL}/quiz-sessions/preview/${id}`);
  if (!res.ok) throw new Error("Failed to preview quiz session");
  return res.json();
}

// (Optional) Example: fetch with headers
export async function fetchQuizzesWithHeaders(studentId, userId) {
  const res = await fetch(`${BASE_URL}/quizzes`, {
    headers: {
      "X-Student-ID": studentId || "",
      "X-User-ID": userId || ""
    }
  });
  if (!res.ok) throw new Error("Failed to fetch quizzes with headers");
  return res.json();
}