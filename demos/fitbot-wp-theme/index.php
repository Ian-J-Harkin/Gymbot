<?php get_header(); ?>

<!-- Hero Section -->
<section class="relative h-screen min-h-[700px] flex items-end">
    <!-- Notice how we reference the image relative to the active theme directory -->
    <img src="<?php echo get_template_directory_uri(); ?>/assets/images/hero-gym.jpg" alt="Interior of Forge private training club" class="absolute inset-0 w-full h-full object-cover">
    <div class="absolute inset-0 bg-background/60"></div>

    <div class="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20 lg:pb-28">
        <div class="max-w-3xl">
            <p class="text-sm uppercase tracking-[0.3em] text-primary mb-6">
                Exclusive Members-Only Facility
            </p>
            <h1 class="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-foreground text-balance">
                Where discipline meets distinction
            </h1>
            <p class="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                A private training club built for professionals who demand precision
                in every aspect of their lives.
            </p>
            <div class="mt-10 flex flex-col sm:flex-row gap-4">
                <a href="#membership" class="inline-flex h-14 items-center justify-center px-8 text-sm uppercase tracking-[0.15em] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    View Membership
                </a>
                <a href="#philosophy" class="inline-flex h-14 items-center justify-center px-8 text-sm uppercase tracking-[0.15em] font-medium border border-foreground/20 text-foreground hover:border-primary hover:text-primary transition-colors">
                    Our Philosophy
                </a>
            </div>
        </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <!-- Lucide Arrow Down SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-muted-foreground"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
    </div>
</section>

<!-- Philosophy Section -->
<section id="philosophy" class="py-24 lg:py-32 bg-background">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
                <p class="text-sm uppercase tracking-[0.3em] text-primary mb-4">Our Philosophy</p>
                <h2 class="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground text-balance">Built for those who build empires</h2>
                <p class="mt-8 text-lg text-muted-foreground leading-relaxed max-w-lg">
                    Forge was created from a singular conviction: that the men who shape industries deserve a training environment as disciplined and refined as their professional lives. No distractions. No compromise.
                </p>
            </div>
            <div class="relative aspect-[4/5] lg:aspect-[3/4]">
                <img src="<?php echo get_template_directory_uri(); ?>/assets/images/about-gym.jpg" alt="Premium equipment at Forge" class="absolute inset-0 w-full h-full object-cover">
                <div class="absolute inset-0 border border-primary/20"></div>
            </div>
        </div>
        
        <div class="mt-24 grid md:grid-cols-3 gap-12 lg:gap-16">
            <div class="group">
                <span class="text-sm font-mono text-primary">01</span>
                <h3 class="mt-3 font-serif text-2xl font-semibold text-foreground">Precision</h3>
                <div class="mt-3 h-px w-12 bg-primary group-hover:w-24 transition-all duration-500"></div>
                <p class="mt-4 text-muted-foreground leading-relaxed">Every program is engineered with scientific rigor. No guesswork, no filler — only methodologies that deliver measurable results.</p>
            </div>
            <div class="group">
                <span class="text-sm font-mono text-primary">02</span>
                <h3 class="mt-3 font-serif text-2xl font-semibold text-foreground">Efficiency</h3>
                <div class="mt-3 h-px w-12 bg-primary group-hover:w-24 transition-all duration-500"></div>
                <p class="mt-4 text-muted-foreground leading-relaxed">Your time is your most valuable asset. Our sessions are designed to maximize output within your schedule, not consume it.</p>
            </div>
            <div class="group">
                <span class="text-sm font-mono text-primary">03</span>
                <h3 class="mt-3 font-serif text-2xl font-semibold text-foreground">Privacy</h3>
                <div class="mt-3 h-px w-12 bg-primary group-hover:w-24 transition-all duration-500"></div>
                <p class="mt-4 text-muted-foreground leading-relaxed">A members-only environment with limited capacity. Train alongside peers who share your drive, not a crowded gym floor.</p>
            </div>
        </div>
    </div>
</section>

<!-- Full Image Break -->
<section class="relative h-[50vh] min-h-[400px] lg:h-[60vh]">
    <img src="<?php echo get_template_directory_uri(); ?>/assets/images/training.jpg" alt="Training at Forge" class="absolute inset-0 w-full h-full object-cover">
    <div class="absolute inset-0 bg-background/40"></div>
    <div class="absolute inset-0 flex items-center justify-center">
        <blockquote class="text-center px-6 max-w-3xl">
            <p class="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">"The body achieves what the mind believes."</p>
            <cite class="block mt-6 text-sm uppercase tracking-[0.2em] text-primary not-italic">Forge Ethos</cite>
        </blockquote>
    </div>
</section>

<?php get_footer(); ?>
