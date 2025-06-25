#!/usr/bin/env node

/**
 * Test script to verify section-by-section generation works in production
 * Run with: node scripts/test-sections.js
 */

const fs = require('fs');
const path = require('path');

async function testSectionGeneration() {
    console.log('🧪 Testing Section Generation Setup...\n');
    
    // Test 1: Check directories
    console.log('📁 Checking directories...');
    
    const tempDir = './temp';
    const sectionsDir = path.join(tempDir, 'sections');
    const finalDir = path.join(tempDir, 'final');
    
    const dirs = [
        { name: 'temp', path: tempDir },
        { name: 'temp/sections', path: sectionsDir },
        { name: 'temp/final', path: finalDir }
    ];
    
    dirs.forEach(dir => {
        if (fs.existsSync(dir.path)) {
            console.log(`✅ ${dir.name} directory exists`);
        } else {
            console.log(`❌ ${dir.name} directory missing`);
            // Create if missing
            fs.mkdirSync(dir.path, { recursive: true });
            console.log(`✅ Created ${dir.name} directory`);
        }
    });
    
    // Test 2: Check prompt files
    console.log('\n📋 Checking prompt files...');
    
    const promptsDir = './prompts';
    if (fs.existsSync(promptsDir)) {
        const promptFiles = fs.readdirSync(promptsDir)
            .filter(name => /^\d+(\.\d+)?-.*\.txt$/.test(name))
            .sort((a, b) => parseFloat(a) - parseFloat(b));
        
        console.log(`✅ Found ${promptFiles.length} prompt files:`);
        promptFiles.forEach(file => {
            console.log(`   - ${file}`);
        });
    } else {
        console.log('❌ Prompts directory not found');
        return;
    }
    
    // Test 3: Check elite-multi-gen files
    console.log('\n🔧 Checking elite-multi-gen files...');
    
    const eliteFiles = [
        { name: 'elite-multi-gen.js', required: true },
        { name: 'elite-multi-gen-api.js', required: true }
    ];
    
    eliteFiles.forEach(file => {
        if (fs.existsSync(file.name)) {
            console.log(`✅ ${file.name} exists`);
        } else {
            console.log(`❌ ${file.name} missing`);
        }
    });
    
    // Test 4: Check environment variables
    console.log('\n🔐 Checking environment variables...');
    
    const envVars = [
        'ANTHROPIC_API_KEY',
        'RESEND_API_KEY'
    ];
    
    envVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`✅ ${varName} is set`);
        } else {
            console.log(`❌ ${varName} is not set`);
        }
    });
    
    // Test 5: Try to load elite-multi-gen-api
    console.log('\n📦 Testing elite-multi-gen-api loading...');
    
    try {
        const eliteGen = require('../elite-multi-gen-api');
        console.log('✅ elite-multi-gen-api loaded successfully');
        
        // Test sections list
        const sections = eliteGen.getSectionsList();
        console.log(`✅ getSectionsList() works - found ${sections.length} sections`);
        
    } catch (error) {
        console.log('❌ Error loading elite-multi-gen-api:', error.message);
    }
    
    // Test 6: Server endpoints test
    console.log('\n🌐 Server endpoints that will be available:');
    console.log('   - GET /api/sections - List generated sections');
    console.log('   - GET /temp/sections/:filename - View individual sections');
    console.log('   - GET /temp/final/:filename - View final generated pages');
    
    console.log('\n🎯 Test Summary:');
    console.log('If all checks passed, your Railway deployment will:');
    console.log('✅ Create sections in /temp/sections/ during generation');
    console.log('✅ Create final HTML in /temp/final/');
    console.log('✅ Use the same 13-prompt section-by-section approach as CLI');
    console.log('✅ Allow you to view individual sections via API endpoints');
    
    console.log('\n🚀 To verify in production:');
    console.log('1. Generate a landing page via web interface');
    console.log('2. Visit https://yourapp.railway.app/api/sections');
    console.log('3. Check server logs for "📊 Progress" messages');
    console.log('4. Look for "✅ Generated: X-section.txt" in logs');
}

// Run the test
testSectionGeneration().catch(console.error); 