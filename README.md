# I Need Links.

> Useful links. Useful tools. One place.

**I Need Links** is a modern web platform designed to make useful websites, government portals, digital services, and document tools easier to discover and access from one place.

Instead of searching through multiple websites every time, i need links brings frequently needed resources together in a clean, organized, and responsive interface.

---

## ✨ Features

### 🏛️ Government Portals

Browse a curated collection of useful government websites and portals organized by category.

- Central Government
- West Bengal Government
- Education
- Banking & Finance
- Identity & Documents
- Transport
- Employment
- Health
- Other useful public services

Search and filter portals quickly without navigating through multiple websites.

---

### ✂️ Smart Card Crop Tools

A browser-based document and ID-card processing toolkit.

Supported workflows include:

- Ration Card
- Voter ID
- Aadhaar
- PAN Card
- Ayushman
- ABC / APAAR
- Multi-ID A4
- A4 Card Position

Features include:

- Automatic card detection
- Manual crop
- Front / Back extraction
- PVC card sizing
- 300 DPI / 600 DPI
- Brightness adjustment
- Contrast adjustment
- Saturation adjustment
- JPG export
- A4 printable output
- 4×6 printable output
- Multiple cards on A4
- Drag and reposition cards

Processing is performed directly in the browser wherever supported.

---

## 🎨 Design

The interface is designed around a simple principle:

> **Make useful things easier to find and use.**

The UI focuses on:

- Clean typography
- Minimal visual clutter
- Responsive layouts
- Light and dark themes
- Bengali-friendly typography
- Accessible navigation
- Modern cards and subtle interactions

The website is fully responsive across:

- 📱 Mobile
- 📱 Tablet
- 💻 Laptop
- 🖥️ Desktop

---

## 🌙 Theme Support

i need links supports both:

- ☀️ Light mode
- 🌙 Dark mode

The interface automatically adapts its backgrounds, cards, borders, typography, and interactive elements to the selected theme.

---

## 🔐 Privacy

Where supported, document processing is performed locally in the browser.

Uploaded documents used by the card tools are processed client-side rather than being intentionally uploaded to a backend server.

This makes the tools suitable for working with sensitive documents while keeping processing within the user's browser.

> Always review the current implementation and browser behavior before relying on any tool for sensitive documents.

---

## 🛠️ Tech Stack

Built using modern web technologies:

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **PDF.js**
- **jsPDF**
- **Lucide Icons**
- **Canvas API**

### Fonts

- **Outfit** — English UI
- **Noto Sans Bengali** — Bengali content

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── card-crop-tools/
│   │   └── page.tsx
│   ├── government/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── CardCrop/
│   ├── Government/
│   ├── Header/
│   ├── Home/
│   └── Providers/
│
├── hooks/
│   ├── useCardCrop.ts
│   └── usePdfProcessor.ts
│
└── lib/
    ├── card-crop/
    └── ...
```
