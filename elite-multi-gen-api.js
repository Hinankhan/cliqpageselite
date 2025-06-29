const fs = require('fs');
const path = require('path');

// API wrapper for elite-multi-gen.js to work with web interface
class EliteMultiGenAPI {
    constructor() {
        this.tempDir = './temp';
        this.sectionsDir = path.join(this.tempDir, 'sections');
        this.finalDir = path.join(this.tempDir, 'final');
        
        // Ensure temp directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        try {
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
            if (!fs.existsSync(this.sectionsDir)) {
                fs.mkdirSync(this.sectionsDir, { recursive: true });
            }
            if (!fs.existsSync(this.finalDir)) {
                fs.mkdirSync(this.finalDir, { recursive: true });
            }
            console.log('✅ Temp directories ensured:', { sectionsDir: this.sectionsDir, finalDir: this.finalDir });
        } catch (error) {
            console.error('❌ Error creating directories:', error);
        }
    }

    async generateSectionsWithSelection(userInput, selectedSections = null) {
        try {
            console.log('🚀 Starting Elite Multi-Gen API Generation');
            console.log('📁 Using directories:', {
                sections: this.sectionsDir,
                final: this.finalDir
            });
            
            // Generate using the section-by-section method
            const finalFile = await this.generateWithProgress(userInput, null);
            
            if (finalFile.success) {
                return finalFile;
            } else {
                throw new Error(finalFile.error || 'Generation failed');
            }
            
        } catch (error) {
            console.error('❌ Elite generation error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to generate landing page using elite method'
            };
        }
    }

    async generateWithProgress(userInput, progressCallback) {
        try {
            console.log('🚀 Starting Elite Generation with Progress Tracking');
            
            // Clean up previous sections
            this.cleanupSections();
            
            if (progressCallback) progressCallback(5, 'Initializing generation...');
            
            // Create global context
            const context = this.createGlobalContext(userInput);
            
            if (progressCallback) progressCallback(10, 'Context created, starting section generation...');
            
            // Get prompt files
            const promptFiles = fs.readdirSync('./prompts')
                .filter(name => /^\d+(\.\d+)?-.*\.txt$/.test(name))
                .sort((a, b) => parseFloat(a) - parseFloat(b));
            
            console.log('📋 Found prompt files:', promptFiles.length);
            
            let finalHTML = '';
            let headSection = '';
            let bodyContent = '';
            let jsSection = '';
            
            // Generate HTML sections (excluding JavaScript)
            const htmlPrompts = promptFiles.filter(filename => !filename.startsWith('9-js'));
            const totalSections = htmlPrompts.length + 1; // +1 for JavaScript
            
            for (let i = 0; i < htmlPrompts.length; i++) {
                const filename = htmlPrompts[i];
                const rawSectionName = filename.replace(/^\d+(\.\d+)?-/, '').replace('.txt', '');
                
                // Create user-friendly section names
                const sectionNameMap = {
                    'head': 'Page Structure & Styling',
                    'hero': 'Hero Section',
                    'problem': 'Problem Statement',
                    'features': 'Features Section',
                    'how-it-works': 'How It Works',
                    'testimonials': 'Customer Testimonials',
                    'product-showcase': 'Product Showcase',
                    'pricing': 'Pricing Plans',
                    'value-props': 'Value Propositions',
                    'faq': 'FAQ Section',
                    'contact': 'Contact Section',
                    'footer': 'Footer'
                };
                
                const friendlyName = sectionNameMap[rawSectionName] || rawSectionName;
                
                if (progressCallback) {
                    const progress = 10 + (i / totalSections) * 70;
                    progressCallback(progress, `Crafting ${friendlyName}...`, friendlyName);
                }
                
                try {
                    const promptPath = path.join('./prompts', filename);
                    let prompt = fs.readFileSync(promptPath, 'utf8').trim();
                    
                    // Inject context into prompt
                    const contextualPrompt = this.injectContextIntoPrompt(prompt, context);
                    
                    // Update progress to show AI is working on this section
                    if (progressCallback) {
                        const progress = 12 + (i / totalSections) * 70;
                        progressCallback(progress, `AI is designing ${friendlyName}...`, friendlyName);
                    }
                    
                    console.log(`🔨 Generating ${filename}...`);
                    const html = await this.sendClaudeRequest(contextualPrompt, context);
                    
                    // Save section file
                    const sectionPath = path.join(this.sectionsDir, filename.replace('.txt', '.html'));
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
            
            // Generate JavaScript
            if (progressCallback) progressCallback(85, 'Adding Interactive Features...', 'Interactive Features');
            
            const jsPromptFile = promptFiles.find(f => f.startsWith('9-js'));
            if (jsPromptFile) {
                const jsPromptPath = path.join('./prompts', jsPromptFile);
                let jsPrompt = fs.readFileSync(jsPromptPath, 'utf8').trim();
                
                // Create enhanced JavaScript prompt with actual HTML structure
                const enhancedJsPrompt = `
GENERATED HTML STRUCTURE:
${headSection}
${bodyContent}

ORIGINAL PROMPT:
${jsPrompt}

CRITICAL: Analyze the HTML structure above and create JavaScript that works with the ACTUAL elements, IDs, and classes that exist.`;

                const contextualJsPrompt = this.injectContextIntoPrompt(enhancedJsPrompt, context);
                
                try {
                    if (progressCallback) progressCallback(88, 'Building interactive functionality...', 'Interactive Features');
                    
                    const jsCode = await this.sendClaudeRequest(contextualJsPrompt, context);
                    const jsPath = path.join(this.sectionsDir, jsPromptFile.replace('.txt', '.html'));
                    fs.writeFileSync(jsPath, jsCode.trim());
                    jsSection = jsCode.trim();
                    console.log(`✅ Generated: ${jsPromptFile}`);
                    
                    if (progressCallback) progressCallback(92, 'Interactive features completed!', 'Interactive Features');
                } catch (err) {
                    console.error(`❌ Error with ${jsPromptFile}:`, err);
                    throw err;
                }
            }
            
            if (progressCallback) progressCallback(95, 'Assembling Your Landing Page...', 'Final Assembly');
            
            // Stitch final HTML
            finalHTML = headSection + bodyContent + '\n' + jsSection + '\n</body>\n</html>';
            
            // Save final file
            const fileName = `${userInput.company_name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-landing-page.html`;
            const finalFile = path.join(this.finalDir, fileName);
            fs.writeFileSync(finalFile, finalHTML);
            
            if (progressCallback) progressCallback(100, '🎉 Your Landing Page is Ready!', 'Complete');
            
            console.log('🏁 Final HTML created:', finalFile);
            
            return {
                success: true,
                htmlContent: finalHTML,
                fileName: fileName,
                finalFile: finalFile,
                sectionsGenerated: this.getSectionsList(),
                message: 'Landing page generated successfully with progress tracking'
            };
            
        } catch (error) {
            console.error('❌ Progressive generation error:', error);
            return {
                success: false,
                error: error.message,
                message: 'Failed to generate landing page'
            };
        }
    }

    cleanupSections() {
        try {
            if (fs.existsSync(this.sectionsDir)) {
                const files = fs.readdirSync(this.sectionsDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.sectionsDir, file));
                });
                console.log('🧹 Cleaned up sections directory');
            }
        } catch (error) {
            console.error('❌ Error cleaning sections:', error);
        }
    }

    getSectionsList() {
        try {
            if (fs.existsSync(this.sectionsDir)) {
                return fs.readdirSync(this.sectionsDir)
                    .filter(file => file.endsWith('.html'))
                    .map(file => ({
                        name: file,
                        path: path.join(this.sectionsDir, file),
                        size: fs.statSync(path.join(this.sectionsDir, file)).size
                    }));
            }
            return [];
        } catch (error) {
            console.error('❌ Error getting sections list:', error);
            return [];
        }
    }

    // Context creation method (from elite-multi-gen.js)
    createGlobalContext(userInput) {
        const businessName = userInput.company_name || 'Your Business';
        const businessDesc = userInput.business_description || 'Professional services and solutions';
        const targetMarket = userInput.target_audience || 'professionals and businesses';
        const primaryGoal = userInput.primary_goal || 'generate leads';
        const pageStyle = userInput.page_style || 'Professional';
        const primaryColor = userInput.primary_color || '#3b82f6';
        const secondaryColor = userInput.secondary_color || '#1e40af';
        const businessEmail = userInput.business_email || userInput.email || 'contact@company.com';
        const phoneNumber = userInput.phone_number || '';

        // Generate CTAs based on primary goal
        const ctaPrimary = this.generateCTA(primaryGoal);
        const ctaSecondary = this.generateSecondaryCTA(primaryGoal);

        // Create design variation
        const designVariations = ['Modern Minimalist', 'Bold & Dynamic', 'Elegant Professional', 'Creative Vibrant'];
        const layoutStyles = ['Grid-based', 'Asymmetric', 'Centered', 'Side-by-side'];
        const designSeed = Math.floor(Math.random() * 1000);
        const designVariation = designVariations[designSeed % designVariations.length];
        const layoutStyle = layoutStyles[designSeed % layoutStyles.length];

        // Determine tone based on page style
        const tones = {
            'Professional': 'professional and authoritative',
            'Creative': 'creative and inspiring',
            'Modern': 'modern and innovative',
            'Elegant': 'elegant and sophisticated',
            'Bold': 'bold and confident',
            'Minimalist': 'clean and focused'
        };
        const tone = tones[pageStyle] || 'professional and engaging';

        return {
            companyName: businessName,
            businessDescription: businessDesc,
            targetMarket: targetMarket,
            primaryGoal: primaryGoal,
            pageStyle: pageStyle,
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
            businessEmail: businessEmail,
            phoneNumber: phoneNumber,
            ctaPrimary: ctaPrimary,
            ctaSecondary: ctaSecondary,
            tone: tone,
            designStyle: pageStyle.toLowerCase(),
            designVariation: designVariation,
            layoutStyle: layoutStyle,
            designSeed: designSeed
        };
    }

    generateCTA(primaryGoal) {
        const ctaMap = {
            'generate_leads': 'Get Your Free Quote',
            'increase_sales': 'Start Your Free Trial',
            'build_awareness': 'Learn More About Us',
            'drive_signups': 'Sign Up Today',
            'promote_event': 'Register Now',
            'showcase_portfolio': 'View Our Work',
            'collect_emails': 'Join Our Newsletter',
            'book_consultations': 'Book Free Consultation',
            'download_resources': 'Download Free Guide'
        };
        return ctaMap[primaryGoal] || 'Get Started Today';
    }

    generateSecondaryCTA(primaryGoal) {
        const secondaryCtaMap = {
            'generate_leads': 'Learn More',
            'increase_sales': 'See Pricing',
            'build_awareness': 'Contact Us',
            'drive_signups': 'View Demo',
            'promote_event': 'Learn More',
            'showcase_portfolio': 'Get Quote',
            'collect_emails': 'Browse Resources',
            'book_consultations': 'View Services',
            'download_resources': 'Contact Support'
        };
        return secondaryCtaMap[primaryGoal] || 'Contact Us';
    }

    // Helper methods from elite-multi-gen.js
    injectContextIntoPrompt(prompt, context) {
        let injectedPrompt = prompt;
        
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
        
        Object.entries(replacements).forEach(([placeholder, value]) => {
            injectedPrompt = injectedPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
        });
        
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

DESIGN VARIATION FOR THIS GENERATION:
Variation: ${context.designVariation}
Layout Style: ${context.layoutStyle}
Design Seed: ${context.designSeed}

IMPORTANT: 
- Output raw code only, no explanations
- Use the brand context above consistently
- Apply the design variation to create a unique layout

ORIGINAL PROMPT:
${injectedPrompt}`;
        
        return contextPrompt;
    }

    async sendClaudeRequest(prompt, context) {
        const https = require('https');
        
        console.log(`🚀 Sending request to Claude Sonnet 4...`);
        console.log(`🔍 Model: claude-sonnet-4-20250514`);
        console.log(`🔍 Max tokens: 32000`);
        console.log(`🔍 Prompt length: ${prompt.length} characters`);
        
        const CONFIG = {
            MODEL: 'claude-sonnet-4-20250514',
            MAX_TOKENS: 32000, // Increased for Claude Sonnet 4 (supports up to 64K)
            TEMPERATURE: 0.3,
            API_VERSION: '2023-06-01', // Updated for Claude 4 compatibility
            API_KEY: process.env.ANTHROPIC_API_KEY,
        };
        
        if (!CONFIG.API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is not set');
        }

        const systemPrompt = `You are tasked with creating an ELITE, WORLD-CLASS landing page that rivals the best designs from companies like Stripe, Linear, and Notion.

BRAND CONTEXT:
- Company: ${context.companyName}
- Business: ${context.businessDescription}
- Target Market: ${context.targetMarket}
- Primary Goal: ${context.primaryGoal}
- Style: ${context.pageStyle} (${context.tone})
- Colors: Primary ${context.primaryColor}, Secondary ${context.secondaryColor}
- Main CTA: "${context.ctaPrimary}"
- Secondary CTA: "${context.ctaSecondary}"

OUTPUT REQUIREMENTS:
- Provide ONLY raw code, no explanations
- Use the exact brand information provided above
- Make it pixel-perfect, production-ready, and fully responsive`;

        const requestData = JSON.stringify({
            model: CONFIG.MODEL,
            max_tokens: CONFIG.MAX_TOKENS,
            temperature: CONFIG.TEMPERATURE,
            system: systemPrompt,
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
            // Add timeout for each section generation (120 seconds per section for Claude Sonnet 4)
            const timeout = setTimeout(() => {
                req.destroy();
                reject(new Error('Section generation timeout after 120 seconds'));
            }, 120000);

            const req = https.request(options, (res) => {
                let data = '';
                console.log(`🔍 Claude API Response Status: ${res.statusCode}`);
                console.log(`🔍 Response Headers:`, res.headers);
                
                res.on('data', chunk => {
                    data += chunk;
                    console.log(`📥 Received chunk: ${chunk.length} bytes`);
                });
                
                res.on('end', () => {
                    clearTimeout(timeout);
                    console.log(`✅ Response complete. Total size: ${data.length} bytes`);
                    
                    if (res.statusCode === 200) {
                        try {
                            const parsed = JSON.parse(data);
                            console.log(`✅ Successfully parsed response for Claude Sonnet 4`);
                            if (parsed.content && parsed.content[0] && parsed.content[0].text) {
                                resolve(parsed.content[0].text);
                            } else {
                                console.error('❌ Unexpected response structure:', parsed);
                                reject(`Unexpected response structure from Claude Sonnet 4`);
                            }
                        } catch (err) {
                            console.error('❌ JSON parsing error:', err.message);
                            console.error('❌ Raw response:', data.substring(0, 500));
                            reject(`JSON error: ${err.message}`);
                        }
                    } else {
                        console.error(`❌ API error ${res.statusCode}:`, data);
                        reject(`API error: ${res.statusCode} - ${data}`);
                    }
                });
            });

            req.on('error', (err) => {
                clearTimeout(timeout);
                console.error('❌ Request error:', err.message);
                reject(new Error(`Request error: ${err.message}`));
            });
            
            req.write(requestData);
            req.end();
        });
    }
}

// Export both class and convenience functions
const api = new EliteMultiGenAPI();

module.exports = {
    EliteMultiGenAPI,
    generateSectionsWithSelection: (userInput, sections) => api.generateSectionsWithSelection(userInput, sections),
    generateWithProgress: (userInput, progressCallback) => api.generateWithProgress(userInput, progressCallback),
    getSectionsList: () => api.getSectionsList(),
    cleanupSections: () => api.cleanupSections()
}; 