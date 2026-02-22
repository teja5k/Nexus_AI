# AI Aggregator

A production-ready web application to compare responses from multiple AI providers side-by-side.

## Features

- **Parallel Execution**: Queries multiple models simultaneously for minimal latency.
- **Side-by-Side Comparison**: View responses in a clean, scannable dashboard.
- **OOP Architecture**: Modular provider system (Gemini, Groq) for easy extensibility.
- **Token Tracking**: Monitor usage and costs.
- **Real-time Latency**: See exactly how long the model takes to respond.

## Setup

1. **Environment Variables**:
   Create a `.env` file or set the following in your environment:
   - `VITE_GROQ_API_KEY`: Your Groq API key.

2. **Gemini API Key**:
   The Google Gemini API key is entered directly in the application UI.

3. **Installation**:
   ```bash
   npm install
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

## Architecture

- `src/services/providers/`: Contains the provider logic.
  - `base.ts`: Abstract base class for all AI providers.
  - `gemini.ts`: Google Gemini implementation.
  - `groq.ts`: Groq implementation.
- `src/services/aggregator.ts`: Orchestrates execution.
- `src/App.tsx`: Main UI component with sidebar and results dashboard.

## Tech Stack

- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Motion** (for animations)
- **Lucide React** (for icons)
- **Google Generative AI SDK**
