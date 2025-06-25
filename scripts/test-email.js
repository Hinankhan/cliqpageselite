#!/usr/bin/env node

/**
 * Test script to verify Resend email functionality
 * Run with: node scripts/test-email.js your-email@example.com
 */

require('dotenv').config();

async function testEmailSending() {
    console.log('📧 Testing Resend Email Functionality...\n');
    
    // Check if email argument provided
    const testEmail = process.argv[2];
    if (!testEmail) {
        console.log('❌ Please provide a test email address:');
        console.log('   node scripts/test-email.js your-email@example.com');
        return;
    }
    
    // Check environment variables
    console.log('🔐 Checking environment variables...');
    if (!process.env.RESEND_API_KEY) {
        console.log('❌ RESEND_API_KEY not found in environment');
        console.log('💡 Make sure to set it in your Railway environment variables');
        return;
    } else {
        console.log('✅ RESEND_API_KEY is set');
    }
    
    try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        console.log('\n📤 Sending test email...');
        
        const fromEmail = process.env.FROM_EMAIL || 'CliqPages <onboarding@resend.dev>';
        
        const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 30px; border-radius: 8px; }
                .header { color: #28a745; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">✅ Email Test Successful!</h1>
                <p>This is a test email from your CliqPages Elite system.</p>
                <p><strong>Test Details:</strong></p>
                <ul>
                    <li>From: ${fromEmail}</li>
                    <li>To: ${testEmail}</li>
                    <li>Time: ${new Date().toISOString()}</li>
                    <li>System: CliqPages Elite Email Test</li>
                </ul>
                <p>If you received this email, your Resend integration is working correctly! 🎉</p>
            </div>
        </body>
        </html>`;
        
        const result = await resend.emails.send({
            from: fromEmail,
            to: [testEmail],
            subject: '✅ CliqPages Email Test - Success!',
            html: testHtml
        });
        
        console.log('✅ Email sent successfully!');
        console.log('📧 Email ID:', result.data?.id || 'Unknown');
        console.log('📨 From:', fromEmail);
        console.log('📬 To:', testEmail);
        console.log('\n🎯 Check your inbox (and spam folder) for the test email.');
        
    } catch (error) {
        console.error('❌ Email test failed:');
        console.error('🔍 Error:', error.message);
        console.error('🔍 Error type:', error.name);
        
        if (error.message.includes('401')) {
            console.log('\n💡 Troubleshooting: API key might be invalid');
        } else if (error.message.includes('domain')) {
            console.log('\n💡 Troubleshooting: Domain not verified with Resend');
        } else if (error.message.includes('rate')) {
            console.log('\n💡 Troubleshooting: Rate limit exceeded');
        }
    }
}

if (require.main === module) {
    testEmailSending().catch(console.error);
}

module.exports = { testEmailSending }; 