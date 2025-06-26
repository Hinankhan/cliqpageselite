const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  MODEL: 'claude-3-5-sonnet-20250106',
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.3,
  API_VERSION: '2023-06-01',
  API_KEY: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
};

const PROMPT_DIR = './prompts';
const OUTPUT_DIR = './sections';
const FINAL_DIR = './final';
const FINAL_FILE = `${FINAL_DIR}/final-elite-landing.html`;

// Sample user input (this will come from form submission later)
const SAMPLE_USER_INPUT = {
  email: 'user@example.com',
  page_style: 'sales_marketing', // or 'professional_informational'
  form_integration: 'yes',
  brand_matching: 'custom_colors',
  website_url: '',
  primary_color: '#6366f1',
  secondary_color: '#f59e0b',
  company_name: 'LeadGen Pro',
  target_market: 'Small to medium businesses',
  business_description: 'We help businesses capture and convert more leads through intelligent form optimization and automated follow-up systems.',
  design_instructions: '',
  primary_goal: 'generate_leads',
  business_email: 'contact@leadgenpro.com',
  phone_number: '(555) 123-4567'
};

// CTA Generator Function
function generateCTA(primaryGoal) {
  const ctaMap = {
    'generate_leads': 'Get More Leads Now',
    'drive_sales': 'Buy Now',
    'book_consultations': 'Book Free Consultation',
    'sign_ups': 'Sign Up Free',
    'download_content': 'Download Now',
    'contact_us': 'Contact Us Today',
    'other': 'Get Started'
  };
  return ctaMap[primaryGoal] || 'Get Started';
}

function generateSecondaryCTA(primaryGoal) {
  const secondaryMap = {
    'generate_leads': 'See How It Works',
    'drive_sales': 'Learn More',
    'book_consultations': 'View Pricing',
    'sign_ups': 'Watch Demo',
    'download_content': 'Preview Content',
    'contact_us': 'Learn More',
    'other': 'Learn More'
  };
  return secondaryMap[primaryGoal] || 'Learn More';
}

// Create Global Context from User Input
function createGlobalContext(userInput) {
  // Generate a random design seed for variations
  const designSeed = Math.floor(Math.random() * 1000);
  const layoutVariations = [
    'modern-minimal', 'bold-dynamic', 'elegant-sophisticated', 
    'tech-futuristic', 'warm-friendly', 'corporate-professional'
  ];
  const designVariation = layoutVariations[designSeed % layoutVariations.length];
  
  return {
    // User inputs
    email: userInput.email,
    pageStyle: userInput.page_style,
    formIntegration: userInput.form_integration,
    brandMatching: userInput.brand_matching,
    websiteUrl: userInput.website_url,
    primaryColor: userInput.primary_color,
    secondaryColor: userInput.secondary_color,
    companyName: userInput.company_name,
    targetMarket: userInput.target_market,
    businessDescription: userInput.business_description,
    designInstructions: userInput.design_instructions,
    primaryGoal: userInput.primary_goal,
    businessEmail: userInput.business_email,
    phoneNumber: userInput.phone_number,
    
    // Generated values
    ctaPrimary: generateCTA(userInput.primary_goal),
    ctaSecondary: generateSecondaryCTA(userInput.primary_goal),
    
    // Style guidance
    tone: userInput.page_style === 'sales_marketing' 
      ? 'conversion-focused, urgent, persuasive, action-oriented'
      : 'professional, trustworthy, informative, credible',
    
    designStyle: userInput.page_style === 'sales_marketing'
      ? 'bold colors, strong CTAs, urgency elements, social proof'
      : 'clean layout, subtle colors, professional imagery, detailed information',
    
    // Design variation system
    designSeed: designSeed,
    designVariation: designVariation,
    layoutStyle: getLayoutInstructions(designVariation)
  };
}

// Get layout instructions based on design variation
function getLayoutInstructions(variation) {
  const layouts = {
    'modern-minimal': 'Clean lines, lots of white space, minimal elements, geometric shapes, subtle shadows',
    'bold-dynamic': 'Large typography, vibrant gradients, asymmetric layouts, bold shapes, high contrast',
    'elegant-sophisticated': 'Refined typography, subtle animations, premium spacing, elegant curves, luxury feel',
    'tech-futuristic': 'Sharp edges, neon accents, dark backgrounds, glowing effects, modern tech aesthetic',
    'warm-friendly': 'Rounded corners, warm colors, friendly icons, organic shapes, approachable design',
    'corporate-professional': 'Structured grids, conservative colors, professional imagery, formal layouts, trustworthy design'
  };
  return layouts[variation] || layouts['modern-minimal'];
}

