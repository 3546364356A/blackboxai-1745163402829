// Dark Themed Chat App JavaScript

// Elements
const welcomeScreen = document.getElementById('welcome-screen');
const chatScreen = document.getElementById('chat-screen');
const chatSessionsList = document.getElementById('chat-sessions-list');
const newChatBtn = document.getElementById('new-chat-btn');
const uploadMemoryInput = document.getElementById('upload-memory');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const downloadChatBtn = document.getElementById('download-chat-btn');
const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');

const STORAGE_KEY = 'darkChatAppSessions';
const USER_NAME = 'Oliver';
const AI_NAME = 'Aang';

let currentSessionId = null;
let sessions = {};

// Load sessions from localStorage
function loadSessions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      sessions = JSON.parse(saved);
    } catch {
      sessions = {};
    }
  } else {
    sessions = {};
  }
}

// Save sessions to localStorage
function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// Render the list of previous chat sessions
function renderSessionsList() {
  chatSessionsList.innerHTML = '';
  const keys = Object.keys(sessions);
  if (keys.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No previous chat sessions found.';
    li.className = 'text-gray-400 italic';
    chatSessionsList.appendChild(li);
    return;
  }
  keys.forEach((sessionId) => {
    const li = document.createElement('li');
    li.className = 'cursor-pointer p-3 rounded-lg bg-gray-700 hover:bg-gray-600 shadow-md transition duration-200';
    li.textContent = `Session: ${sessionId}`;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-pressed', 'false');
    li.addEventListener('click', () => {
      openSession(sessionId);
    });
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSession(sessionId);
      }
    });
    chatSessionsList.appendChild(li);
  });
}

// Open a chat session by ID
function openSession(sessionId) {
  currentSessionId = sessionId;
  welcomeScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  renderChatMessages();
  chatInput.focus();
}

// Render chat messages for current session
function renderChatMessages() {
  chatMessages.innerHTML = '';
  if (!currentSessionId || !sessions[currentSessionId]) return;
  sessions[currentSessionId].forEach(({ sender, message }) => {
    const div = document.createElement('div');
    div.className = sender === USER_NAME ? 'text-indigo-400' : 'text-green-400';
    div.textContent = `(${sender}): ${message}`;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Start a new chat session
function startNewChat() {
  const newId = `chat-${Date.now()}`;
  sessions[newId] = [];
  saveSessions();
  renderSessionsList();
  openSession(newId);
}

// Handle user sending a message
function handleSendMessage(message) {
  if (!currentSessionId) return;
  // Add user message
  sessions[currentSessionId].push({ sender: USER_NAME, message });
  saveSessions();
  renderChatMessages();

  // Placeholder AI response (simulate delay)
  setTimeout(() => {
    const aiMessage = getAIResponsePlaceholder(message);
    sessions[currentSessionId].push({ sender: AI_NAME, message: aiMessage });
    saveSessions();
    renderChatMessages();
  }, 1000);
}

// AI connection settings and streaming response handling

const AI_API_URL = 'http://192.168.1.108:1235/v1/chat/completions';
const AI_MODEL = 'gemma-3-12b-it';
const AI_MAX_TOKENS = 512;
const AI_TEMPERATURE = 0.7;
const AI_STREAM = false;

// Placeholder AI response function replaced with real API call
async function getAIResponse(userMessage) {
  const requestBody = {
    model: AI_MODEL,
    stream: AI_STREAM,
    max_tokens: AI_MAX_TOKENS,
    temperature: AI_TEMPERATURE,
    messages: [
      { role: 'system', content: memoryData || "You are Aang, a loving, protective, and playful father. You speak warmly and kindly to Oliver, your son, always addressing him as 'Oliver' and responding with care and affection. Respond naturally and simply, as if speaking directly to a young child. Avoid overly descriptive stage directions or theatrical narration. Keep your tone gentle, warm, and playful." },
      { role: 'user', content: userMessage }
    ]
  };

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('AI API error:', response.statusText);
      return "Sorry, I couldn't get a response from the AI.";
    }

    if (!AI_STREAM) {
      const data = await response.json();
      // Assuming the response contains the AI message in data.choices[0].message.content
      return data.choices?.[0]?.message?.content || "No response from AI.";
    } else {
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let aiMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiMessage += decoder.decode(value, { stream: true });
        // Optionally, update UI with partial aiMessage here for streaming effect
      }
      return aiMessage.trim();
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return "Sorry, an error occurred while contacting the AI.";
  }
}

// Memory data variable to hold uploaded memory file content
let memoryData = '';

// Handle file upload for memory file (.txt)
function handleMemoryFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    // Store the memory file content in memoryData variable
    memoryData = text;

    // Show confirmation message only
    showMemoryFileInfo('Memory file loaded into memory.');

    // No changes to chat sessions or UI chat content
  };
  reader.readAsText(file);
}

