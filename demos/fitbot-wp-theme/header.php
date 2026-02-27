<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    
    <!-- Load Tailwind CSS via Play CDN for this demo theme to avoid node_modules overhead -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        background: "hsl(240, 10%, 3.9%)",
                        foreground: "hsl(0, 0%, 98%)",
                        primary: "hsl(0, 0%, 98%)",
                        'primary-foreground': "hsl(240, 5.9%, 10%)",
                        muted: "hsl(240, 3.7%, 15.9%)",
                        'muted-foreground': "hsl(240, 5%, 64.9%)"
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        serif: ['Playfair Display', 'serif']
                    }
                }
            }
        }
    </script>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    
    <style>
        body {
            background-color: theme('colors.background');
            color: theme('colors.foreground');
        }
    </style>

    <?php wp_head(); ?>
</head>
<body <?php body_class('min-h-screen bg-background font-sans antialiased text-foreground'); ?>>
    <?php wp_body_open(); ?>
    
    <!-- Minimum Viable Header -->
    <header class="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <span class="font-serif text-2xl tracking-widest uppercase font-bold text-white">FORGE</span>
            <nav class="hidden md:flex gap-8">
                <a href="#philosophy" class="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Philosophy</a>
                <a href="#facility" class="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Facility</a>
                <a href="#membership" class="text-sm font-medium text-muted-foreground hover:text-white transition-colors">Apply</a>
            </nav>
        </div>
    </header>
    
    <main class="flex-grow pt-20">
