
# 🧠 Project Name
**Universal Cone Challenge**

---

## 🎯 Core Objective
Build a web-based voice training simulation app for orthopedic sales reps. Users engage in a role-play with an AI-simulated surgeon, receive transcript-based scoring, and actionable feedback. No login or authentication required.

---

## 🌐 Platform & Environment
- **Platform:** Web (browser-based)  
- **Hosting:** Publicly accessible URL  
- **Connectivity:** Online  
- **Frontend:** Simple, clean UI  
- **Voice:** Browser-based voice input  
- **Speech-to-text:** Required  
- **AI Capabilities:**  
  - AI-powered surgeon role-play  
  - AI-generated scoring and feedback

---

## 🧩 Functional Requirements

### 👤 User Flow
1. Open public app URL  
2. Enter name (no account)  
3. See title “Universal Cone Challenge” and scenario overview  
4. Voice-based simulation starts with orthopedic surgeon  
5. Dialogue stages:  
   - Introduction  
   - Discovery  
   - Surgeon follow-up questions (rotated from a fixed pool)  
   - Product positioning  
   - Closing  
6. Capture and transcribe all user speech  
7. Score conversation out of 100  
8. Provide:
   - Sectional score breakdown  
   - Strengths and improvement areas  
9. Options to:
   - Retry scenario  
   - Download/email feedback

---

## 🧑‍⚕️ Scenario Definition (v1 Fixed)
**Surgeon Profile:**  
- Fellowship-trained orthopedic surgeon  
- 20–25 revision TKAs/year  
- Uses Zimmer knees, Stryker cones  
- Preferences: ream-only techniques; dislikes broaching/hand-burring  
- Open to Zimmer TM cones, currently using Stryker  
- Competitive focus: Zimmer vs Stryker cones  
- Cone usage: ~65–70% tibial, ~10% femoral

---

## 🧠 AI Role-Play Requirements
- Surgeon must:
  - Respond contextually to user  
  - Ask 2–3 follow-up questions per session from a rotating question pool  
- Questions must challenge:
  - Differentiation vs Stryker  
  - Technique  
  - Workflow simplicity  
  - Clinical decision-making

---

## 📚 Knowledge Base & Evaluation Logic
Structure the knowledge base by conversation phase:  
1. Introduction  
2. Discovery  
3. Objection handling  
4. Product positioning  
5. Surgeon preference tailoring  
6. Closing

Each section must include:
- Required concepts  
- Ideal behaviors  
- Competitive points vs Stryker  
- Examples of strong vs weak answers

**Scoring:**
- Total score: 100  
- Criteria:
  - Content relevance  
  - Accuracy  
  - Competitive clarity  
  - Tailoring  
  - Closing effectiveness

---

## 📝 Feedback & Logging
**User-Facing:**  
- Total score  
- Sectional breakdown  
- Strengths and improvements  

**Admin-Facing Logging:**  
- Rep name  
- Full transcript  
- Score  
- Feedback summary

---

## 💾 Data Storage (v1 Scope Only)
- Store transcripts, scores, and feedback  
- No audio storage  
- Lightweight file or local DB-based structure

---

## 🔧 Technical Constraints
- No auth system  
- Name entry only  
- Web app only  
- Voice-to-text  
- AI role-play logic  
- AI scoring  
- Simple, readable architecture

---

## 🎨 Design Priorities
1. End-to-end working prototype  
2. Deterministic scoring  
3. Clear separation of:
   - Role-play logic  
   - Knowledge base  
   - Scoring module  
4. Future extensibility (but don’t implement extras yet)

---

## 🚫 Out of Scope (for v1)
- Audio file storage  
- User accounts  
- Analytics or dashboards  
- Multi-scenario logic  
- Complex UI polish

---

## ✅ Deliverables
- Working web app  
- Clear code structure  
- Inline comments  
- Ready for iteration in v2

---

## 🧭 Ambiguity Rule
If something is unclear:
- Prefer simplicity  
- If blocking, ask  
- Otherwise, make a reasonable decision and proceed
