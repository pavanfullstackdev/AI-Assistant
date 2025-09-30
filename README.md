# 💬 AI Assistant (React + Gemini API)

This is a **chat application** built with **React, TailwindCSS, and shadcn/ui** that integrates with **Google’s Gemini API**.  
It supports multiple conversations, typewriter-style AI responses, tooltips on sidebar actions, and persistent chat history using `localStorage`.

---

## 🚀 Features

- ⚡ **Google Gemini API Integration** – fetches available models and uses the latest Gemini model for AI responses.  
- 💬 **Chat with AI** – send messages and get responses with a smooth **typewriter effect**.  
- 📝 **Persistent Conversations** – conversations are saved in `localStorage` so you don’t lose history on refresh.  
- 📂 **Sidebar with Conversations** – switch between multiple chats, rename or delete conversations.  
- 🎨 **Beautiful UI** – TailwindCSS + gradients + subtle animations.  
- 🛠️ **Tooltips** – edit and delete icons show helpful tooltips using `shadcn/ui`.  
- ⌨️ **Keyboard Shortcuts** – `Enter` to send, `Shift + Enter` for a new line.  
- 📱 **Responsive Layout** – sidebar can be toggled on/off for smaller screens.  

---

## 🛠️ Tech Stack

- **React 18**  
- **TailwindCSS** (for styling)  
- **shadcn/ui** (for tooltip + UI components)  
- **Lucide-react** (for icons)  
- **Google Gemini API**  

---

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-assistant.git
   cd ai-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your Gemini API Key**

   Open `App.jsx` and replace the `API_KEY`:
   ```js
   const API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY";
   ```

   You can generate one from the [Google AI Studio](https://aistudio.google.com/).

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📌 Usage

- Click **New Chat** to start a fresh conversation.  
- Type your query in the input box and press **Enter**.  
- Use **Shift + Enter** to add a new line without sending.  
- Sidebar shows your saved chats – click to load them.  
- Hover over a conversation to **Edit** (✏️) or **Delete** (🗑️).  
- Sidebar can be toggled with the ☰ menu button.  

---

## 📂 Project Structure

```
src/
 ├─ components/
 │   └─ ui/tooltip.jsx       # shadcn/ui Tooltip component
 ├─ App.jsx                  # Main application
 ├─ main.jsx                 # React entry point
 └─ index.css                # TailwindCSS styles
```

---

## 🔮 Future Improvements

- ✅ Rename conversation titles  
- ✅ Dark mode support  
- ✅ Export conversation as text/markdown  
- ✅ Support for multiple AI models selection  

---

## 📜 License
© 2025 Pavan Birari
https://pavanbirari.netlify.app/
