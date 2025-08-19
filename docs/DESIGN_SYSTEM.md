# Design System Implementation Guide

## Overview
This design system implements the visual tokens and rules extracted from your property management interface, providing consistent styling across the entire application.

## Color Palette

### Brand Colors (Teal)
```css
/* CSS Variables */
--brand-800: #294E4C  /* Primary - nav bar, booking card header */
--brand-700: #2A4D4B  /* Hover state */
--brand-600: #346864  /* Active/focus, outline links */

/* Tailwind Classes */
bg-brand-800  /* Primary background */
bg-brand-700  /* Hover background */
text-brand-600 /* Link text color */
border-brand-600 /* Focus borders */
```

### Surface Colors
```css
/* CSS Variables */
--surface-cream: #FFFDF6  /* Page background */
--surface-card: #FFFFFF   /* Card background */
--surface-tint: #EEF2ED   /* Section tint (policies blocks) */

/* Tailwind Classes */
bg-surface-cream  /* Page background */
bg-surface-card   /* Card background */
bg-surface-tint   /* Tinted sections */
```

### Text Colors
```css
/* CSS Variables */
--text-primary: #1E1F1E    /* Headings/high-contrast */
--text-secondary: #5E6B66  /* Body text */
--text-tertiary: #8A948F   /* Captions/meta */

/* Tailwind Classes */
text-text-primary    /* Main headings */
text-text-secondary  /* Body content */
text-text-tertiary   /* Captions */
```

### Border Colors
```css
/* CSS Variables */
--border-soft: #E6EBE7     /* Primary dividers */
--border-neutral: #E2E8F0  /* Alternative borders */

/* Tailwind Classes */
border-border-soft     /* Soft green-gray borders */
border-border-neutral  /* Neutral gray borders */
```

### Accent Colors
```css
/* CSS Variables */
--accent-whatsapp: #25D366  /* WhatsApp FAB */
--accent-muted: #6B8583     /* Disabled states */

/* Tailwind Classes */
bg-accent-whatsapp  /* WhatsApp button */
bg-accent-muted     /* Disabled elements */
```

## Typography Scale

### Display & Titles
```html
<!-- Display text (40px, bold, tight) -->
<h1 class="text-display">Property Showcase</h1>

<!-- Title text (36px, bold, snug) -->
<h2 class="text-title">Featured Listings</h2>
```

### Headings
```html
<!-- Section heading (24px, semibold) -->
<h3 class="text-heading">Amenities & Features</h3>

<!-- Subheading (22px, semibold) -->
<h4 class="text-subheading">Property Details</h4>
```

### Body & UI Text
```html
<!-- Body text (16px, normal, relaxed) -->
<p class="text-body">Property description and details...</p>

<!-- Button text (16px, semibold) -->
<button class="text-button">Book Now</button>

<!-- Label text (14px, medium) -->
<label class="text-label">Check-in Date</label>

<!-- Caption text (14px, normal, tertiary) -->
<span class="text-caption">Last updated 2 hours ago</span>
```

### Tailwind Typography Classes
```css
/* Also available as Tailwind utilities */
text-display     /* 40px, bold, tight */
text-title       /* 36px, bold, snug */
text-heading     /* 24px, semibold */
text-subheading  /* 22px, semibold */
text-body        /* 16px, normal, loose */
text-button      /* 16px, semibold */
text-label       /* 14px, medium */
text-caption     /* 14px, normal */
```

## Spacing System

### Container & Layout
```html
<!-- Main container (max-width 1240px) -->
<div class="container-main">
  <!-- Content -->
</div>

<!-- Smaller container (max-width 1200px) -->
<div class="container-sm">
  <!-- Content -->
</div>

<!-- Using Tailwind -->
<div class="max-w-container mx-auto px-card">
  <!-- Content -->
</div>
```

### Card Spacing
```html
<!-- Standard card with padding -->
<div class="surface-card">
  <!-- 24px padding -->
</div>

<!-- Large card with padding -->
<div class="surface-card-lg">
  <!-- 32px padding -->
</div>

<!-- Using Tailwind -->
<div class="bg-surface-card rounded-card shadow-card p-card">
  <!-- Content -->
</div>
```

### Grid & Section Gaps
```html
<!-- Gallery grid -->
<div class="grid grid-cols-3 grid-gallery">
  <!-- 12px gaps -->
</div>

<!-- Large gallery grid -->
<div class="grid grid-cols-2 grid-gallery-lg">
  <!-- 16px gaps -->
</div>

<!-- Section stack -->
<div class="flex flex-col stack-section">
  <!-- 24px gaps -->
</div>

<!-- Large section stack -->
<div class="flex flex-col stack-section-lg">
  <!-- 32px gaps -->
</div>
```

### Tailwind Spacing Classes
```css
p-card      /* 24px padding */
p-card-lg   /* 32px padding */
gap-gallery /* 12px gap */
gap-gallery-lg /* 16px gap */
gap-section /* 24px gap */
gap-section-lg /* 32px gap */
```

## Border Radius

