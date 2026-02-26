# GymBot AI Agent Instructions

These are the core programming rules and global instructions for the AI working on the GymBot project.

## UI and Design Rules
1. **Readable Color Contrast**: Never use low-contrast text combinations (e.g., light gray text on a white background). All user input fields, buttons, and text must be clearly readable by human standards. Always verify contrast ratios when applying Tailwind or CSS color classes.

## Architecture & Build Rules
2. **Widget Script Distribution**: The `demos/fitbot-react-demo` site serves the chatbot widget via a static JavaScript file (`gymbot.min.js`). When you make changes to the widget source code (`fitbot-widget/src`), you MUST build the widget (`npm run build` in `fitbot-widget`), and then manually copy the resulting `dist/gymbot.min.js` file into `demos/fitbot-react-demo/public/gymbot.min.js`. Otherwise, the React demo site will not reflect your changes.
