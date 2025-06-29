#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Add parent directory to require path
process.chdir(path.join(__dirname, '..'));

const EliteSingleGenerator = require('./elite-single-gen-api');

console.log('🧪 Testing Elite Single-Prompt Generation System');
console.log('================================================');

// Test data
const testData = {
    company_name: 'TechFlow Solutions',
    business_description: 'AI-powered workflow automation for modern businesses',
    target_audience: 'small to medium businesses and entrepreneurs',
    primary_goal: 'increase productivity and reduce manual tasks',
    page_style: 'modern',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    email: 'test@techflow.com',
    business_email: 'hello@techflow.com',
    phone_number: '(555) 123-4567',
    website_url: 'https://techflow.com',
    custom_instructions: 'Focus on automation benefits and ROI'
};

async function testSinglePromptGeneration() {
    try {
        console.log('🚀 Initializing Elite Single Generator...');
        const generator = new EliteSingleGenerator();
        
        console.log('📋 Test Data:');
        console.log(`   Company: ${testData.company_name}`);
        console.log(`   Description: ${testData.business_description}`);
        console.log(`   Target: ${testData.target_audience}`);
        console.log(`   Goal: ${testData.primary_goal}`);
        console.log(`   Colors: ${testData.primary_color}, ${testData.secondary_color}`);
        
        // Test session ID
        const sessionId = `test-${Date.now()}`;
        
        // Register progress callback
        generator.registerProgressCallback(sessionId, (progressData) => {
            console.log(`📊 Progress: ${progressData.progress}% - ${progressData.message}`);
        });
        
        console.log('\n🎯 Starting generation...');
        const startTime = Date.now();
        
        const result = await generator.generateLandingPage(testData, sessionId);
        
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('\n✅ Generation Results:');
        console.log(`   Success: ${result.success}`);
        console.log(`   Filename: ${result.filename}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Approach: ${result.approach}`);
        console.log(`   Model: ${result.model}`);
        console.log(`   Duration: ${duration} seconds`);
        
        if (result.success) {
            // Check if file exists
            const filePath = path.join(__dirname, '..', 'temp', 'final', result.filename);
            if (fs.existsSync(filePath)) {
                const fileSize = fs.statSync(filePath).size;
                const fileSizeKB = Math.round(fileSize / 1024);
                console.log(`   File Size: ${fileSizeKB} KB`);
                
                // Read first 500 characters to verify content
                const content = fs.readFileSync(filePath, 'utf8');
                console.log(`   Content Length: ${content.length} characters`);
                console.log(`   Content Preview: ${content.substring(0, 200)}...`);
                
                // Check for key elements
                const hasDoctype = content.includes('<!DOCTYPE html>');
                const hasTitle = content.includes('<title>');
                const hasNav = content.includes('<nav') || content.includes('nav');
                const hasHero = content.includes('hero') || content.includes('Hero');
                const hasFeatures = content.includes('features') || content.includes('Features');
                const hasPricing = content.includes('pricing') || content.includes('Pricing');
                const hasContact = content.includes('contact') || content.includes('Contact');
                const hasJavaScript = content.includes('<script>');
                
                console.log('\n🔍 Content Analysis:');
                console.log(`   ✅ DOCTYPE: ${hasDoctype}`);
                console.log(`   ✅ Title: ${hasTitle}`);
                console.log(`   ✅ Navigation: ${hasNav}`);
                console.log(`   ✅ Hero Section: ${hasHero}`);
                console.log(`   ✅ Features: ${hasFeatures}`);
                console.log(`   ✅ Pricing: ${hasPricing}`);
                console.log(`   ✅ Contact: ${hasContact}`);
                console.log(`   ✅ JavaScript: ${hasJavaScript}`);
                
                const allElementsPresent = hasDoctype && hasTitle && hasNav && hasHero && hasFeatures && hasPricing && hasContact && hasJavaScript;
                
                if (allElementsPresent) {
                    console.log('\n🎉 SUCCESS: All key elements are present in the generated landing page!');
                } else {
                    console.log('\n⚠️  WARNING: Some key elements might be missing from the generated page.');
                }
                
            } else {
                console.log('❌ Generated file not found!');
            }
        }
        
        // Clean up
        generator.cleanup(sessionId);
        
        console.log('\n🧹 Test completed and cleaned up.');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
}

// Run the test
testSinglePromptGeneration(); 