// Enhanced System Prompt with Context
function createSystemPrompt(context) {
  return `You are tasked with creating an ELITE, WORLD-CLASS landing page that rivals the best designs from companies like Stripe, Linear, and Notion. This must be EXCEPTIONAL quality.. 

BRAND CONTEXT:
- Company: ${context.companyName}
- Business: ${context.businessDescription}
- Target Market: ${context.targetMarket}
- Primary Goal: ${context.primaryGoal}
- Style: ${context.pageStyle} (${context.tone})
- Colors: Primary ${context.primaryColor}, Secondary ${context.secondaryColor}
- Main CTA: "${context.ctaPrimary}"
- Secondary CTA: "${context.ctaSecondary}"

DESIGN REQUIREMENTS:
- Style approach: ${context.designStyle}
- Tone of copy: ${context.tone}
- Contact: ${context.businessEmail}${context.phoneNumber ? ', ' + context.phoneNumber : ''}
${context.designInstructions ? '- Special instructions: ' + context.designInstructions : ''}

OUTPUT REQUIREMENTS:
- Provide ONLY raw code, no explanations or comments about what you're doing
- Use the exact brand information provided above
- Maintain consistent styling and theme throughout
- Optimize for ${context.primaryGoal}
- Make it pixel-perfect, production-ready, and fully responsive`;
}

// Inject context into prompts
function injectContextIntoPrompt(prompt, context) {
  let injectedPrompt = prompt;
  
  // Replace placeholders with actual values
  const replacements = {
    '{companyName}': context.companyName,
    '{businessDescription}': context.businessDescription,
    '{targetMarket}': context.targetMarket,
    '{primaryColor}': context.primaryColor,
    '{secondaryColor}': context.secondaryColor,
    '{ctaPrimary}': context.ctaPrimary,
    '{ctaSecondary}': context.ctaSecondary,
    '{businessEmail}': context.businessEmail,
    '{phoneNumber}': context.phoneNumber,
    '{primaryGoal}': context.primaryGoal,
    '{tone}': context.tone,
    '{designStyle}': context.designStyle,
    '{pageStyle}': context.pageStyle,
    '{layoutStyle}': context.layoutStyle,
    '{designVariation}': context.designVariation
  };
  
  // Apply replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    injectedPrompt = injectedPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  });
  
  // Add global context to the beginning
  const contextPrompt = `
BRAND CONTEXT FOR THIS SECTION:
Company: ${context.companyName}
Business: ${context.businessDescription}
Target: ${context.targetMarket}
Style: ${context.pageStyle} (${context.tone})
Colors: Primary ${context.primaryColor}, Secondary ${context.secondaryColor}
Main CTA: "${context.ctaPrimary}"
Secondary CTA: "${context.ctaSecondary}"
Goal: ${context.primaryGoal}
${context.designInstructions ? 'Special Instructions: ' + context.designInstructions : ''}

DESIGN VARIATION FOR THIS GENERATION:
Variation: ${context.designVariation}
Layout Style: ${context.layoutStyle}
Design Seed: ${context.designSeed}

IMPORTANT: 
- Output raw code only, no explanations
- Use the brand context above consistently
- Apply the design variation to create a unique layout
- Make this section visually different from previous generations
- Use the layout style instructions to guide the design approach

ORIGINAL PROMPT:
${injectedPrompt}`;
  
  return contextPrompt;
}

// Load all prompt filenames in order
const promptFiles = fs.readdirSync(PROMPT_DIR)
  .filter(name => /^\d+(\.\d+)?-.*\.txt$/.test(name))
  .sort((a, b) => parseFloat(a) - parseFloat(b));

// Send a prompt to Claude API
async function sendClaudeRequest(prompt, context) {
  const requestData = JSON.stringify({
    model: CONFIG.MODEL,
    max_tokens: CONFIG.MAX_TOKENS,
    temperature: CONFIG.TEMPERATURE,
    system: createSystemPrompt(context),
    messages: [{ role: 'user', content: prompt }]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.API_KEY,
      'anthropic-version': CONFIG.API_VERSION,
      'Content-Length': Buffer.byteLength(requestData),
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.content[0].text);
          } catch (err) {
            reject(`JSON error: ${err.message}`);
          }
        } else {
          reject(`API error: ${res.statusCode} - ${data}`);
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

// Clean up sections directory
function cleanupSections() {
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    });
    console.log('🧹 Cleaned up sections directory');
  }
}