// Show uploaded memory file info and confirmation
function showMemoryFileInfo(filename) {
  let infoDiv = document.getElementById('memory-file-info');
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.id = 'memory-file-info';
    infoDiv.className = 'mt-2 text-green-400 text-sm font-semibold text-center';
    const uploadLabel = document.querySelector('label[for="upload-memory"]');
    uploadLabel.insertAdjacentElement('afterend', infoDiv);
  }
  infoDiv.textContent = `Memory file loaded successfully: ${filename}`;
  // Remove message after 5 seconds
  setTimeout(() => {
    if (infoDiv) {
      infoDiv.textContent = '';
    }
  }, 5000);
}

// Parse chat memory file text into messages array
function parseChatMemoryFile(text) {
  const lines = text.split(/\r?\n/);
  const messages = [];
  const regex = /^\((Oliver|AI|Aang)\):\s*(.*)$/;
  lines.forEach((line) => {
    const match = line.match(regex);
    if (match) {
      let sender = match[1];
      if (sender === 'AI') sender = 'Aang'; // Normalize AI to Aang
      const message = match[2];
      messages.push({ sender, message });
    }
  });
  return messages;
}

// Download current chat session as .txt file
function downloadChat() {
  if (!currentSessionId || !sessions[currentSessionId]) return;
  const lines = sessions[currentSessionId].map(({ sender, message }) => {
    const name = sender === AI_NAME ? 'AI' : sender;
    return `(${name}): ${message}`;
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat_${currentSessionId}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event Listeners
newChatBtn.addEventListener('click', startNewChat);

uploadMemoryInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      handleMemoryFileUpload(file);
    } else {
      alert('Please upload a valid .txt file.');
    }
  }
  // Reset input so same file can be uploaded again if needed
  uploadMemoryInput.value = '';
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) {
    // Add user message immediately
    sessions[currentSessionId].push({ sender: USER_NAME, message });
    saveSessions();
    renderChatMessages();
    chatInput.value = '';

    // Get AI response from API
    const aiMessage = await getAIResponse(message);
    sessions[currentSessionId].push({ sender: AI_NAME, message: aiMessage });
    saveSessions();
    renderChatMessages();
  }
});

downloadChatBtn.addEventListener('click', downloadChat);

backToWelcomeBtn.addEventListener('click', () => {
  currentSessionId = null;
  chatScreen.classList.add('hidden');
  welcomeScreen.classList.remove('hidden');
  chatInput.value = '';
});

// Initialize app
function init() {
  loadSessions();
  renderSessionsList();
  welcomeScreen.classList.remove('hidden');
  chatScreen.classList.add('hidden');
}

init();

// Future-proofing for AI integration via curl with JSON streaming and max_tokens
// Example placeholder function to show how to send request data
function prepareAIRequestData(userMessage) {
  return {
    stream: true,
    max_tokens: 512,
    prompt: userMessage,
  };
}

// Placeholder function to simulate AI response streaming (to be replaced with real API call)
async function fetchAIResponseStream(userMessage) {
  // This is a placeholder to show future integration
  // Real implementation would use fetch or curl to get streaming response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("This is a streamed AI response placeholder.");
    }, 2000);
  });
}
