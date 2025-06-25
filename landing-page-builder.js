class LandingPageBuilder {
    constructor() {
        this.form = document.getElementById('landingPageForm');
        this.progressSection = document.getElementById('progressSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.generateBtn = document.getElementById('generateBtn');
        this.generateBtnText = document.getElementById('generateBtnText');
        
        this.originalButtonText = 'Generate My Landing Page';
        this.isGenerating = false;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.setupValidation();
        this.setupColorSyncers();
        this.setupFloatingLabels();
    }

    setupValidation() {
        // Real-time validation for all required fields
        const requiredFields = ['email', 'companyName', 'businessDescription', 'targetAudience', 'primaryGoal'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });

        // Email validation
        document.getElementById('email').addEventListener('input', this.validateEmail.bind(this));
        document.getElementById('businessEmail').addEventListener('input', this.validateBusinessEmail.bind(this));
        
        // Page style validation
        const pageStyleInputs = document.querySelectorAll('input[name="pageStyle"]');
        pageStyleInputs.forEach(input => {
            input.addEventListener('change', () => this.validatePageStyle());
        });
    }

    setupColorSyncers() {
        // Sync color picker with hex input
        const primaryColorPicker = document.getElementById('primaryColor');
        const primaryColorHex = document.getElementById('primaryColorHex');
        const secondaryColorPicker = document.getElementById('secondaryColor');
        const secondaryColorHex = document.getElementById('secondaryColorHex');

        primaryColorPicker.addEventListener('input', (e) => {
            primaryColorHex.value = e.target.value;
        });

        primaryColorHex.addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                primaryColorPicker.value = e.target.value;
            }
        });

        secondaryColorPicker.addEventListener('input', (e) => {
            secondaryColorHex.value = e.target.value;
        });

        secondaryColorHex.addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                secondaryColorPicker.value = e.target.value;
            }
        });
    }

    setupFloatingLabels() {
        // Enhanced floating label behavior
        const floatingInputs = document.querySelectorAll('.form-floating input, .form-floating textarea');
        
        floatingInputs.forEach(input => {
            // Check if input has value on page load
            if (input.value) {
                input.parentElement.classList.add('has-value');
            }
            
            input.addEventListener('input', () => {
                if (input.value) {
                    input.parentElement.classList.add('has-value');
                } else {
                    input.parentElement.classList.remove('has-value');
                }
            });
        });
    }

    isValidHex(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (fieldId) {
            case 'email':
                isValid = this.isValidEmail(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'companyName':
                isValid = value.length >= 2;
                errorMessage = 'Company name must be at least 2 characters';
                break;
            case 'businessDescription':
                isValid = value.length >= 10;
                errorMessage = 'Please provide a more detailed business description (at least 10 characters)';
                break;
            case 'targetAudience':
                isValid = value.length >= 3;
                errorMessage = 'Please describe your target audience (at least 3 characters)';
                break;
            case 'primaryGoal':
                isValid = value !== '';
                errorMessage = 'Please select your primary goal';
                break;
        }

        this.setFieldValidation(fieldId, isValid, errorMessage);
        return isValid;
    }

    validateEmail() {
        const email = document.getElementById('email').value.trim();
        const isValid = this.isValidEmail(email);
        this.setFieldValidation('email', isValid, 'Please enter a valid email address');
        return isValid;
    }

    validateBusinessEmail() {
        const email = document.getElementById('businessEmail').value.trim();
        if (email === '') return true; // Optional field
        const isValid = this.isValidEmail(email);
        this.setFieldValidation('businessEmail', isValid, 'Please enter a valid business email address');
        return isValid;
    }

    validatePageStyle() {
        const pageStyleInputs = document.querySelectorAll('input[name="pageStyle"]');
        const isValid = Array.from(pageStyleInputs).some(input => input.checked);
        
        if (!isValid) {
            this.showError('Please select a page style');
        }
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setFieldValidation(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentElement.querySelector('.invalid-feedback');
        
        if (isValid) {
            field.classList.remove('input-error', 'field-error');
            field.classList.add('input-valid', 'field-success');
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
        } else {
            field.classList.remove('input-valid', 'field-success');
            field.classList.add('input-error', 'field-error');
            if (errorElement) {
                errorElement.textContent = errorMessage;
                errorElement.classList.remove('hidden');
            }
        }
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentElement.querySelector('.invalid-feedback');
        
        field.classList.remove('input-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    validateForm() {
        let isValid = true;
        
        // Validate all required fields
        const requiredFields = ['email', 'companyName', 'businessDescription', 'targetAudience', 'primaryGoal'];
        
        requiredFields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        // Validate page style
        if (!this.validatePageStyle()) {
            isValid = false;
        }

        // Validate business email if provided
        if (!this.validateBusinessEmail()) {
            isValid = false;
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isGenerating) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showError('Please fix the errors above before generating your landing page.');
            return;
        }
        
        const formData = this.getFormData();
        
        // Show progress section
        this.showProgress();
        
        try {
            await this.generateLandingPage(formData);
        } catch (error) {
            console.error('Error generating landing page:', error);
            this.showError('Failed to generate landing page. Please try again.');
        }
    }

    getFormData() {
        const pageStyleElement = document.querySelector('input[name="pageStyle"]:checked');
        
        return {
            email: document.getElementById('email').value.trim(),
            businessEmail: document.getElementById('businessEmail').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            websiteUrl: document.getElementById('websiteUrl').value.trim(),
            companyName: document.getElementById('companyName').value.trim(),
            businessDescription: document.getElementById('businessDescription').value.trim(),
            targetAudience: document.getElementById('targetAudience').value.trim(),
            pageStyle: pageStyleElement ? pageStyleElement.value : '',
            primaryGoal: document.getElementById('primaryGoal').value,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            customInstructions: document.getElementById('customInstructions').value.trim(),
            
            // Map to backend expected field names
            businessName: document.getElementById('companyName').value.trim(),
            business_description: document.getElementById('businessDescription').value.trim(),
            target_audience: document.getElementById('targetAudience').value.trim(),
            page_style: pageStyleElement ? pageStyleElement.value : '',
            primary_goal: document.getElementById('primaryGoal').value,
            primary_color: document.getElementById('primaryColor').value,
            secondary_color: document.getElementById('secondaryColor').value,
            custom_instructions: document.getElementById('customInstructions').value.trim(),
            business_email: document.getElementById('businessEmail').value.trim(),
            phone_number: document.getElementById('phoneNumber').value.trim(),
            website_url: document.getElementById('websiteUrl').value.trim(),
        };
    }

    showProgress() {
        this.isGenerating = true;
        this.progressSection.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
        this.generateBtn.disabled = true;
        this.generateBtnText.textContent = 'Generating...';
        
        // Smooth scroll to progress section
        this.progressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hide any existing error messages
        this.clearAllErrors();
    }

    hideProgress() {
        this.isGenerating = false;
        this.progressSection.classList.add('hidden');
        this.generateBtn.disabled = false;
        this.generateBtnText.textContent = this.originalButtonText;
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    async generateLandingPage(formData) {
        try {
            // Simulate progress updates
            this.updateProgress(5, 'Connecting to AI...');
            
            const response = await fetch('/api/generate-landing-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            this.updateProgress(20, 'AI analyzing your business...');

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            this.updateProgress(50, 'Generating content sections...');

            // Handle response
            const result = await response.json();
            
            this.updateProgress(80, 'Finalizing your landing page...');
            
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.updateProgress(100, 'Complete! Your landing page is ready.');
            
            // Another small delay before showing results
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.handleGenerationComplete(result);

        } catch (error) {
            console.error('Generation error:', error);
            this.hideProgress();
            
            // Show specific error messages
            if (error.message.includes('overloaded')) {
                this.showError('The AI service is currently overloaded. Please try again in a few minutes.');
            } else if (error.message.includes('timeout')) {
                this.showError('The request took too long to process. Please try again.');
            } else if (error.message.includes('Invalid request')) {
                this.showError('Please check your input and try again.');
            } else {
                this.showError('Failed to generate landing page. Please try again.');
            }
        }
    }

    handleGenerationComplete(result) {
        this.hideProgress();
        
        if (result.success) {
            this.showResults(result);
        } else {
            this.showError(result.message || 'Generation failed. Please try again.');
        }
    }

    showResults(result) {
        this.resultsSection.classList.remove('hidden');
        
        // Set up preview and download links
        const previewBtn = document.getElementById('previewBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (result.fileName) {
            previewBtn.href = `/temp/final/${result.fileName}`;
            downloadBtn.href = `/api/download/${result.fileName}`;
            downloadBtn.download = result.fileName;
        }
        
        // Smooth scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Show success message
        this.showSuccess('🎉 Your landing page has been generated successfully!');
    }

    showError(message) {
        this.clearAllErrors();
        this.createToast(message, 'error');
    }

    showSuccess(message) {
        this.createToast(message, 'success');
    }

    createToast(message, type = 'error') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            error: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                   </svg>`,
            success: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                     </svg>`,
            warning: `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                     </svg>`
        };

        toast.innerHTML = `
            <div class="flex items-center">
                ${icons[type] || icons.error}
                <span class="flex-1">${message}</span>
                <button class="ml-2 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after timeout
        const timeout = type === 'success' ? 5000 : 8000;
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, timeout);
    }

    clearAllErrors() {
        // Remove any existing toast messages
        const existingMessages = document.querySelectorAll('.toast');
        existingMessages.forEach(message => message.remove());
        
        // Clear form field errors
        const errorElements = document.querySelectorAll('.invalid-feedback');
        errorElements.forEach(element => element.classList.add('hidden'));
        
        const errorInputs = document.querySelectorAll('.input-error, .field-error');
        errorInputs.forEach(input => {
            input.classList.remove('input-error', 'field-error');
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandingPageBuilder();
    
    // Add some nice animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Observe all form sections for scroll animations
    document.querySelectorAll('form > div').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});
