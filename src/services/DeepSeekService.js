const { OpenAI } = require('openai');

const client = new OpenAI({
  api_key: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

const conversations = new Map(); // kullanıcı başına sohbet geçmişi

const getConversation = (userId) => {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  return conversations.get(userId);
};

const clearConversation = (userId) => {
  conversations.set(userId, []);
};

const askDeepSeek = async (userId, message) => {
  const history = getConversation(userId);
  history.push({ role: "user", content: message });

  // Son 15 mesajı tut (çok uzamasın)
  if (history.length > 15) history.splice(0, history.length - 15);

  try {
    const response = await client.chat.completions.create({
      model: "deepseek-v4-flash",     // istersen deepseek-v4-pro da yazabilirsin
      messages: history,
      temperature: 0.8,
      max_tokens: 2048,
    });

    const reply = response.choices[0].message.content;
    history.push({ role: "assistant", content: reply });

    return reply;
  } catch (error) {
    console.error("DeepSeek Error:", error);
    return "❌ DeepSeek ile bağlantı kurulamadı. Biraz sonra tekrar dene.";
  }
};

module.exports = {
  askDeepSeek,
  clearConversation
};
