// @ts-ignore - Maptastic doesn't have type definitions
import * as maptastic from 'maptastic';
const Maptastic = (maptastic as any).Maptastic;

interface MaptasticInstance {
  setConfigEnabled(enabled: boolean): void;
  getLayout(): any[];
  setLayout(layout: any[]): void;
  resize(): void;
}

interface CuestationConfig {
  id: string;
  name: string;
  description?: string;
  showtimeResolution: {
    width: number;
    height: number;
  };
  mapping?: {
    layers?: Array<{
      targetPoints: number[][];
      sourcePoints: number[][];
    }>;
  };
}

class MappingEditor {
  private maptastic: MaptasticInstance | null = null;
  private cuestationName: string;
  private statusElement: HTMLElement | null = null;
  private updateTimer: number | null = null;
  private lastSentMapping: string = '';

  constructor() {
    // Get cuestation name from query string
    const urlParams = new URLSearchParams(window.location.search);
    this.cuestationName = urlParams.get('name') || '';
    
    this.statusElement = document.getElementById('status');
    
    if (!this.cuestationName) {
      this.showError('No cuestation name provided');
      return;
    }

    this.init();
  }

  private async init() {
    try {
      // Fetch the cuestation configuration
      const response = await fetch(`/api/cuestation/${this.cuestationName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cuestation: ${response.statusText}`);
      }
      
      const config: CuestationConfig = await response.json();
      
      // Create the target div for Maptastic
      const container = document.getElementById('mapping-container');
      if (!container) {
        throw new Error('Mapping container not found');
      }
      
      // Create the maptastic target div
      const targetDiv = document.createElement('div');
      targetDiv.id = 'maptastic-target';
      targetDiv.style.width = `${config.showtimeResolution.width}px`;
      targetDiv.style.height = `${config.showtimeResolution.height}px`;
      targetDiv.style.position = 'absolute';
      targetDiv.style.top = '50%';
      targetDiv.style.left = '50%';
      targetDiv.style.transform = 'translate(-50%, -50%)';
      targetDiv.style.background = 'rgba(255, 255, 255, 0.1)';
      container.appendChild(targetDiv);
      
      // Initialize Maptastic
      this.maptastic = new Maptastic({
        autoSave: false,
        autoLoad: false,
        crosshairs: true,
        labels: false,
        onchange: () => this.handleMappingChange()
      }, 'maptastic-target');
      
      // Apply existing mapping if available
      if (config.mapping?.layers?.[0] && this.maptastic) {
        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Denormalize target points from 0-1 to window pixels
        const denormalizedTargetPoints = config.mapping.layers[0].targetPoints.map((point: number[]) => [
          point[0] * windowWidth,
          point[1] * windowHeight
        ]);
        
        this.maptastic.setLayout([{
          id: 'maptastic-target',
          targetPoints: denormalizedTargetPoints,
          sourcePoints: config.mapping.layers[0].sourcePoints
        }]);
      } else {
        // Set default mapping - full window
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const sourceWidth = config.showtimeResolution.width;
        const sourceHeight = config.showtimeResolution.height;
        
        if (this.maptastic) {
          this.maptastic.setLayout([{
            id: 'maptastic-target',
            targetPoints: [[0, 0], [windowWidth, 0], [windowWidth, windowHeight], [0, windowHeight]],
            sourcePoints: [[0, 0], [sourceWidth, 0], [sourceWidth, sourceHeight], [0, sourceHeight]]
          }]);
        }
      }
      
      // Enable config mode
      if (this.maptastic) {
        this.maptastic.setConfigEnabled(true);
      }
      
      // Store initial mapping
      this.lastSentMapping = JSON.stringify(this.getCurrentMapping());
      
      // Set up window resize handler
      window.addEventListener('resize', () => {
        if (this.maptastic) {
          this.maptastic.resize();
        }
      });
      
      this.setStatus('Ready');
    } catch (error) {
      console.error('Failed to initialize mapping editor:', error);
      this.showError(`Failed to initialize: ${error}`);
    }
  }
  
  private getCurrentMapping() {
    if (!this.maptastic) return null;
    
    const layout = this.maptastic.getLayout();
    if (!layout || layout.length === 0) return null;
    
    // Get window dimensions for normalization
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Normalize target points from window pixels to 0-1 (or beyond for offscreen points)
    const normalizedTargetPoints = layout[0].targetPoints.map((point: number[]) => [
      point[0] / windowWidth,
      point[1] / windowHeight
    ]);
    
    return {
      layers: [{
        targetPoints: normalizedTargetPoints,
        sourcePoints: layout[0].sourcePoints
      }]
    };
  }
  
  private handleMappingChange() {
    // Clear any existing timer
    if (this.updateTimer) {
      window.clearTimeout(this.updateTimer);
    }
    
    // Debounce updates to avoid flooding the server
    this.updateTimer = window.setTimeout(() => {
      this.sendMappingUpdate();
    }, 100);
  }
  
  private async sendMappingUpdate() {
    const mapping = this.getCurrentMapping();
    if (!mapping) return;
    
    const mappingJson = JSON.stringify(mapping);
    
    // Only send if mapping has actually changed
    if (mappingJson === this.lastSentMapping) {
      return;
    }
    
    this.lastSentMapping = mappingJson;
    this.setStatus('Saving...', 'saving');
    
    try {
      // Send the mapping update to the server
      const response = await fetch(`/api/cuestation/${this.cuestationName}/mapping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: mappingJson
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save mapping: ${response.statusText}`);
      }
      
      this.setStatus('Saved');
      
      // Clear status after a short delay
      setTimeout(() => {
        this.setStatus('Ready');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save mapping:', error);
      this.setStatus(`Error: ${error}`, 'error');
    }
  }
  
  private setStatus(message: string, className?: string) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = className || '';
    }
  }
  
  private showError(message: string) {
    this.setStatus(message, 'error');
    const container = document.getElementById('mapping-container');
    if (container) {
      container.innerHTML = `<div style="color: white; text-align: center; padding: 50px;">
        <h2>Error</h2>
        <p>${message}</p>
      </div>`;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MappingEditor());
} else {
  new MappingEditor();
}