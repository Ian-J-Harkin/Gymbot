import { Component, Input, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const DEFAULT_SCRIPT_URL = 'https://cdn.fitbot.chat/widget/v1/gymbot.min.js'; // Placeholder URL

@Component({
  selector: 'fitbot-widget',
  template: '',
  standalone: true
})
export class FitbotAngular implements OnInit, OnDestroy {
  @Input() apiKey: string = '';
  @Input() apiUrl?: string;
  @Input() scriptUrl: string = DEFAULT_SCRIPT_URL;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    if (!this.apiKey) {
      console.error('[FitBot] apiKey is required');
      return;
    }

    // 1. Set global configuration for the script to pick up
    (window as any).FITBOT_API_KEY = this.apiKey;
    if (this.apiUrl) {
      (window as any).FITBOT_API_URL = this.apiUrl;
    }

    // 2. Check if script is already present
    const existingScript = this.document.querySelector(`script[src="${this.scriptUrl}"]`);

    if (!existingScript) {
      const script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'src', this.scriptUrl);
      this.renderer.setAttribute(script, 'async', 'true');
      this.renderer.setAttribute(script, 'data-api-key', this.apiKey);
      if (this.apiUrl) {
        this.renderer.setAttribute(script, 'data-api-url', this.apiUrl);
      }
      this.renderer.appendChild(this.document.body, script);
    }
  }

  ngOnDestroy(): void {
    // Clean up the floating UI root manually 
    // to prevent duplicate widget injection on fast route changes
    const widgetRoot = this.document.getElementById('fitbot-widget-root');
    if (widgetRoot && widgetRoot.parentNode) {
      this.renderer.removeChild(widgetRoot.parentNode, widgetRoot);
    }
  }
}
