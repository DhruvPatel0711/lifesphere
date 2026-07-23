const fs = require('fs');
const path = require('path');

const repoPath = 'd:/SGP/Healthcare-Ai';
const outputFile = 'C:/Users/DHRUV/.gemini/antigravity/brain/ab5faddd-064b-431d-8a96-4b1b9e5ddadc/granular_flow_analysis.md';

const frontendFiles = [
  'frontend/js/app.js',
  'frontend/js/api.js',
  'frontend/js/dashboard.js',
  'frontend/js/records.js',
  'frontend/js/medicine.js',
  'frontend/js/appointments.js',
  'frontend/js/emergency.js',
  'frontend/js/ai-assistant.js',
  'frontend/js/ai-symptom.js',
  'frontend/js/ai-nutrition.js',
  'frontend/js/ai-fitness.js',
  'frontend/js/ai-mental.js',
];

const backendFiles = [
  'backend/app/main.py',
  'backend/app/routers/auth.py',
  'backend/app/routers/dashboard.py',
  'backend/app/routers/medical_records.py',
  'backend/app/routers/medicines.py',
  'backend/app/routers/appointments.py',
  'backend/app/routers/emergency.py',
  'backend/app/routers/ai_assistant.py',
  'backend/app/routers/ai_symptom.py',
  'backend/app/routers/ai_nutrition.py',
  'backend/app/routers/ai_fitness.py',
  'backend/app/routers/ai_mental.py',
];

let mdContent = '# Healthcare-Ai Granular Implementation Flow\\n\\n';
mdContent += 'This document covers the start-to-finish user flows mapped between the frontend vanilla JS and the FastAPI backend.\\n\\n';

function readFileContent(filePath) {
  try {
    return fs.readFileSync(path.join(repoPath, filePath), 'utf8');
  } catch (e) {
    return `Error reading file: ${e.message}`;
  }
}

// 1. Auth Flow
mdContent += '## 1. Authentication Flow\\n';
mdContent += '### Frontend (`app.js` & `api.js`)\\n';
mdContent += '```javascript\\n' + readFileContent('frontend/js/app.js').substring(0, 1500) + '\\n```\\n';
mdContent += '### Backend (`auth.py`)\\n';
mdContent += '```python\\n' + readFileContent('backend/app/routers/auth.py') + '\\n```\\n\\n';

// For each module, get front/back
const modules = [
  { name: 'Dashboard', js: 'frontend/js/dashboard.js', py: 'backend/app/routers/dashboard.py' },
  { name: 'Medical Records', js: 'frontend/js/records.js', py: 'backend/app/routers/medical_records.py' },
  { name: 'Medicines', js: 'frontend/js/medicine.js', py: 'backend/app/routers/medicines.py' },
  { name: 'Appointments', js: 'frontend/js/appointments.js', py: 'backend/app/routers/appointments.py' },
  { name: 'Emergency / SOS', js: 'frontend/js/emergency.js', py: 'backend/app/routers/emergency.py' },
  { name: 'AI Chat Assistant', js: 'frontend/js/ai-assistant.js', py: 'backend/app/routers/ai_assistant.py' },
  { name: 'AI Symptom Checker', js: 'frontend/js/ai-symptom.js', py: 'backend/app/routers/ai_symptom.py' },
  { name: 'AI Nutrition', js: 'frontend/js/ai-nutrition.js', py: 'backend/app/routers/ai_nutrition.py' },
  { name: 'AI Fitness', js: 'frontend/js/ai-fitness.js', py: 'backend/app/routers/ai_fitness.py' },
  { name: 'AI Mental Health', js: 'frontend/js/ai-mental.js', py: 'backend/app/routers/ai_mental.py' }
];

modules.forEach(mod => {
  mdContent += `## ${mod.name} Flow\\n`;
  mdContent += `### Frontend (${mod.js.split('/').pop()})\\n`;
  
  const jsContent = readFileContent(mod.js);
  // Extract key API calls using regex
  const apiCalls = jsContent.match(/API\.(get|post|put|delete)\([^)]+\)/g);
  mdContent += `**API Calls Made:**\n`;
  if (apiCalls) {
    [...new Set(apiCalls)].forEach(call => mdContent += `- \`${call}\`\n`);
  } else {
    mdContent += `- None found\n`;
  }
  
  mdContent += `\\n### Backend (${mod.py.split('/').pop()})\\n`;
  mdContent += '```python\\n' + readFileContent(mod.py) + '\\n```\\n\\n';
});

fs.writeFileSync(outputFile, mdContent);
console.log('Successfully created granular_flow_analysis.md');
