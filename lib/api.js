export const fetchQuestions = async () => {
  const res = await fetch('http://localhost:3001/api/questions');
  return res.json();
};
