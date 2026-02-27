<?php
/**
 * Theme Functions
 */

function fitbot_theme_setup()
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
}
add_action('after_setup_theme', 'fitbot_theme_setup');

// Enqueue standard stylesheet (Tailwind is loaded via CDN in header.php for this demo)
function fitbot_theme_scripts()
{
    wp_enqueue_style('fitbot-theme-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
}
add_action('wp_enqueue_scripts', 'fitbot_theme_scripts');
