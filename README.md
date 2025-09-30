# Amela Cleaning Portal

**Version**: 1.0.0  
**Release Date**: September 30, 2025

A comprehensive cleaning management portal built for efficient booking and staff coordination.

## 🎯 Project Overview

The Amela Cleaning Portal is a modern web application designed to streamline cleaning service operations. It provides an intuitive interface for managing bookings, coordinating cleaning staff, and maintaining property information.

**Live Demo**: https://lovable.dev/projects/e5b83bdb-6160-487b-9b9b-edf54d51ab06

## ✨ Version 1.0 Features

### 📅 Calendar Management
- Interactive calendar view with booking visualization
- Date navigation and filtering
- Real-time booking updates
- Mobile-responsive design

### 🏠 Booking System
- Comprehensive booking management
- Guest information tracking
- Check-in/check-out handling
- Platform integration support
- Customizable booking card display

### 👥 Staff Portal
- Dedicated cleaning staff interface
- Task assignment and tracking
- Status management
- Notes and communication tools

### ⚙️ Admin Configuration
- Fully configurable booking card settings
- Mobile visibility controls
- Field display toggles
- Category-based organization

### 📱 Progressive Web App
- Offline functionality
- App installation support
- Push notifications
- Pull-to-refresh capability

### 🎨 Modern UI/UX
- Responsive design for all devices
- Dark/light theme support
- Toast notifications
- Loading states and error handling

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e5b83bdb-6160-487b-9b9b-edf54d51ab06) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 🛠️ Technology Stack

This project is built with modern web technologies:

### Frontend
- **React 18** - Modern React with hooks and TypeScript
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React component library

### Backend & Data
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **React Query** - Data fetching and caching
- **React Hook Form** - Form state management

### UI & Styling
- **Lucide React** - Beautiful SVG icons
- **Next Themes** - Dark/light mode support
- **Tailwind Animate** - CSS animations
- **Sonner** - Toast notifications

### PWA & Mobile
- **Vite PWA Plugin** - Progressive Web App features
- **Workbox** - Service worker utilities

### Development Tools
- **ESLint** - Code linting and quality
- **Date-fns** - Date manipulation utilities
- **Class Variance Authority** - Type-safe component variants

## 📋 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Configure your Supabase credentials

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment Options

### Lovable Platform (Recommended)
1. Open your [Lovable Project](https://lovable.dev/projects/e5b83bdb-6160-487b-9b9b-edf54d51ab06)
2. Click **Publish** in the top-right corner
3. Your app will be deployed automatically

### Custom Domain
- Navigate to Project > Settings > Domains
- Click **Connect Domain** and follow the setup instructions
- DNS propagation may take up to 24-48 hours

### Self-Hosting
The application can be deployed to any static hosting service:
- Vercel
- Netlify  
- AWS S3 + CloudFront
- GitHub Pages

## 📖 Usage Guide

### Admin Panel
1. Access the settings panel via the gear icon
2. Configure booking card display options
3. Set mobile visibility preferences
4. Manage staff and property information

### Staff Portal
1. Navigate to the cleaning portal
2. View assigned tasks and bookings
3. Update task status and add notes
4. Access contact information when needed

### Mobile Usage
- Install as PWA for better mobile experience
- Settings button visibility controlled by admin
- Full offline functionality available

## 🔧 Configuration

### Booking Card Settings
The admin can customize which fields are displayed on booking cards:

- **Guest Information**: Names, phone, email, guest count
- **Booking Details**: Dates, status, platform, amount
- **Cleaning Tasks**: Task assignments, status, notes
- **Mobile Settings**: Control button visibility on mobile devices

### Environment Variables
Required environment variables (configured in Lovable Cloud):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🤝 Contributing

### Development Workflow
1. Create a feature branch from main
2. Make your changes following the existing code style
3. Test thoroughly on both desktop and mobile
4. Submit a pull request with clear description

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Implement responsive design patterns
- Add proper error handling

## 📚 Documentation

- **[Lovable Documentation](https://docs.lovable.dev/)** - Platform features and guides
- **[Supabase Docs](https://supabase.com/docs)** - Backend services documentation
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Component library

## 🐛 Support & Issues

For bug reports and feature requests:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs
4. Specify browser and device information

## 📄 License

This project is part of the Lovable platform. Please refer to Lovable's terms of service for usage rights and restrictions.

## 🚀 Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and release notes.

---

**Version 1.0.0** - Initial release with full cleaning portal functionality
