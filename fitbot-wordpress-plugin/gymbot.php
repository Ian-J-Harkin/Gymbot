<?php
/**
 * Plugin Name: FitBot Chat Widget
 * Description: Embed the FitBot AI assistant on your gym's website.
 * Version: 1.0.0
 * Author: FitBot AI Team
 */

if (!defined('ABSPATH')) {
    exit;
}

class FitBot_Widget
{
    public function __construct()
    {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
        add_action('wp_footer', array($this, 'inject_widget'));
    }

    public function add_admin_menu()
    {
        add_options_page(
            'FitBot Settings',
            'FitBot',
            'manage_options',
            'fitbot',
            array($this, 'settings_page')
        );
    }

    public function settings_init()
    {
        register_setting('fitbot_settings', 'fitbot_api_key');

        add_settings_section(
            'fitbot_section',
            'Connection Settings',
            null,
            'fitbot'
        );

        add_settings_field(
            'fitbot_api_key',
            'FitBot API Key',
            array($this, 'api_key_render'),
            'fitbot',
            'fitbot_section'
        );
    }

    public function api_key_render()
    {
        $value = get_option('fitbot_api_key');
?>
        <input type='text' name='fitbot_api_key' value='<?php echo esc_attr($value); ?>' class='regular-text'>
        <p class='description'>Find your API key in the FitBot Admin Dashboard.</p>
        <?php
    }

    public function settings_page()
    {
?>
        <div class="wrap">
            <h1>FitBot AI Settings</h1>
            <form action="options.php" method="post">
                <?php
        settings_fields('fitbot_settings');
        do_settings_sections('fitbot');
        submit_button();
?>
            </form>
        </div>
        <?php
    }

    public function inject_widget()
    {
        $api_key = get_option('fitbot_api_key');
        if (!$api_key) {
            return;
        }

        // In a production environment, this would point to a CDN.
        // For development/demo, we can assume a known URL or local path.
        // Local integration test path
        $script_url = '/widget-dist/gymbot.min.js';

?>
        <script 
            src="<?php echo esc_url($script_url); ?>" 
            data-api-key="<?php echo esc_attr($api_key); ?>" 
            async>
        </script>
        <?php
    }
}

new FitBot_Widget();
