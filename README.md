# Unruly Abstractions

A minimal, elegant portfolio website for academic papers and writings on complex systems, philosophy, and abstract thinking.

## Features

- **Responsive Design**: Optimized for both desktop and mobile viewing
- **Dynamic Paper Loading**: Automatically loads available papers from JSON configuration or by scanning for common filenames
- **404 Redirects**: Smart redirects for legacy URLs (pdf/ and papers/ paths redirect to pdfs/)
- **Minimal Design**: Clean pink (#C85D76) aesthetic with subtle animations
- **Performance Optimized**: Single-page application with smooth transitions

## Structure

```
/
├── index.html          # Main page with embedded CSS and JavaScript
├── 404.html           # Custom 404 page with redirect logic
├── CNAME              # GitHub Pages custom domain configuration
└── pdfs/              # Directory containing PDF papers
    ├── papers.json    # Paper configuration file (optional)
    └── *.pdf          # Paper files
```

## Configuration

### Adding Papers

Papers can be added in two ways:

1. **JSON Configuration** (recommended): Edit `pdfs/papers.json`:
```json
{
  "papers": [
    {
      "filename": "wanderings",
      "displayName": "Category-Theoretic Wanderings into Interpretability"
    }
  ]
}
```

2. **Automatic Detection**: Place PDF files in `pdfs/` directory. The system will check for common paper names: `wanderings`, `abstractions`, `thoughts`, `essays`.

### Styling

The website uses a single HTML file with embedded CSS. Key design elements:

- **Color Scheme**: Pink background (#C85D76) with white text
- **Typography**: Inter font family with varied weights
- **Layout**: CSS Grid for desktop, Flexbox for mobile
- **Animations**: Subtle slide-in animations and floating effects

## Deployment

This site is designed for GitHub Pages deployment:

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Set custom domain in CNAME file (optional)

The site works as a static site on any web server.

## Browser Support

- Modern browsers with CSS Grid support
- Mobile-responsive (tested on iOS and Android)
- Progressive enhancement for older browsers

## License

This project is open source. Feel free to use as a template for your own academic portfolio.