# 🧠 DumpIt — Brain Dump In. Task Board Out.

**DumpIt turns a messy, spoken brain dump into an organized task board, right in your browser.**

Just talk the way your brain actually works: unfiltered, out of order, full of "okay so" and "um". DumpIt removes the filler, splits it into clean tasks, picks up deadlines, and sorts everything into **Urgent**, **Work**, and **Personal**.

> 🎙️ **Built 100% by voice.** Every part of this project was created by speaking, using **Wispr Flow** .

🔗 **Live demo:** https://dumpit-seven.vercel.app/


---

## 👩‍💻 About Me

**Darshita Lodh** · Team Synergy
TY B.Sc. (AI) Student
Participant, **Goa Hackathon**

GitHub: [@darshita-builds](https://github.com/darshita-builds)

---

## 🏆 The Challenge

This project was built for the **Goa Hackathon**, as part of the **Wispr Flow Shortlisting Task**.

**Goal:** build any working technical project **entirely using your voice** with Wispr Flow, and show how effectively voice-driven development can turn an idea into a working product.

I chose to build a voice app *with* my voice: a tool that takes the chaos of spoken thoughts and turns it into a plan.

---

## 💡 What Makes DumpIt Different

- **Understands real speech.** No robotic one-command-at-a-time input. Ramble naturally, filler words and all.
- **Shows its work.** A visible 5-step pipeline lets you watch your thoughts become a plan.
- **Voice in, voice out.** It listens to your mess, then reads your plan back to you.
- **Fully private.** No AI API, no backend, no sign-up. Everything stays in your browser.

---

## ✨ Features

### 🎤 Capture
- **Tap to talk:** live transcript while you speak; keeps listening through pauses until you stop
- **Type instead:** the same box accepts typed text
- **Try an example:** fills in a sample brain dump instantly

### 🪄 Turn It Into a Plan (5 Steps)
| Step | What it does |
|---|---|
| **1. Remove filler words** | Strips "okay so", "um", "I need to" for clean titles |
| **2. Split my speech into tasks** | Breaks at *and*, *also*, *then* and punctuation, without breaking times like *5.30pm* |
| **3. Detect deadlines as date badges** | Understands *tomorrow*, *Friday*, *next week*, *by 5pm* |
| **4. Sort into Work, Personal & Urgent** | Keyword-based categorization |
| **5. Drag, edit, complete & delete** | Full control over every task |

Run each step one by one to see how it works, or click **Do it all** to run every step at once.

### 🗂️ Task Board
- Three columns: **Urgent**, **Work**, **Personal**
- Drag tasks between columns, edit, tick done, and delete
- 🎉 **Confetti** when you complete a task
- Overdue deadlines in red, upcoming ones in amber

### 📊 Progress Bar
- Progress tracker with done count and percentage
- Live counters: **open**, **urgent**, **due today**, **overdue**
- **Clear completed** and **Start over**
- 🔊 **Read my plan:** speaks a short summary of your tasks aloud

### 💾 Private & Persistent
- Saved automatically in your browser (localStorage)
- No accounts, no servers, no API keys

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Voice input | Web Speech API (browser built-in) |
| Voice output | speechSynthesis API (browser built-in) |
| Date parsing | chrono-node |
| Drag and drop | dnd-kit |
| Icons | lucide-react |
| Celebrations | canvas-confetti |
| Storage | localStorage |
| Hosting | Vercel |
| **Built with** | **Wispr Flow + Claude Code in VS Code** |

---



## 🚀 Run It Locally

**Requirements:** Node.js 18+ and Chrome or Edge (Firefox does not support the Web Speech API; use the typing box there).

```bash
git clone https://github.com/darshita-builds/Dumpit.git
cd Dumpit
npm install
npm run dev
```

Open **http://localhost:5173** and allow microphone access.

> 💡 **Windows PowerShell:** if you see *"running scripts is disabled"*, use `npm.cmd install` and `npm.cmd run dev`.

---

## ☁️ Deploy on Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project**
3. Import this repository and click **Deploy**

No configuration or environment variables needed; Vercel detects Vite automatically.

---

## 🗣️ Try Saying

> So I need to email the client by Friday, and fix the login bug ASAP, then prepare the report for next week’s meeting, and buy groceries.

Then click **Do it all** and watch it become a plan.

---

## 🙏 Acknowledgements

- **[Wispr Flow](https://wisprflow.ai)** for making voice-first development possible
- **Goa Hackathon** for the challenge

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

<p align="center"><b>Made with 🎙️ voice by Darshita Lodh · Team Synergy · Goa Hackathon</b></p>
