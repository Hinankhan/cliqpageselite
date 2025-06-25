# 🚀 CliqPages Elite - AI Landing Page Generator

A powerful, AI-driven landing page generator that creates professional, conversion-focused landing pages using Claude AI. Built with a modular architecture supporting both CLI and web interfaces.

## ✨ Features

- **🤖 Advanced AI Integration**: Powered by Claude 3.5 Sonnet for superior content generation
- **📱 Fully Responsive**: Mobile-first design with Tailwind CSS
- **⚡ Conversion Optimized**: Built specifically for lead generation and sales
- **🎨 Dynamic Branding**: Custom colors and intelligent design variations
- **🔧 Dual Interface**: CLI generator + modern web interface
- **🚀 Railway Ready**: One-click deployment to Railway

## 🛠️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Deployment**: Railway
- **Architecture**: Modular, scalable design

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Hinankhan/cliqpageselite.git
cd cliqpageselite

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env-example.txt .env

# Edit .env with your API keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. Get Your API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up and get API access
3. Create a new API key
4. Add it to your `.env` file

### 4. Run the Application

#### Phase 1 - CLI Generator
```bash
node elite-multi-gen.js
```

#### Phase 2 - Web Interface
```bash
npm start
# Visit: http://localhost:3000
```

## 📁 Project Structure

```
cliqpageselite/
├── 🎯 Phase 1 - CLI Generator
│   ├── elite-multi-gen.js      # Main generator script
│   └── prompts/                # 13 AI prompt templates
│       ├── 1-head.txt          # HTML head + CSS
│       ├── 2-hero.txt          # Hero section
│       ├── 3-features.txt      # Features section
│       ├── 4-testimonials.txt  # Social proof
│       ├── 5-pricing.txt       # Pricing section
│       ├── 6-faq.txt           # FAQ section
│       ├── 7-contact.txt       # Contact form
│       ├── 8-footer.txt        # Footer
│       └── 9-js.txt            # JavaScript functionality
│
├── 🌐 Phase 2 - Web Interface
│   ├── server.js               # Express server
│   ├── index.html              # Web interface
│   ├── landing-page-builder.js # Frontend logic
│   ├── styles.css              # Custom styling
│   └── temp/                   # Generated files
│       ├── sections/           # Temp sections
│       └── final/              # Final HTML files
│
└── 🔧 Configuration
    ├── package.json            # Dependencies
    ├── env-example.txt         # Environment template
    ├── railway.json            # Railway deployment
    └── README.md               # This file
```

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `cliqpageselite` repository

2. **Set Environment Variables**:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PORT=3000
   NODE_ENV=production
   ```

3. **Deploy**:
   - Railway will automatically detect the configuration
   - Your app will be live at your Railway URL

### Manual Deployment

```bash
# Build for production
npm install --production

# Start the server
npm start
```

## 🎯 How It Works

### Phase 1 - CLI Generator
1. **Context Creation**: Builds global context from user input
2. **Section Generation**: Uses 13 specialized prompts for each section
3. **AI Processing**: Claude generates content for each section
4. **Assembly**: Combines sections into final HTML
5. **Output**: Saves production-ready landing page

### Phase 2 - Web Interface
1. **User Input**: Modern form with company details and preferences
2. **Real-time Progress**: Live updates during generation
3. **AI Generation**: Backend processes using CLI generator
4. **Preview & Download**: Instant preview and download options

## 🎨 Design System

- **6 Design Variations**: Modern-minimal, Bold-dynamic, Professional-clean, etc.
- **Dynamic Color System**: Uses user's brand colors throughout
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Conversion Focus**: Optimized CTAs and layout for lead generation

## 🔐 Security

- ✅ No hardcoded API keys
- ✅ Environment variable configuration
- ✅ GitHub security scan compliant
- ✅ Production-ready security practices

## 📊 Performance

- **Generation Time**: ~2-3 minutes per landing page
- **Output Quality**: Production-ready, pixel-perfect HTML
- **Mobile Performance**: Optimized for all device sizes
- **SEO Ready**: Clean HTML structure and meta tags

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**: Ensure `ANTHROPIC_API_KEY` is set correctly
2. **Port Issues**: Check if port 3000 is available
3. **Generation Fails**: Verify API key has sufficient credits
4. **File Permissions**: Ensure write permissions for temp directories

### Debug Mode

```bash
DEBUG=true node elite-multi-gen.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📧 Email: [Create an issue](https://github.com/Hinankhan/cliqpageselite/issues)
- 📖 Documentation: Check the `/docs` folder
- 🐛 Bug Reports: Use GitHub Issues

---

**Built with ❤️ for creating beautiful, converting landing pages at scale.** 