<?php
/**
 * Plugin Name: FitBot Chat Widget
 * Description: Embed the FitBot AI assistant on your gym's website.
 * Version: 1.1.0
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
            'FitBot Setup',
            'FitBot',
            'manage_options',
            'fitbot',
            array($this, 'settings_page')
        );
    }

    public function settings_init()
    {
        // Register the settings allowing WordPress to handle saving it automatically
        register_setting('fitbot_settings', 'fitbot_api_key');
        register_setting('fitbot_settings', 'fitbot_api_url');
        register_setting('fitbot_settings', 'fitbot_script_url');
    }

    public function settings_page()
    {
        $api_key = get_option('fitbot_api_key');
        $api_url = get_option('fitbot_api_url', 'http://localhost:3000/api');
        $script_url = get_option('fitbot_script_url', 'http://localhost:5173/gymbot.min.js');
        $is_connected = !empty($api_key);
?>
        <style>
            .fitbot-wrap { max-width: 600px; margin: 40px auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.05); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif; }
            .fitbot-header { text-align: center; margin-bottom: 40px; }
            .fitbot-logo { font-size: 56px; margin-bottom: 16px; line-height: 1; }
            .fitbot-title { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 8px 0; }
            .fitbot-subtitle { font-size: 16px; color: #6b7280; margin: 0; }
            .fitbot-step { margin-bottom: 24px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; transition: all 0.2s; }
            .fitbot-step:hover { border-color: #d1d5db; }
            .fitbot-step h3 { margin-top: 0; font-size: 18px; color: #111827; display: flex; align-items: center; margin-bottom: 12px; }
            .fitbot-step h3 span { background: #2563eb; color: #fff; border-radius: 50%; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
            .fitbot-step p { color: #4b5563; margin-top: 0; margin-bottom: 16px; font-size: 15px; line-height: 1.5; }
            .fitbot-input { width: 100%; padding: 12px 16px; font-size: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; border: 2px solid #d1d5db; border-radius: 8px; box-sizing: border-box; transition: border-color 0.2s; background: #fff; }
            .fitbot-input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
            .fitbot-btn { display: inline-block; text-decoration: none; font-size: 15px; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; }
            .fitbot-btn-primary { background: #2563eb; color: #fff; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }
            .fitbot-btn-primary:hover { background: #1d4ed8; color: #fff; transform: translateY(-1px); }
            .fitbot-btn-primary:active { transform: translateY(0); }
            .fitbot-btn-secondary { background: #fff; color: #2563eb; border: 2px solid #e5e7eb; }
            .fitbot-btn-secondary:hover { border-color: #2563eb; color: #1d4ed8; background: #eff6ff; }
            .fitbot-success { background: #f0fdf4; border-color: #bbf7d0; }
            .fitbot-success h3 { color: #166534; }
            .fitbot-success h3 span { background: #22c55e; }
            .fitbot-error-msg { color: #dc2626; font-size: 14px; margin-top: 8px; display: none; font-weight: 500; }
            
            /* Admin notices override inside wrap to avoid breaking layout */
            .fitbot-wrap .notice { margin-left: 0; margin-right: 0; margin-bottom: 24px; border-radius: 8px; }
        </style>
        
        <div class="fitbot-wrap">
            <div class="fitbot-header">
                <div class="fitbot-logo">🤖</div>
                <h1 class="fitbot-title">FitBot Connection Setup</h1>
                <p class="fitbot-subtitle">Deploy your AI assistant to your website in seconds.</p>
            </div>
            
            <form action="options.php" method="post" id="fitbot-setup-form">
                <?php settings_fields('fitbot_settings'); ?>
                
                <?php if ($is_connected): ?>
                <div class="fitbot-step fitbot-success">
                    <h3><span>✓</span> Successfully Connected</h3>
                    <p style="margin-bottom: 0; color: #166534;">Your FitBot widget is active and rendering on your website. Your configured chat interface will appear in the bottom corner of all public pages.</p>
                </div>
                <?php
        endif; ?>

                <div class="fitbot-step">
                    <h3><span>1</span> Get your API Key</h3>
                    <p>Open your GymBot SaaS Portal. Navigate to the "Widget" tab or "API Keys" section to copy your unique installation key.</p>
                    <a href="https://gymbot-admin.vercel.app" target="_blank" class="fitbot-btn fitbot-btn-secondary">Open Admin Portal &rarr;</a>
                </div>

                <div class="fitbot-step">
                    <h3><span>2</span> Connect your Site</h3>
                    <p>Paste your API key below and save to link this WordPress site to your AI brain.</p>
                    <div style="margin-bottom: 16px;">
                        <label for="fitbot_api_key" style="display:block; font-weight:600; margin-bottom:4px;">API Key</label>
                        <input type="text" name="fitbot_api_key" id="fitbot_api_key" value="<?php echo esc_attr($api_key); ?>" class="fitbot-input" placeholder="Paste your API key here..." autocomplete="off">
                        <div id="fitbot_error" class="fitbot-error-msg">Please enter a valid API key.</div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label for="fitbot_api_url" style="display:block; font-weight:600; margin-bottom:4px;">Backend API URL</label>
                        <input type="url" name="fitbot_api_url" id="fitbot_api_url" value="<?php echo esc_url($api_url); ?>" class="fitbot-input" placeholder="e.g., https://gymbot-api.onrender.com/api">
                        <p style="font-size:13px; color:#6b7280; margin-top:4px;">Point to your local or live backend server.</p>
                    </div>

                    <div>
                        <label for="fitbot_script_url" style="display:block; font-weight:600; margin-bottom:4px;">Frontend Script URL</label>
                        <input type="url" name="fitbot_script_url" id="fitbot_script_url" value="<?php echo esc_url($script_url); ?>" class="fitbot-input" placeholder="e.g., https://your-demo-app.vercel.app/gymbot.min.js">
                        <p style="font-size:13px; color:#6b7280; margin-top:4px;">Point to your local or live Vercel deployment hosting <code>gymbot.min.js</code>.</p>
                    </div>
                </div>

                <div style="text-align: right; padding-top: 16px;">
                    <button type="submit" class="fitbot-btn fitbot-btn-primary" id="fitbot_submit">
                        <?php echo $is_connected ? 'Update Connection' : 'Save & Connect Widget'; ?>
                    </button>
                </div>
            </form>
        </div>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const input = document.getElementById('fitbot_api_key');
                const error = document.getElementById('fitbot_error');
                const submitBtn = document.getElementById('fitbot_submit');
                
                // Simple front-end validation to prevent accidental space entries or tiny corrupted strings
                input.addEventListener('input', function() {
                    const val = input.value.trim();
                    if (val.length > 0 && val.length < 10) { 
                        error.style.display = 'block';
                        submitBtn.style.opacity = '0.5';
                        submitBtn.style.pointerEvents = 'none';
                    } else {
                        error.style.display = 'none';
                        submitBtn.style.opacity = '1';
                        submitBtn.style.pointerEvents = 'auto';
                    }
                });
                // Listen for JSON pastes to auto-fill all three fields
                input.addEventListener('paste', function(e) {
                    try {
                        let pasteData = (e.clipboardData || window.clipboardData).getData('text');
                        let parsed = JSON.parse(pasteData);
                        
                        if (parsed && parsed.apiKey && parsed.apiUrl && parsed.scriptUrl) {
                            e.preventDefault(); // Stop normal paste
                            
                            document.getElementById('fitbot_api_key').value = parsed.apiKey;
                            document.getElementById('fitbot_api_url').value = parsed.apiUrl;
                            document.getElementById('fitbot_script_url').value = parsed.scriptUrl;
                            
                            // Flash success style to indicate auto-fill worked
                            input.style.backgroundColor = '#f0fdf4';
                            document.getElementById('fitbot_api_url').style.backgroundColor = '#f0fdf4';
                            document.getElementById('fitbot_script_url').style.backgroundColor = '#f0fdf4';
                            
                            setTimeout(() => {
                                input.style.backgroundColor = '#fff';
                                document.getElementById('fitbot_api_url').style.backgroundColor = '#fff';
                                document.getElementById('fitbot_script_url').style.backgroundColor = '#fff';
                            }, 1000);
                            
                            error.style.display = 'none';
                            submitBtn.style.opacity = '1';
                            submitBtn.style.pointerEvents = 'auto';
                        }
                    } catch (err) {
                        // Not JSON, just let the normal paste happen
                    }
                });
            });
        </script>
        <?php
    }

    public function inject_widget()
    {
        $api_key = get_option('fitbot_api_key');
        if (!$api_key) {
            return;
        }

        // Use configured URLs, falling back to local defaults if empty
        $api_url = get_option('fitbot_api_url');
        if (empty($api_url))
            $api_url = 'http://localhost:3000/api';

        $script_url = get_option('fitbot_script_url');
        if (empty($script_url))
            $script_url = 'http://localhost:5173/gymbot.min.js';

        // Add version busting to script URL to avoid aggressive caching
        $cache_buster = defined('FITBOT_DEV_MODE') && FITBOT_DEV_MODE ? time() : '1.1.0';
        $final_script_url = add_query_arg('v', $cache_buster, $script_url);

?>
        <script 
            src="<?php echo esc_url($final_script_url); ?>" 
            data-api-key="<?php echo esc_attr($api_key); ?>" 
            data-api-url="<?php echo esc_url($api_url); ?>"
            async>
        </script>
        <?php
    }
}

new FitBot_Widget();
