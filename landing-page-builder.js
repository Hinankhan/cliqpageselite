class LandingPageBuilder {
    constructor() {
        this.form = document.getElementById('landingPageForm');
        this.progressSection = document.getElementById('progressSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.generateBtn = document.getElementById('generateBtn');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
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
        return {
            companyName: document.getElementById('companyName').value,
            businessDescription: document.getElementById('businessDescription').value,
            targetAudience: document.getElementById('targetAudience').value,
            primaryColor: document.getElementById('primaryColor').value,
            secondaryColor: document.getElementById('secondaryColor').value,
            primaryGoal: document.getElementById('primaryGoal').value,
            industry: document.getElementById('industry').value
        };
    }

    showProgress() {
        this.progressSection.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Generating...';
    }

    hideProgress() {
        this.progressSection.classList.add('hidden');
        this.generateBtn.disabled = false;
        this.generateBtn.textContent = 'Generate Landing Page';
    }

    updateProgress(percentage, text) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    async generateLandingPage(formData) {
        try {
            // Start generation
            this.updateProgress(10, 'Initializing generation...');
            
            const response = await fetch('/api/generate-landing-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle response
            const result = await response.json();
            this.handleGenerationComplete(result);

        } catch (error) {
            console.error('Generation error:', error);
            this.showError('Failed to generate landing page. Please try again.');
        }
    }

    handleGenerationComplete(result) {
        this.hideProgress();
        this.showResults(result);
    }

    showResults(result) {
        this.resultsSection.classList.remove('hidden');
        
        // Set up preview and download links
        const previewBtn = document.getElementById('previewBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (result.filename) {
            previewBtn.href = `/temp/final/${result.filename}`;
            downloadBtn.href = `/api/download/${result.filename}`;
            downloadBtn.download = result.filename;
        }
    }

    showError(message) {
        this.hideProgress();
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.bg-red-100');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message after the form
        this.form.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandingPageBuilder();
});
