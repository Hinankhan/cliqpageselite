const fs = require('fs');
const path = require('path');
const https = require('https');

class EliteSingleGenerator {
    constructor() {
        this.CONFIG = {
            MODEL: 'claude-sonnet-4-20250514',
            MAX_TOKENS: 64000, // Use Claude Sonnet 4's full capacity
            TEMPERATURE: 0.3,
            API_VERSION: '2023-06-01',
            API_KEY: process.env.ANTHROPIC_API_KEY,
        };
        
        this.progressCallbacks = new Map();
        
        // Ensure temp directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = ['temp', 'temp/final', 'temp/sections'];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Register progress callback for real-time updates
    registerProgressCallback(sessionId, callback) {
        this.progressCallbacks.set(sessionId, callback);
        console.log(`🔗 Registered progress callback for session: ${sessionId}`);
    }

    // Send progress update to registered callback
    sendProgressUpdate(sessionId, progress, message, section = null) {
        const callback = this.progressCallbacks.get(sessionId);
        if (callback) {
            console.log(`📊 Sending progress update: ${progress}% - ${message}`);
            callback({
                progress,
                message,
                section,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Load and prepare the elite prompt
    loadElitePrompt() {
        try {
            const promptPath = path.join(__dirname, 'elite-single-prompt.txt');
            if (!fs.existsSync(promptPath)) {
                throw new Error('Elite single prompt file not found');
            }
            return fs.readFileSync(promptPath, 'utf8');
        } catch (error) {
            console.error('❌ Error loading elite prompt:', error);
            throw error;
        }
    }

    // Replace placeholders in prompt with actual user data
    replacePromptPlaceholders(prompt, userData) {
        const placeholders = {
            '{companyName}': userData.company_name || 'Your Company',
            '{businessDescription}': userData.business_description || 'Your Business',
            '{targetMarket}': userData.target_audience || 'professionals',
            '{primaryGoal}': userData.primary_goal || 'increase efficiency',
            '{tone}': userData.page_style || 'professional',
            '{designStyle}': userData.page_style || 'modern',
            '{layoutStyle}': 'modern', // Default for single prompt
            '{primaryColor}': userData.primary_color || '#3B82F6',
            '{secondaryColor}': userData.secondary_color || '#8B5CF6',
            '{ctaPrimary}': 'Get Started',
            '{ctaSecondary}': 'Learn More',
            '{businessEmail}': userData.business_email || userData.email || 'hello@company.com',
            '{phoneNumber}': userData.phone_number || '(555) 123-4567',
            '{websiteUrl}': userData.website_url || 'https://company.com',
            '{customInstructions}': userData.custom_instructions || userData.customInstructions || 'No special instructions provided.'
        };

        let processedPrompt = prompt;
        Object.entries(placeholders).forEach(([placeholder, value]) => {
            processedPrompt = processedPrompt.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        // Handle dynamic section selection
        if (userData.selected_sections && userData.selected_sections.length > 0) {
            processedPrompt = this.customizeSectionsInPrompt(processedPrompt, userData.selected_sections, userData.custom_section);
        }

        return processedPrompt;
    }

    // Customize sections based on user selection
    customizeSectionsInPrompt(prompt, selectedSections, customSection) {
        const sectionMap = {
            'hero': '1. HTML DOCUMENT HEAD\n2. ELITE HERO SECTION',
            'problem': '3. PROBLEM SECTION (id="problem")',
            'how-it-works': '4. HOW IT WORKS SECTION (id="how-it-works")',
            'features': '5. FEATURES SECTION (id="features")',
            'product-showcase': '6. PRODUCT SHOWCASE SECTION (id="product-showcase")',
            'value-props': '7. VALUE PROPOSITIONS SECTION (id="value-props")',
            'testimonials': '8. TESTIMONIALS/SOCIAL PROOF SECTION',
            'pricing': '9. PRICING SECTION (id="pricing")',
            'faq': '10. FAQ SECTION',
            'contact': '11. CONTACT SECTION (id="contact")',
            'footer': '12. FOOTER SECTION'
        };

        // Build dynamic section list
        let sectionsToInclude = [];
        let sectionNumber = 3; // Start after head and hero

        // Always include head and hero
        sectionsToInclude.push('### 1. HTML DOCUMENT HEAD');
        sectionsToInclude.push('### 2. ELITE HERO SECTION');

        selectedSections.forEach(section => {
            if (section === 'hero') return; // Already included
            
            const sectionTitle = sectionMap[section];
            if (sectionTitle) {
                sectionsToInclude.push(`### ${sectionNumber}. ${sectionTitle.split('. ')[1] || sectionTitle}`);
                sectionNumber++;
            }
        });

        // Add custom section if provided
        if (customSection && customSection.trim()) {
            sectionsToInclude.push(`### ${sectionNumber}. CUSTOM SECTION\n- ${customSection.trim()}`);
            sectionNumber++;
        }

        // Always include JavaScript functionality
        sectionsToInclude.push(`### ${sectionNumber}. COMPLETE JAVASCRIPT FUNCTIONALITY`);

        // Replace the section structure in the prompt
        const sectionStructureRegex = /## COMPLETE LANDING PAGE STRUCTURE:[\s\S]*?## DESIGN EXCELLENCE REQUIREMENTS:/;
        const newSectionStructure = `## COMPLETE LANDING PAGE STRUCTURE:\n\n${sectionsToInclude.join('\n\n')}\n\n## DESIGN EXCELLENCE REQUIREMENTS:`;
        
        return prompt.replace(sectionStructureRegex, newSectionStructure);
    }

    // Clean Claude's response to remove unwanted text
    cleanClaudeResponse(response) {
        // Remove common unwanted prefixes and suffixes
        let cleaned = response;
        
        // Remove common AI response prefixes
        const prefixesToRemove = [
            /^Here's.*?landing page.*?:/i,
            /^I'll create.*?landing page.*?:/i,
            /^This is.*?landing page.*?:/i,
            /^```html\s*/,
            /^```\s*/
        ];
        
        prefixesToRemove.forEach(prefix => {
            cleaned = cleaned.replace(prefix, '');
        });
        
        // Remove common AI response suffixes
        const suffixesToRemove = [
            /\s*```\s*$/,
            /This landing page.*?rivals.*?companies.*$/i,
            /The landing page.*?ready for production.*$/i,
            /This.*?complete.*?production-ready.*$/i
        ];
        
        suffixesToRemove.forEach(suffix => {
            cleaned = cleaned.replace(suffix, '');
        });
        
        // Remove any success messages at the end
        const successMessageRegex = /[\s\S]*?(<\/html>\s*>)/i;
        const match = cleaned.match(successMessageRegex);
        if (match) {
            cleaned = cleaned.substring(0, match.index + match[1].length);
        }
        
        // Ensure it starts with DOCTYPE
        if (!cleaned.trim().toLowerCase().startsWith('<!doctype')) {
            // Try to find the DOCTYPE declaration
            const doctypeMatch = cleaned.match(/<!DOCTYPE[^>]*>/i);
            if (doctypeMatch) {
                const doctypeIndex = cleaned.indexOf(doctypeMatch[0]);
                cleaned = cleaned.substring(doctypeIndex);
            }
        }
        
        return cleaned.trim();
    }

    // Send request to Claude Sonnet 4
    async sendClaudeRequest(prompt, sessionId) {
        console.log(`🚀 Sending single request to Claude Sonnet 4...`);
        console.log(`🔍 Model: ${this.CONFIG.MODEL}`);
        console.log(`🔍 Max tokens: ${this.CONFIG.MAX_TOKENS}`);
        console.log(`🔍 Prompt length: ${prompt.length} characters`);

        if (!this.CONFIG.API_KEY) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }

        const requestBody = JSON.stringify({
            model: this.CONFIG.MODEL,
            max_tokens: this.CONFIG.MAX_TOKENS,
            temperature: this.CONFIG.TEMPERATURE,
            messages: [{ role: 'user', content: prompt }]
        });

        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
                'x-api-key': this.CONFIG.API_KEY,
                'anthropic-version': this.CONFIG.API_VERSION,
            },
        };

        return new Promise((resolve, reject) => {
            // Extended timeout for single comprehensive request (10 minutes)
            const timeout = setTimeout(() => {
                req.destroy();
                reject(new Error('Complete landing page generation timeout after 600 seconds'));
            }, 600000);

            const req = https.request(options, (res) => {
                let data = '';
                let progressCount = 0;
                console.log(`🔍 Claude API Response Status: ${res.statusCode}`);
                
                res.on('data', chunk => {
                    data += chunk;
                    progressCount++;
                    
                    // More granular progress updates
                    const baseProgress = 25;
                    const maxProgress = 85;
                    const progressIncrement = Math.min((progressCount * 2), maxProgress - baseProgress);
                    const currentProgress = baseProgress + progressIncrement;
                    
                    if (progressCount % 5 === 0) { // Update every 5th chunk to avoid overwhelming
                        this.sendProgressUpdate(sessionId, currentProgress, 'Receiving AI-generated landing page...', 'generation');
                    }
                });
                
                res.on('end', () => {
                    clearTimeout(timeout);
                    if (res.statusCode === 200) {
                        try {
                            const parsed = JSON.parse(data);
                            console.log('✅ Successfully received response from Claude Sonnet 4');
                            
                            // Clean up the response to remove unwanted text
                            const cleanedResponse = this.cleanClaudeResponse(parsed.content[0].text);
                            resolve(cleanedResponse);
                        } catch (err) {
                            console.error('❌ JSON parsing error:', err.message);
                            reject(new Error(`JSON parsing error: ${err.message}`));
                        }
                    } else {
                        console.error('❌ API error:', res.statusCode, data);
                        reject(new Error(`API error: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', (err) => {
                clearTimeout(timeout);
                console.error('❌ Request error:', err.message);
                reject(new Error(`Request error: ${err.message}`));
            });

            req.write(requestBody);
            req.end();
        });
    }

    // Generate complete landing page using single prompt
    async generateLandingPage(userData, sessionId) {
        try {
            console.log('🎯 Starting Elite Single-Prompt Landing Page Generation');
            console.log(`📋 Company: ${userData.company_name}`);
            console.log(`🎨 Style: ${userData.page_style}`);
            console.log(`🎯 Goal: ${userData.primary_goal}`);

            // Initial progress
            this.sendProgressUpdate(sessionId, 5, 'Loading elite prompt template...', 'initialization');

            // Load and prepare prompt
            const elitePrompt = this.loadElitePrompt();
            const processedPrompt = this.replacePromptPlaceholders(elitePrompt, userData);

            this.sendProgressUpdate(sessionId, 15, 'Connecting to Claude Sonnet 4...', 'connection');

            // Generate complete landing page
            this.sendProgressUpdate(sessionId, 25, 'AI is crafting your complete landing page...', 'generation');
            
            const landingPageHtml = await this.sendClaudeRequest(processedPrompt, sessionId);

            this.sendProgressUpdate(sessionId, 90, 'Finalizing and saving landing page...', 'finalization');

            // Save the complete landing page
            const timestamp = Date.now();
            const filename = `landing-page-${timestamp}.html`;
            const finalPath = path.join(__dirname, 'temp', 'final', filename);

            fs.writeFileSync(finalPath, landingPageHtml, 'utf8');
            console.log(`💾 Saved complete landing page: ${filename}`);

            // Also create a simple section for compatibility
            const sectionsPath = path.join(__dirname, 'temp', 'sections', `complete-${timestamp}.html`);
            fs.writeFileSync(sectionsPath, landingPageHtml, 'utf8');

            this.sendProgressUpdate(sessionId, 100, 'Landing page generation complete!', 'complete');

            return {
                success: true,
                filename: filename,
                fileName: filename, // For compatibility with email system
                htmlContent: landingPageHtml, // For email attachment
                message: 'Elite landing page generated successfully using single-prompt approach',
                generationTime: Date.now() - timestamp,
                approach: 'single-prompt',
                model: this.CONFIG.MODEL,
                tokensUsed: 'optimized'
            };

        } catch (error) {
            console.error('❌ Elite single generation error:', error);
            this.sendProgressUpdate(sessionId, 0, `Generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Clean up progress callback
    cleanup(sessionId) {
        if (this.progressCallbacks.has(sessionId)) {
            this.progressCallbacks.delete(sessionId);
            console.log(`🧹 Cleaned up progress callback for session: ${sessionId}`);
        }
    }
}

module.exports = EliteSingleGenerator; 