### Card & Control Radius
```html
<!-- Card radius (22px) -->
<div class="rounded-card">Card content</div>

<!-- Control radius (12px) -->
<button class="rounded-control">Button</button>

<!-- Small control radius (10px) -->
<input class="rounded-control-sm">
```

### Tailwind Radius Classes
```css
rounded-card       /* 22px - for cards */
rounded-control    /* 12px - for buttons/inputs */
rounded-control-sm /* 10px - for small controls */
```

## Shadows

### Card Shadows
```html
<!-- Standard card shadow -->
<div class="shadow-card">Standard card</div>

<!-- Hover card shadow -->
<div class="shadow-card-hover">Elevated card</div>

<!-- Soft shadow -->
<div class="shadow-soft">Subtle elevation</div>

<!-- Elevated shadow -->
<div class="shadow-elevated">High elevation</div>
```

### CSS Shadow Variables
```css
--shadow-card: 0 2px 6px rgba(16,24,40,0.04), 0 10px 20px rgba(16,24,40,0.06);
--shadow-card-hover: 0 4px 12px rgba(16,24,40,0.08), 0 20px 40px rgba(16,24,40,0.12);
--shadow-soft: 0 4px 12px rgba(0,0,0,0.08);
--shadow-elevated: 0 8px 30px rgba(0,0,0,0.12);
```

## Component Examples

### Brand Buttons
```html
<!-- Primary brand button -->
<button class="btn-brand-primary">
  Book Property
</button>

<!-- Secondary brand button -->
<button class="btn-brand-secondary">
  View Details
</button>

<!-- Using Tailwind -->
<button class="bg-brand-800 hover:bg-brand-700 focus:ring-2 focus:ring-brand-600 text-white font-semibold py-3 px-6 rounded-control transition-colors">
  Custom Button
</button>
```

### Property Cards
```html
<!-- Standard property card -->
<div class="surface-card">
  <img class="rounded-control mb-4" src="property.jpg" alt="Property">
  <h3 class="text-heading mb-2">Luxury Downtown Apartment</h3>
  <p class="text-body mb-4">Beautiful 2-bedroom apartment in the heart of the city...</p>
  <div class="flex justify-between items-center">
    <span class="text-heading">$150/night</span>
    <button class="btn-brand-primary">Book Now</button>
  </div>
</div>
```

### Navigation Bar
```html
<nav class="bg-brand-800 text-white">
  <div class="container-main">
    <div class="flex justify-between items-center py-4">
      <h1 class="text-title text-white">FlexLiving</h1>
      <div class="flex gap-6">
        <a href="/" class="link-brand text-white">Properties</a>
        <a href="/reviews" class="link-brand text-white">Reviews</a>
        <a href="/dashboard" class="link-brand text-white">Dashboard</a>
      </div>
    </div>
  </div>
</nav>
```

### WhatsApp FAB
```html
<!-- WhatsApp floating action button -->
<button class="whatsapp-fab">
  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <!-- WhatsApp icon -->
  </svg>
</button>
```

## Responsive Design

### Mobile Adaptations
```css
/* Typography scales down on mobile */
@media (max-width: 768px) {
  --font-size-display: 32px;    /* down from 40px */
  --font-size-title: 28px;      /* down from 36px */
  --font-size-heading: 20px;    /* down from 24px */
  --font-size-subheading: 18px; /* down from 22px */
  
  /* Spacing reduces on mobile */
  --spacing-card: 16px;         /* down from 24px */
  --spacing-card-lg: 24px;      /* down from 32px */
  --spacing-section: 16px;      /* down from 24px */
  --spacing-section-lg: 24px;   /* down from 32px */
}
```

### Responsive Classes
```html
<!-- Responsive card padding -->
<div class="p-4 md:p-card lg:p-card-lg">
  <!-- Content adapts to screen size -->
</div>

<!-- Responsive typography -->
<h1 class="text-2xl md:text-title lg:text-display">
  Responsive Heading
</h1>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gallery md:gap-gallery-lg">
  <!-- Responsive grid layout -->
</div>
```

## Usage Guidelines

### Do's
✅ Use brand colors for primary actions and navigation  
✅ Apply consistent card styling with shadow-card  
✅ Use the typography scale for hierarchical content  
✅ Maintain proper spacing with the spacing tokens  
✅ Apply surface-cream for page backgrounds  

### Don'ts
❌ Don't use arbitrary colors outside the palette  
❌ Don't mix different shadow styles on the same page  
❌ Don't use inconsistent border radius values  
❌ Don't ignore the spacing system for layouts  
❌ Don't use pure white (#FFFFFF) for page backgrounds  

## Implementation Status

### ✅ Completed
- Color palette definition
- Typography scale
- Spacing system
- Shadow system
- Border radius tokens
- CSS custom properties
- Tailwind configuration
- Component examples

### 🔧 Integration Points
- Update existing components to use new tokens
- Apply surface-cream to page backgrounds
- Implement brand button styles
- Update navigation with brand-800
- Apply consistent card styling

This design system provides a comprehensive foundation for maintaining visual consistency across your property management platform.
