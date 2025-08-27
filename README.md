# Workout Timer App

A Hebrew-language mobile workout timer application built with React.js.

## Features

- ✅ Hebrew interface with RTL support
- ✅ Exercise timer with visual and audio feedback
- ✅ Progress tracking through exercises, sets, and repetitions
- ✅ Mobile-responsive design
- ✅ Exercise instructions display
- ✅ Customizable timing settings
- ✅ Skip and reset functionality

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Create the project directory:**
   ```bash
   mkdir workout-timer
   cd workout-timer
   ```

2. **Initialize React app:**
   ```bash
   npx create-react-app . --template typescript
   ```

3. **Install additional dependencies:**
   ```bash
   npm install lucide-react
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

4. **Copy all the files** from the artifacts above into their respective locations

5. **Start the development server:**
   ```bash
   npm start
   ```

## Project Structure

```
workout-timer/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── WorkoutTimer.js
│   ├── data/
│   │   └── workoutData.js
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   └── reportWebVitals.js
├── package.json
├── tailwind.config.js
└── README.md
```

## How to Save Files

### Step-by-Step Setup:

1. **Create the main directory:**
   ```bash
   mkdir workout-timer
   cd workout-timer
   ```

2. **Create the folder structure:**
   ```bash
   mkdir public src src/components src/data
   ```

3. **Copy each file** from the artifacts above:
   - Copy `package.json` to root directory
   - Copy `public/index.html` to `public/` folder
   - Copy `src/App.js` to `src/` folder
   - Copy `src/App.css` to `src/` folder
   - Copy `src/index.js` to `src/` folder
   - Copy `src/index.css` to `src/` folder
   - Copy `src/reportWebVitals.js` to `src/` folder
   - Copy `src/components/WorkoutTimer.js` to `src/components/` folder
   - Copy `src/data/workoutData.js` to `src/data/` folder
   - Copy `tailwind.config.js` to root directory

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the app:**
   ```bash
   npm start
   ```

## Deployment Options

### Option 1: Netlify (Recommended for beginners)
1. Build the project: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `build` folder to deploy

### Option 2: Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Connect your GitHub repository
4. Deploy automatically

### Option 3: GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts:
   ```json
   "homepage": "https://yourusername.github.io/workout-timer",
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
3. Deploy: `npm run deploy`

### Option 4: Mobile App (PWA)
The app is already PWA-ready. Users can install it on their phones:
1. Open the app in mobile browser
2. Look for "Add to Home Screen" option
3. Install as native-like app

## Customization

### Adding New Exercises
Edit `src/data/workoutData.js` to add new exercises:

```javascript
{
  "id": 9,
  "name": "תרגיל חדש",
  "repetitions": 10,
  "sets": 3,
  "instructions": "הוראות לתרגיל החדש"
}
```

### Changing Timing Settings
Modify the global settings in `workoutData.js`:
- `global_rest_between_exercises`: Rest time between exercises (seconds)
- `global_rest_between_reps`: Rest time between repetitions (seconds)  
- `global_rep_duration`: Duration of each repetition (seconds)

## Browser Compatibility
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Mobile Support
- iOS Safari 12+
- Android Chrome 60+
- Responsive design for all screen sizes

## License
MIT License - feel free to use and modify