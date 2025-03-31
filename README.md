# MeshtasticBotUI

A React-based user interface for the MeshtasticBot project.

## Development

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later
- Docker (optional, for containerized development)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Build Process

### Docker Build

The application is containerized using a multi-stage Docker build process:

1. Build stage:
   - Uses Node.js 20 Alpine as base
   - Installs dependencies
   - Builds the application
   - Injects version from build argument

2. Production stage:
   - Uses Nginx Alpine as base
   - Serves static files
   - Runs as non-root user for security

### Versioning

The application version is injected during the build process:
- Development: Uses 'development' as default version
- Production: Version is set from GitHub release tag or manual build argument

### Multi-Architecture Support

The Docker image is built for multiple architectures:
- linux/amd64
- linux/arm64

## Deployment

### GitHub Container Registry

Images are automatically built and pushed to GitHub Container Registry (ghcr.io) on:
- Release publication
- Manual workflow trigger

### Available Tags

- `latest` - Latest stable release
- `latest-rc` - Latest release candidate
- `{version}` - Specific version (e.g., v1.0.0)
- `{version}-{platform}` - Platform-specific builds

## Project Structure

```
MeshtasticBotUI/
├── src/                # Source code
│   ├── components/     # React components
│   ├── types/         # TypeScript type definitions
│   └── App.tsx        # Main application component
├── public/            # Static assets
├── deploy/            # Deployment configurations
│   └── docker/        # Docker-related files
└── .github/           # GitHub Actions workflows
```

## Configuration

The application uses a configuration system that:
- Loads default configuration from `config.ts`
- Can be overridden by a remote `config.json`
- Supports environment-specific settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

