# Moreno Chat 💬

A modern, beautiful chat application built with Next.js 15, featuring real-time messaging, friend management, and a stunning splash page with authentication powered by Clerk.

![Moreno Chat](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-cyan)

## ✨ Features

### 🎨 **Beautiful Splash Page**
- Interactive hero section with gradient animations
- Feature showcase with rotating cards
- Realistic phone mockup with chat preview
- User statistics and trust indicators
- Responsive design for all devices

### 💬 **Chat System**
- Real-time messaging interface
- Beautiful chat bubbles with proper styling
- Contact management with online status
- Mobile-responsive design

### 👥 **Social Features**
- Friends management system
- User profiles and settings
- Privacy controls and notifications
- Modern sidebar navigation

### 🔐 **Authentication**
- Secure authentication with Clerk
- Sign-in/Sign-up modals
- Protected routes and middleware
- Automatic redirects for authenticated users

### 🎯 **User Experience**
- Dark and light theme support
- Smooth animations and transitions
- Loading states and error handling
- Professional design system

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Clayton80024/moreno-chat-app.git
   cd moreno-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the application**
   ```bash
   vercel --prod
   ```

4. **Configure environment variables in Vercel Dashboard**
   - Go to your project settings in Vercel
   - Add all environment variables from your `.env.local` file
   - Redeploy the application

### Deploy to GitHub Pages

The repository includes GitHub Actions workflows for automatic deployment:

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source

2. **Add repository secrets**
   - Go to repository Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

3. **Push to main branch**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

The application will be automatically deployed to `https://yourusername.github.io/moreno-chat-app/`

## 🏗️ Project Structure

```
moreno-chat-app/
├── app/                    # Next.js App Router
│   ├── chats/             # Chat page
│   ├── friends/           # Friends management
│   ├── profile/           # User profile
│   ├── settings/          # App settings
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── SplashPage.tsx     # Landing page component
│   ├── LayoutWrapper.tsx  # Layout with auth logic
│   ├── Sidebar.tsx        # Desktop navigation
│   └── MobileSidebar.tsx  # Mobile navigation
├── public/                # Static assets
├── .github/workflows/     # GitHub Actions
├── middleware.ts          # Clerk middleware
└── tailwind.config.ts     # Tailwind configuration
```

## 🎨 Design System

### Colors
- **Primary**: Purple gradient (`from-primary-500 to-accent-500`)
- **Accent**: Blue tones for highlights
- **Chat Bubbles**: Sent (purple), Received (gray)
- **Status**: Online (green), Offline (red), Away (yellow)

### Typography
- **Font**: Inter (system font)
- **Sizes**: Responsive scale from text-xs to text-7xl
- **Weights**: Regular (400) to Bold (700)

### Animations
- **Transitions**: Smooth hover effects
- **Loading**: Pulse animations
- **Page Entrance**: Staggered fade-ins

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 with App Router
- **Frontend**: React 19.1.0, TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Authentication**: Clerk
- **Icons**: Heroicons
- **Deployment**: Vercel / GitHub Pages

## 📱 Features Showcase

### Splash Page Flow
1. **Hero Section**: Engaging introduction with CTAs
2. **Features**: Interactive showcase of app capabilities
3. **Phone Mockup**: Live preview of chat interface
4. **Statistics**: User trust indicators
5. **Final CTA**: Conversion-focused sign-up section

### Authentication Flow
1. **Unauthenticated**: Beautiful splash page
2. **Sign Up/In**: Clerk modal overlays
3. **Authenticated**: Automatic redirect to chat app
4. **Protected Routes**: Middleware-based protection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Demo**: [Deployed Application](https://your-deployment-url.vercel.app)
- **Repository**: [GitHub](https://github.com/Clayton80024/moreno-chat-app)
- **Documentation**: [Clerk Docs](https://clerk.com/docs)

---

Built with ❤️ using Next.js and Clerk