// Generate each section and save
async function generateSections(userInput = SAMPLE_USER_INPUT) {
  const context = createGlobalContext(userInput);
  
  console.log('🚀 ELITE LANDING PAGE GENERATOR v3.0');
  console.log('=' .repeat(60));
  console.log('📋 Brand:', context.companyName);
  console.log('🎯 Goal:', context.primaryGoal);
  console.log('🎨 Style:', context.pageStyle);
  console.log('🔹 Primary CTA:', context.ctaPrimary);
  console.log('🎭 Design Variation:', context.designVariation);
  console.log('📐 Layout Style:', context.layoutStyle);
  console.log('');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(FINAL_DIR, { recursive: true });

  let finalHTML = '';
  let headSection = '';
  let bodyContent = '';
  let jsSection = '';

  // Generate all HTML sections first (excluding JavaScript)
  const htmlPrompts = promptFiles.filter(filename => !filename.startsWith('9-js'));
  
  for (let i = 0; i < htmlPrompts.length; i++) {
    const filename = htmlPrompts[i];
    const promptPath = path.join(PROMPT_DIR, filename);
    let prompt = fs.readFileSync(promptPath, 'utf8').trim();

    if (!prompt || prompt.length < 10) {
      throw new Error(`Prompt file ${filename} is empty or invalid.`);
    }

    // Inject context into prompt
    const contextualPrompt = injectContextIntoPrompt(prompt, context);

    console.log(`🔨 Generating ${filename}...`);
    try {
      const html = await sendClaudeRequest(contextualPrompt, context);
      const sectionPath = path.join(OUTPUT_DIR, filename.replace('.txt', '.html'));
      fs.writeFileSync(sectionPath, html.trim());

      // Handle different sections
      if (filename.startsWith('1-head')) {
        headSection = html.trim();
      } else {
        bodyContent += `\n<!-- SECTION: ${filename} -->\n` + html.trim();
      }

      console.log(`✅ Generated: ${filename}`);
    } catch (err) {
      console.error(`❌ Error with ${filename}:`, err);
      throw err;
    }
  }

  // Now generate JavaScript AFTER all HTML is complete
  console.log(`🔨 Generating JavaScript based on actual HTML structure...`);
  const jsPromptFile = promptFiles.find(f => f.startsWith('9-js'));
  if (jsPromptFile) {
    const jsPromptPath = path.join(PROMPT_DIR, jsPromptFile);
    let jsPrompt = fs.readFileSync(jsPromptPath, 'utf8').trim();
    
    // Create enhanced JavaScript prompt with actual HTML structure
    const enhancedJsPrompt = `
GENERATED HTML STRUCTURE:
${headSection}
${bodyContent}

ORIGINAL PROMPT:
${jsPrompt}

CRITICAL: Analyze the HTML structure above and create JavaScript that works with the ACTUAL elements, IDs, and classes that exist. Make sure:
- All selectors match elements that actually exist in the HTML
- Hamburger menu functionality works
- Navigation smooth scrolling works
- Pricing toggles work
- FAQ accordions work
- All animations and interactions function properly
- Consolidate ALL JavaScript into ONE <script> tag
`;

    const contextualJsPrompt = injectContextIntoPrompt(enhancedJsPrompt, context);
    
    try {
      const jsCode = await sendClaudeRequest(contextualJsPrompt, context);
      const jsPath = path.join(OUTPUT_DIR, jsPromptFile.replace('.txt', '.html'));
      fs.writeFileSync(jsPath, jsCode.trim());
      jsSection = jsCode.trim();
      console.log(`✅ Generated: ${jsPromptFile}`);
    } catch (err) {
      console.error(`❌ Error with ${jsPromptFile}:`, err);
      throw err;
    }
  }

  // Stitch final HTML
  finalHTML = headSection + bodyContent + '\n' + jsSection + '\n</body>\n</html>';

  fs.writeFileSync(FINAL_FILE, finalHTML);
  console.log('\n🏁 Final HTML created:', FINAL_FILE);
  
  // Cleanup sections after successful generation
  cleanupSections();
  
  return FINAL_FILE;
}

// Export for module usage
module.exports = {
  generateSections,
  createGlobalContext,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  generateSections().catch(console.error);
}
